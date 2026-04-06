import { AsyncStream } from "@pmate/utils"
import type {
  AgentFailOptions,
  AgentFinalOptions,
  AgentProgressOptions,
  StreamContext,
} from "./AgentTypes"

type StreamTaskContextHandlers = {
  progress: (payload: unknown, options?: AgentProgressOptions) => Promise<void>
  complete: (payload: unknown, options?: AgentFinalOptions) => Promise<void>
  fail: (message: string, options?: AgentFailOptions) => Promise<void>
}

export class StreamTaskContext implements StreamContext {
  public readonly input

  constructor(
    private readonly stream: AsyncStream<Uint8Array>,
    private readonly handlers: StreamTaskContextHandlers,
  ) {
    this.input = {
      bytes: () => this.stream,
      text: () => createTextStream(this.stream),
      json: <T = unknown>() => createJsonStream<T>(this.stream),
    }
  }

  public progress(payload: unknown, options?: AgentProgressOptions) {
    return this.handlers.progress(payload, options)
  }

  public complete(payload: unknown, options?: AgentFinalOptions) {
    return this.handlers.complete(payload, options)
  }

  public fail(message: string, options?: AgentFailOptions) {
    return this.handlers.fail(message, options)
  }
}

function createTextStream(input: AsyncStream<Uint8Array>): AsyncIterable<string> {
  return {
    async *[Symbol.asyncIterator]() {
      const decoder = new TextDecoder()
      for await (const bytes of input) {
        yield decoder.decode(bytes)
      }
    },
  }
}

function createJsonStream<T = unknown>(input: AsyncStream<Uint8Array>): AsyncIterable<T> {
  return {
    async *[Symbol.asyncIterator]() {
      const decoder = new TextDecoder()
      for await (const bytes of input) {
        const text = decoder.decode(bytes)
        yield JSON.parse(text) as T
      }
    },
  }
}
