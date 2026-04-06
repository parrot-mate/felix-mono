import type { AgentResponse } from "@pmate/meta"
import { AsyncStream, StreamEvent } from "@pmate/utils"

export type AgentTaskFailMode = "resolve-null" | "reject"
export type AgentTaskTimeoutMode = "resolve-null" | "reject"

export type AgentTaskHandle<TFinal = unknown> = {
  waiter: Promise<TFinal | null>
  onProgress: (cb: (data: unknown) => void) => void
}

type AgentTaskOptions = {
  timeoutMs: number
  failMode: AgentTaskFailMode
  timeoutMode?: AgentTaskTimeoutMode
  onFail?: (message: string) => void
}

type AgentTaskContext<TFinal = unknown> = {
  id: string
  stream: AsyncStream<StreamEvent<unknown, TFinal>>
  options: AgentTaskOptions
  timeoutId: ReturnType<typeof setTimeout> | null
  done: boolean
  handlers: Array<(data: unknown) => void>
  resolve: (value: TFinal | null) => void
  reject: (reason?: unknown) => void
}

export class AgentTaskManager {
  private tasks = new Map<string, AgentTaskContext<any>>()

  has(id: string) {
    return this.tasks.has(id)
  }

  createTask<TFinal = unknown>(
    id: string,
    options: AgentTaskOptions
  ): AgentTaskHandle<TFinal> {
    if (this.tasks.has(id)) {
      throw new Error(`Task with ID ${id} is already in progress`)
    }

    const stream = new AsyncStream<StreamEvent<unknown, TFinal>>()
    let resolve!: (value: TFinal | null) => void
    let reject!: (reason?: unknown) => void
    const waiter = new Promise<TFinal | null>((res, rej) => {
      resolve = res
      reject = rej
    })

    const task: AgentTaskContext<TFinal> = {
      id,
      stream,
      options,
      timeoutId: null,
      done: false,
      handlers: [],
      resolve,
      reject,
    }

    task.timeoutId = setTimeout(() => {
      this.handleTimeout(task)
    }, options.timeoutMs)

    this.tasks.set(id, task)
    void this.consumeTaskStream(task)

    return {
      waiter,
      onProgress: (cb) => {
        task.handlers.push(cb)
      },
    }
  }

  handleResponse(body: unknown) {
    if (!body || typeof body !== "object") {
      return
    }

    const maybe = body as Partial<AgentResponse> & { taskId?: unknown }
    const id = maybe.taskId
    if (typeof id !== "string") {
      return
    }
    console.log("[agent-task-manager] handleResponse", {
      id,
      isFinal: maybe.isFinal,
      success: maybe.success,
      type: (maybe as any).type,
    })

    const task = this.tasks.get(id)
    if (!task) {
      console.log("[agent-task-manager] missing task for response", { id })
      return
    }

    if (maybe.isFinal === false) {
      this.pushEvent(task, { type: "progress", data: (maybe as any).payload })
      return
    }

    const response = maybe as AgentResponse
    console.log("[agent-task] final", {
      id: task.id,
      success: response.success,
      isFinal: response.isFinal,
      type: response.type,
      contentEncoding: response.contentEncoding,
      payloadKind:
        response.payload == null
          ? "null"
          : response.payload instanceof Uint8Array
            ? `uint8array:${response.payload.length}`
            : Array.isArray(response.payload)
              ? `array:${response.payload.length}`
              : typeof response.payload,
    })

    if (response.success === false) {
      const message = response.message ?? ""
      task.options.onFail?.(message)
      if (task.options.failMode === "reject") {
        task.stream.error(new Error(message))
        return
      }
      this.pushEvent(task, { type: "final", data: null })
      task.stream.end()
      return
    }

    this.pushEvent(task, {
      type: "final",
      data: response.payload,
    })
    task.stream.end()
  }

  private async consumeTaskStream<TFinal>(task: AgentTaskContext<TFinal>) {
    try {
      for await (const event of task.stream) {
        if (event.type === "progress") {
          console.log("[agent-task] progress", {
            id: task.id,
            dataType:
              event.data == null
                ? "null"
                : event.data instanceof Uint8Array
                  ? `uint8array:${event.data.length}`
                  : Array.isArray(event.data)
                    ? `array:${event.data.length}`
                    : typeof event.data,
          })
          task.handlers.forEach((h) => h(event.data))
          continue
        }

        this.resolveTask(task, event.data as TFinal | null)
      }
    } catch (error) {
      this.rejectTask(task, error)
    } finally {
      this.finishTask(task)
    }
  }

  private handleTimeout<TFinal>(task: AgentTaskContext<TFinal>) {
    if (task.done) {
      return
    }
    console.log("[agent-task] timeout", {
      id: task.id,
      timeoutMode: task.options.timeoutMode ?? "resolve-null",
    })

    const timeoutMode = task.options.timeoutMode ?? "resolve-null"
    if (timeoutMode === "reject") {
      task.stream.error(new Error("timeout"))
      return
    }
    this.pushEvent(task, { type: "final", data: null })
    task.stream.end()
  }

  private resolveTask<TFinal>(task: AgentTaskContext<TFinal>, value: TFinal | null) {
    if (task.done) {
      return
    }
    task.done = true
    this.clearTaskTimeout(task)
    task.resolve(value)
  }

  private rejectTask<TFinal>(task: AgentTaskContext<TFinal>, reason: unknown) {
    if (task.done) {
      return
    }
    task.done = true
    this.clearTaskTimeout(task)
    task.reject(reason)
  }

  private finishTask<TFinal>(task: AgentTaskContext<TFinal>) {
    this.clearTaskTimeout(task)
    this.tasks.delete(task.id)
  }

  private clearTaskTimeout<TFinal>(task: AgentTaskContext<TFinal>) {
    if (!task.timeoutId) {
      return
    }
    clearTimeout(task.timeoutId)
    task.timeoutId = null
  }

  private pushEvent<TFinal>(
    task: AgentTaskContext<TFinal>,
    event: StreamEvent<unknown, TFinal>
  ) {
    if (task.stream.state === "closed") {
      return
    }
    try {
      task.stream.push(event)
    } catch {
      // Ignore push errors when task stream is not writable.
    }
  }
}
