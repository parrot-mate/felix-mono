import type { PipelineResponse } from "@pmate/meta"

export type PipelineTaskFailMode = "resolve-null" | "reject"
export type PipelineTaskTimeoutMode = "resolve-null" | "reject"

export type PipelineTaskHandle<TFinal = unknown> = {
  waiter: Promise<TFinal | null>
  onProgress: (cb: (data: unknown) => void) => void
}

type PipelineTaskOptions = {
  timeoutMs: number
  failMode: PipelineTaskFailMode
  timeoutMode?: PipelineTaskTimeoutMode
  onFail?: (message: string) => void
}

class PipelineTask<TFinal = unknown> {
  private done = false
  private handlers: Array<(data: unknown) => void> = []
  private timeoutId: ReturnType<typeof setTimeout> | null = null

  private resolveFn: ((value: TFinal | null) => void) | null = null
  private rejectFn: ((reason?: unknown) => void) | null = null

  readonly waiter: Promise<TFinal | null>

  constructor(
    readonly id: string,
    private options: PipelineTaskOptions,
    private onDone: (id: string) => void
  ) {
    this.waiter = new Promise<TFinal | null>((resolve, reject) => {
      this.resolveFn = resolve
      this.rejectFn = reject
    })

    this.timeoutId = setTimeout(() => {
      this.handleTimeout()
    }, options.timeoutMs)
  }

  onProgress(cb: (data: unknown) => void) {
    this.handlers.push(cb)
  }

  handleProgress(data: unknown) {
    if (this.done) {
      return
    }
    this.handlers.forEach((h) => h(data))
  }

  handleFinal(response: PipelineResponse) {
    if (this.done) {
      return
    }

    if (response.success === false) {
      const message = response.message ?? ""
      this.options.onFail?.(message)
      if (this.options.failMode === "reject") {
        this.settleReject(new Error(message))
        return
      }
      this.settleResolve(null)
      return
    }

    this.settleResolve(response.data as TFinal)
  }

  private handleTimeout() {
    if (this.done) {
      return
    }

    const timeoutMode = this.options.timeoutMode ?? "resolve-null"
    if (timeoutMode === "reject") {
      this.settleReject(new Error("timeout"))
      return
    }
    this.settleResolve(null)
  }

  private settleResolve(value: TFinal | null) {
    if (this.done) {
      return
    }
    this.done = true
    this.clearTimeout()
    this.onDone(this.id)
    this.resolveFn?.(value)
  }

  private settleReject(reason: unknown) {
    if (this.done) {
      return
    }
    this.done = true
    this.clearTimeout()
    this.onDone(this.id)
    this.rejectFn?.(reason)
  }

  private clearTimeout() {
    if (!this.timeoutId) {
      return
    }
    clearTimeout(this.timeoutId)
    this.timeoutId = null
  }
}

export class PipelineTaskManager {
  private tasks = new Map<string, PipelineTask<any>>()

  has(id: string) {
    return this.tasks.has(id)
  }

  createTask<TFinal = unknown>(
    id: string,
    options: PipelineTaskOptions
  ): PipelineTaskHandle<TFinal> {
    if (this.tasks.has(id)) {
      throw new Error(`Task with ID ${id} is already in progress`)
    }

    const task = new PipelineTask<TFinal>(id, options, (taskId) => {
      this.tasks.delete(taskId)
    })
    this.tasks.set(id, task)

    return {
      waiter: task.waiter,
      onProgress: (cb) => {
        task.onProgress(cb)
      },
    }
  }

  handleResponse(body: unknown) {
    if (!body || typeof body !== "object") {
      return
    }

    const maybe = body as Partial<PipelineResponse> & { id?: unknown }
    const id = maybe.id
    if (typeof id !== "string") {
      return
    }

    const task = this.tasks.get(id)
    if (!task) {
      return
    }

    if (maybe.type === "progress") {
      task.handleProgress((maybe as any).data)
      return
    }

    task.handleFinal(maybe as PipelineResponse)
  }
}
