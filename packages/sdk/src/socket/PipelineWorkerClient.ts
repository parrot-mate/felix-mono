import {
  HashType,
  Logger,
  lru,
  Msg,
  uniqHash,
  WebsocketEvents,
  type RealtimeClient,
} from "@pmate/utils"
import { AccountManagerV2, resolveAppId } from "@pmate/account-sdk"
import { PipelineOp, type Msg as MsgType } from "@pmate/meta"
import { getRealtimeClient } from "@sdk/atom/realtimeClientAtom"
import { Endpoints } from "@sdk/config"
import { AsyncStream, StreamEvent } from "@pmate/utils"
import { PipelineTaskManager } from "./PipelineTaskManager"

const logger = Logger.getDebugger("PipelineWorkerClient")

export type PipelineStreamTask<TChunk = Blob> = {
  to: string
  stream: AsyncStream<TChunk>
  meta?: Record<string, unknown>
  minChunkSizeBytes?: number
}

export class PipelineWorkerClient {
  private ws: RealtimeClient
  private from: string
  private tasks = new PipelineTaskManager()
  private requestCached: (to: string, data: any) => Promise<any>

  public constructor(from: string, ws: RealtimeClient) {
    this.ws = ws
    this.from = from
    this.request = this.request.bind(this)
    this.requestCached = lru(this.run.bind(this), {
      ttl: 600_000,
      key: (to, data) => JSON.stringify([to, data]),
    })

    this.ws.on<MsgType<any>>(WebsocketEvents.Message, (message) => {
      const taskId = message.body.id
      logger.log("recv", message, taskId)
      this.tasks.handleResponse(message.body)
    })
  }

  public on<T>(event: WebsocketEvents, handler: (data: T) => void) {
    return this.ws.on(event, handler)
  }

  public isConnected() {
    return this.ws.isConnected()
  }

  public close() {
    this.ws.close()
  }

  public async request(to: string, data: any) {
    logger.log("keys", to, data)
    const waiter = await this.requestCached(to, data)
    return await waiter
  }

  public async run(to: string, data: any) {
    const rnd = Math.floor(Math.random() * 1_000_000_000_000)
    const taskId = uniqHash(`${to}-${Date.now()}-${rnd}`, HashType.Task)

    const task = this.tasks.createTask<any>(taskId, {
      timeoutMs: 40_000,
      failMode: "resolve-null",
      onFail: (message) => {
        console.error("Task failed", to, data, `msg=${message}`)
      },
    })

    const msg = Msg.createPipeline({
      from: this.from,
      to,
      id: taskId,
      op: PipelineOp.Start,
      data,
    })
    logger.log("send msg", msg)
    this.ws.sendMsg(msg)
    return task.waiter
  }

  public stream(task: PipelineStreamTask) {
    const to = task.to
    const taskId = uniqHash(
      `${this.from}/${to}/${Date.now()}/${Math.random()}`,
      HashType.Task,
    )

    const { waiter, onProgress } = this.tasks.createTask<any>(taskId, {
      timeoutMs: 120_000,
      failMode: "reject",
      timeoutMode: "resolve-null",
    })

    let isFirst = true
    const meta = task.meta
    const from = this.from
    const ws = this.ws
    const minChunkSizeBytes = task.minChunkSizeBytes ?? 1024 * 1024
    const chunkedStream = AsyncStream.chunkBlob(task.stream, {
      minBytes: minChunkSizeBytes,
    })
    logger.log("Sending task", taskId)
    const stream = new AsyncStream<StreamEvent<any, any>>()
    onProgress((data) => {
      stream.push({ type: "progress", data })
    })
    waiter
      .then((finalData) => {
        stream.push({ type: "final", data: finalData })
        stream.end()
      })
      .catch((err) => {
        stream.error(err)
      })

    async function startDataStream() {
      for await (const payload of chunkedStream) {
        const op = isFirst ? PipelineOp.Start : PipelineOp.Data
        const msg = Msg.createPipeline({
          from,
          to,
          id: taskId,
          op,
          data: payload,
          meta: op === PipelineOp.Start ? meta : undefined,
        })
        ws.sendMsg(msg)
        logger.log("find chunk", payload.size)
        isFirst = false
      }

      const endMsg = Msg.createPipeline({
        from,
        to,
        id: taskId,
        op: PipelineOp.End,
        data: null,
      })
      ws.sendMsg(endMsg)
    }
    startDataStream()

    const pipelineStream = stream as AsyncStream<StreamEvent<any, any>> & {
      finish: () => Promise<any>
    }
    const waitForClose = () => {
      if (stream.state === "closed") {
        return Promise.resolve()
      }
      return new Promise<void>((resolve) => {
        const off = stream.on("close", () => {
          off()
          resolve()
        })
      })
    }
    pipelineStream.finish = async () => {
      const result = await waiter
      await waitForClose()
      return result
    }
    return pipelineStream
  }

  public static async current() {
    const user = await AccountManagerV2.get(resolveAppId()).getLocalProfile()
    const uid = user?.id
    if (!uid) {
      throw new Error("no user")
    }
    const ws = getRealtimeClient(Endpoints.hub, user.id)
    return new PipelineWorkerClient(uid, ws)
  }
}
