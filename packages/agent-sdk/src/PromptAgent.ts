import { PipelineOp, type AgentRequest } from "@pmate/meta"
import type { Msg as MsgType } from "@pmate/meta"
import { AgentService } from "./AgentService"
import { AgentRuntime } from "./AgentRuntime"
import { PromptTaskContext } from "./PromptTaskContext"
import type {
  AgentLifecycle,
  CreatePromptAgentOptions,
  PromptContext,
  PromptTaskState,
} from "./AgentTypes"

export class PromptAgent implements AgentLifecycle {
  private readonly runtime: AgentRuntime
  public readonly on: AgentLifecycle["on"]
  public readonly onAll: AgentLifecycle["onAll"]

  constructor(private readonly options: CreatePromptAgentOptions) {
    this.runtime = new AgentRuntime(options)
    this.runtime.setRequestHandler((msg) => this.handleRequest(msg))
    this.on = this.runtime.on.bind(this.runtime)
    this.onAll = this.runtime.onAll.bind(this.runtime)
  }

  public start() {
    return this.runtime.start()
  }

  public stop() {
    this.runtime.stop()
  }

  public isRunning() {
    return this.runtime.isRunning()
  }

  private async handleRequest(msg: MsgType<any>) {
    const req = msg.body as AgentRequest
    if (req.op !== PipelineOp.Start) {
      await this.runtime.sendUnsupportedMode(msg as MsgType<any>, "prompt")
      return
    }

    const agent = await AgentService.getAgent(req.agentId)

    const state: PromptTaskState = {
      taskId: req.taskId,
      from: msg.from,
      finalized: false,
      start: {
        taskId: req.taskId,
        agentId: req.agentId,
        from: msg.from,
        type: req.type,
        contentEncoding: req.contentEncoding,
        payload: req.payload,
      },
    }

    this.runtime.emit("task:start", {
      taskId: state.taskId,
      from: state.from,
      mode: "prompt",
    })

    const ctx: PromptContext = new PromptTaskContext(state.start, agent, {
      progress: async (payload, progressOptions) => {
        await this.runtime.sendProgress(state, payload, progressOptions)
      },
      final: async (payload, finalOptions) => {
        await this.runtime.sendFinal(state, payload, finalOptions)
      },
      fail: async (message, failOptions) => {
        await this.runtime.sendFail(state, message, failOptions)
      },
    })

    try {
      const output = await this.options.onPrompt(ctx)
      if (!state.finalized) {
        await this.runtime.sendFinal(state, output ?? null)
      }
      this.runtime.emit("task:end", {
        taskId: state.taskId,
        mode: "prompt",
        success: true,
      })
    } catch (error) {
      this.options.onError?.(error as Error, ctx)
      await this.runtime.sendFail(state, (error as Error)?.message ?? "prompt handler failed")
      this.runtime.emit("task:end", {
        taskId: state.taskId,
        mode: "prompt",
        success: false,
      })
    }
  }
}
