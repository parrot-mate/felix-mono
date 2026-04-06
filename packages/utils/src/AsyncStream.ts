export type AsyncStreamCloseReason = "end" | "error" | "consumer"

export type StreamEvent<TProgress = unknown, TFinal = unknown> =
  | { type: "progress"; data: TProgress }
  | { type: "final"; data: TFinal | null }

export type AsyncStreamEventMap = {
  /**
   * Producer called end(); consumer may still drain queued items.
   */
  endRequested: void
  /**
   * Consumer drained the queue after endRequested and iteration completed.
   */
  end: void
  /**
   * Producer called error(err); iteration will throw.
   */
  error: unknown
  /**
   * Stream is fully closed and will no longer yield values.
   */
  close: { reason: AsyncStreamCloseReason }
}

type Handler<T> = (payload: T) => void

type StreamState = "open" | "ending" | "errored" | "closed"

export class AsyncStream<T> implements AsyncIterable<T> {
  static chunkBlob(
    source: AsyncStream<Blob>,
    options?: { minBytes?: number }
  ): AsyncStream<Blob> {
    const minBytes = options?.minBytes ?? 0
    const output = new AsyncStream<Blob>()

    ;(async () => {
      const buffered: Blob[] = []
      let bufferedBytes = 0
      const flush = (force = false) => {
        if (bufferedBytes === 0) {
          return
        }
        if (!force && minBytes > 0 && bufferedBytes < minBytes) {
          return
        }

        const payload =
          buffered.length === 1
            ? buffered[0]
            : new Blob(buffered, { type: buffered[0]?.type })
        buffered.length = 0
        bufferedBytes = 0
        output.push(payload)
      }

      try {
        for await (const blob of source) {
          buffered.push(blob)
          bufferedBytes += blob.size
          flush()
        }

        flush(true)
        output.end()
      } catch (error) {
        output.error(error)
      }
    })()

    return output
  }

  private queue: T[] = []
  private stateInternal: StreamState = "open"
  private errorValue: unknown | null = null

  private waiting: Array<{
    resolve: (value: IteratorResult<T>) => void
    reject: (reason?: any) => void
  }> = []

  private listeners: Partial<
    Record<keyof AsyncStreamEventMap, Set<Handler<any>>>
  > = {}

  private iteratorCreated = false

  get length() {
    return this.queue.length
  }

  get state(): StreamState {
    return this.stateInternal
  }

  on<K extends keyof AsyncStreamEventMap>(
    event: K,
    handler: (payload: AsyncStreamEventMap[K]) => void
  ) {
    const set = (this.listeners[event] ??= new Set<Handler<any>>())
    set.add(handler as Handler<any>)
    return () => {
      set.delete(handler as Handler<any>)
    }
  }

  push(value: T) {
    if (this.stateInternal !== "open") {
      throw new Error(
        `AsyncStream is not writable (state=${this.stateInternal})`
      )
    }

    const waiter = this.waiting.shift()
    if (waiter) {
      waiter.resolve({ value, done: false })
      return true
    }

    this.queue.push(value)
    return true
  }

  pipe(value: T) {
    return this.push(value)
  }

  end() {
    if (this.stateInternal === "closed") {
      return
    }
    if (this.stateInternal === "errored") {
      return
    }
    if (this.stateInternal === "ending") {
      return
    }

    this.stateInternal = "ending"
    this.emit("endRequested", undefined)

    // If consumer is currently waiting and there is nothing to drain, finish now.
    if (this.queue.length === 0) {
      this.finishEndIfDrained()
    }
  }

  error(err: unknown) {
    if (this.stateInternal === "closed") {
      return
    }
    if (this.stateInternal === "errored") {
      return
    }

    this.stateInternal = "errored"
    this.errorValue = err
    this.emit("error", err)

    const waiting = this.waiting
    this.waiting = []
    waiting.forEach((w) => w.reject(err))

    this.finishClose("error")
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    if (this.iteratorCreated) {
      throw new Error("AsyncStream only supports a single consumer")
    }
    this.iteratorCreated = true

    return {
      next: () => this.nextInternal(),
      return: () => this.returnInternal(),
      throw: (err?: unknown) => this.throwInternal(err),
    }
  }

  private nextInternal(): Promise<IteratorResult<T>> {
    if (this.stateInternal === "errored") {
      return Promise.reject(this.errorValue)
    }
    if (this.stateInternal === "closed") {
      return Promise.resolve({ value: undefined as any, done: true })
    }

    if (this.queue.length > 0) {
      const value = this.queue.shift() as T
      // If this was the last queued value and end was requested, complete now.
      if (this.queue.length === 0) {
        this.finishEndIfDrained()
      }
      return Promise.resolve({ value, done: false })
    }

    if (this.stateInternal === "ending") {
      // Nothing left to drain.
      this.finishEndIfDrained()
      return Promise.resolve({ value: undefined as any, done: true })
    }

    return new Promise<IteratorResult<T>>((resolve, reject) => {
      this.waiting.push({ resolve, reject })
    })
  }

  private returnInternal(): Promise<IteratorResult<T>> {
    if (this.stateInternal === "closed") {
      return Promise.resolve({ value: undefined as any, done: true })
    }

    this.queue.length = 0

    const waiting = this.waiting
    this.waiting = []
    waiting.forEach((w) => w.resolve({ value: undefined as any, done: true }))

    this.finishClose("consumer")
    return Promise.resolve({ value: undefined as any, done: true })
  }

  private throwInternal(err?: unknown): Promise<IteratorResult<T>> {
    // Treat as consumer closing; propagate error to caller.
    this.returnInternal()
    return Promise.reject(err)
  }

  private finishEndIfDrained() {
    if (this.stateInternal !== "ending") {
      return
    }
    if (this.queue.length !== 0) {
      return
    }

    const waiting = this.waiting
    this.waiting = []
    waiting.forEach((w) => w.resolve({ value: undefined as any, done: true }))

    this.emit("end", undefined)
    this.finishClose("end")
  }

  private finishClose(reason: AsyncStreamCloseReason) {
    if (this.stateInternal === "closed") {
      return
    }
    this.stateInternal = "closed"
    this.emit("close", { reason })

    // Ensure no more waiters hang around.
    const waiting = this.waiting
    this.waiting = []
    waiting.forEach((w) => w.resolve({ value: undefined as any, done: true }))
  }

  private emit<K extends keyof AsyncStreamEventMap>(
    event: K,
    payload: AsyncStreamEventMap[K]
  ) {
    const set = this.listeners[event]
    if (!set || set.size === 0) {
      return
    }
    for (const handler of set) {
      handler(payload)
    }
  }
}
