import { PipelineOp, type AgentRequest } from "@pmate/meta"
import { AsyncStream } from "@pmate/utils"
import { gunzipSync } from "zlib"
import { AgentRuntime } from "./AgentRuntime"
import { StreamTaskContext } from "./StreamTaskContext"
import type {
  AgentLifecycle,
  CreateStreamAgentOptions,
  StreamContext,
  StreamTaskState,
} from "./AgentTypes"

export class StreamAgent implements AgentLifecycle {
  private readonly runtime: AgentRuntime
  private readonly tasks = new Map<string, StreamTaskState>()
  public readonly on: AgentLifecycle["on"]
  public readonly onAll: AgentLifecycle["onAll"]

  constructor(private readonly options: CreateStreamAgentOptions) {
    this.runtime = new AgentRuntime(options)
    this.runtime.setRequestHandler((msg) => this.handleRequest(msg.body as AgentRequest, msg.from, msg))
    this.on = this.runtime.on.bind(this.runtime)
    this.onAll = this.runtime.onAll.bind(this.runtime)
  }

  public start() {
    return this.runtime.start()
  }

  public stop() {
    for (const task of this.tasks.values()) {
      task.input.end()
    }
    this.tasks.clear()
    this.runtime.stop()
  }

  public isRunning() {
    return this.runtime.isRunning()
  }

  private async handleRequest(req: AgentRequest, from: string, msg: any) {
    if (req.op === PipelineOp.Start) {
      const input = new AsyncStream<Uint8Array>()
      const state: StreamTaskState = {
        taskId: req.taskId,
        from,
        finalized: false,
        start: {
          taskId: req.taskId,
          agentId: req.agentId,
          from,
          type: req.type,
          contentEncoding: req.contentEncoding,
          params: req.payload,
        },
        input,
      }
      this.tasks.set(req.taskId, state)

      this.runtime.emit("task:start", {
        taskId: state.taskId,
        from: state.from,
        mode: "stream",
      })

      const ctx: StreamContext = new StreamTaskContext(state.input, {
        progress: async (payload, progressOptions) => {
          await this.runtime.sendProgress(state, payload, progressOptions)
        },
        complete: async (payload, finalOptions) => {
          await this.runtime.sendFinal(state, payload, finalOptions)
        },
        fail: async (message, failOptions) => {
          await this.runtime.sendFail(state, message, failOptions)
        },
      })

      void (async () => {
        try {
          const output = await this.options.onStream(state.start, ctx)
          if (!state.finalized) {
            await this.runtime.sendFinal(state, output ?? null)
          }
          this.runtime.emit("task:end", {
            taskId: state.taskId,
            mode: "stream",
            success: true,
          })
        } catch (error) {
          this.options.onError?.(error as Error, state.start, ctx)
          await this.runtime.sendFail(state, (error as Error)?.message ?? "stream handler failed")
          this.runtime.emit("task:end", {
            taskId: state.taskId,
            mode: "stream",
            success: false,
          })
        } finally {
          this.tasks.delete(state.taskId)
        }
      })()
      return
    }

    const state = this.tasks.get(req.taskId)
    if (!state) {
      await this.runtime.sendUnsupportedMode(msg, "stream")
      return
    }

    if (req.op === PipelineOp.Data) {
      const chunk = await decodeBinaryPayload(req.payload, req.contentEncoding)
      state.input.push(chunk)
      return
    }

    if (req.op === PipelineOp.End) {
      state.input.end()
    }
  }
}

async function decodeBinaryPayload(
  payload: unknown,
  contentEncoding?: string,
): Promise<Uint8Array> {
  const encoded = await toBytes(payload)
  if (contentEncoding === "gzip" && encoded.length > 0) {
    return new Uint8Array(gunzipSync(encoded))
  }
  return encoded
}

async function toBytes(payload: unknown): Promise<Uint8Array> {
  if (payload == null) {
    return new Uint8Array()
  }

  if (payload instanceof Uint8Array) {
    return payload
  }

  if (ArrayBuffer.isView(payload)) {
    return new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength)
  }

  if (payload instanceof ArrayBuffer) {
    return new Uint8Array(payload)
  }

  if (typeof Blob !== "undefined" && payload instanceof Blob) {
    return new Uint8Array(await payload.arrayBuffer())
  }

  if (typeof payload === "string") {
    return new TextEncoder().encode(payload)
  }

  if (Array.isArray(payload) && payload.every((item) => typeof item === "number")) {
    return Uint8Array.from(payload)
  }

  throw new Error("Unsupported binary payload")
}
