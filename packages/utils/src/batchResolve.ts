import { Cache } from './Cache'

type PendingBatchItem<TInput, TOutput> = {
  input: TInput
  resolve: (value: TOutput) => void
  reject: (reason?: unknown) => void
}

export type BatchResolverOptions<TInput, TOutput> = {
  windowMs: number
  resolver: (inputs: TInput[]) => Promise<TOutput[]>
}

/**
 * Creates a resolver that batches calls made within a time window.
 */
export function batchResolver<TInput, TOutput>(options: BatchResolverOptions<TInput, TOutput>) {
  const queue: Array<PendingBatchItem<TInput, TOutput>> = []
  let timer: ReturnType<typeof setTimeout> | null = null

  const flush = async () => {
    const batch = queue.splice(0)
    timer = null

    if (!batch.length) {
      return
    }

    let results: TOutput[]
    try {
      results = await options.resolver(batch.map((item) => item.input))
    } catch (error) {
      batch.forEach(({ reject }) => reject(error))
      return
    }

    if (results.length !== batch.length) {
      const error = new Error('batchResolver resolver must return matching output length')
      batch.forEach(({ reject }) => reject(error))
      return
    }

    batch.forEach(({ resolve }, index) => {
      resolve(results[index])
    })
  }

  return (input: TInput) => {
    return new Promise<TOutput>((resolve, reject) => {
      queue.push({ input, resolve, reject })

      if (!timer) {
        timer = setTimeout(flush, options.windowMs)
      }
    })
  }
}

export type LruBatchOptions<TInput> = {
  key: (input: TInput) => string
  ttl: number
}

/**
 * Wraps a batch resolver with an LRU cache keyed per input, keeping response ordering intact.
 */
export function lruBatch<TInput, TOutput>(
  resolver: (inputs: TInput[]) => Promise<TOutput[]>,
  options: LruBatchOptions<TInput>,
) {
  const cache = new Cache<string, { value: TOutput }>({
    ttl: options.ttl,
  })

  return async (inputs: TInput[]) => {
    if (!Array.isArray(inputs)) {
      throw new Error('lruBatch expects array inputs')
    }

    if (inputs.length === 0) {
      return [] as TOutput[]
    }

    const outputs = new Array<TOutput | undefined>(inputs.length)
    const pendingByKey = new Map<string, { input: TInput; key: string; positions: number[] }>()
    const pendingOrder: Array<{ input: TInput; key: string; positions: number[] }> = []

    inputs.forEach((input, index) => {
      const key = options.key(input)
      const cached = cache.get(key)

      if (cached) {
        outputs[index] = cached.value
        return
      }

      const existing = pendingByKey.get(key)

      if (existing) {
        existing.positions.push(index)
        return
      }

      const entry = { input, key, positions: [index] }
      pendingByKey.set(key, entry)
      pendingOrder.push(entry)
    })

    if (pendingOrder.length) {
      const pendingInputs = pendingOrder.map((entry) => entry.input)
      const resolved = await resolver(pendingInputs)

      if (resolved.length !== pendingInputs.length) {
        throw new Error('lruBatch resolver must return matching output length')
      }

      pendingOrder.forEach((entry, idx) => {
        const value = resolved[idx]
        cache.set(entry.key, { value })
        entry.positions.forEach((position) => {
          outputs[position] = value
        })
      })
    }

    const normalizedOutputs: TOutput[] = []

    outputs.forEach((value, index) => {
      if (value === undefined) {
        throw new Error(`lruBatch missing output for index ${index}`)
      }

      normalizedOutputs[index] = value
    })

    return normalizedOutputs
  }
}
