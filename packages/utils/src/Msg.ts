import { decode as decodeMessagePack, encode as encodeMessagePack } from "@msgpack/msgpack"
import {
  MsgKind,
  MsgOp,
  PipelineOp,
  type Msg as MsgType,
  type MsgBodyMap,
  type MsgSendOptions,
} from "@pmate/meta"

import { gzipEncodeBlob } from "./compress"
import { HashType, uniqHash } from "./uniqHash"

export type MsgTransportKind = "websocket" | "h3"

type MaybeBinary = Uint8Array | ArrayBuffer | Blob

const encoder = new TextEncoder()

export class Msg {
  private static seq = 0

  static create<T extends MsgOp>(
    from: string,
    to: string,
    opcode: MsgOp,
    body: MsgBodyMap[T],
    kind: MsgKind = MsgKind.DM,
    options?: MsgSendOptions
  ): MsgType<T> {
    const seq = Msg.nextSeq()
    const msg: MsgType<any> = {
      hash: "",
      t: Date.now(),
      from,
      to,
      body,
      kind,
      opcode,
      pending: options?.pending,
      quote: options?.quote,
    }

    msg.hash = Msg.hash(msg, seq)
    return msg
  }

  static createPipeline(params: {
    from: string
    to: string
    id: string
    op: PipelineOp
    data: unknown
    meta?: Record<string, unknown>
    options?: MsgSendOptions
  }): MsgType<MsgOp.PIPELINE_CALL> {
    const { from, to, id, op, data, meta, options } = params
    return Msg.create(
      from,
      to,
      MsgOp.PIPELINE_CALL,
      {
        id,
        op,
        data,
        ...(meta ? { meta } : {}),
      },
      MsgKind.PIPELINE,
      options
    )
  }

  static async toWire(
    msg: MsgType<any>,
    transport: MsgTransportKind
  ): Promise<Uint8Array> {
    if (transport === "websocket") {
      const normalized = await Msg.normalizeForWire(msg)
      return encodeMessagePack(normalized) as Uint8Array
    }

    const normalized = await Msg.normalizeForWire(msg)
    return encoder.encode(JSON.stringify(normalized) + "\n")
  }

  static decodeWire(
    input: string | Uint8Array | ArrayBuffer,
    transport: MsgTransportKind
  ): MsgType<any> {
    if (typeof input === "string") {
      return JSON.parse(input) as MsgType<any>
    }

    if (transport === "websocket") {
      const view = input instanceof Uint8Array ? input : new Uint8Array(input)
      return decodeMessagePack(view) as MsgType<any>
    }

    const text = new TextDecoder().decode(
      input instanceof Uint8Array ? input : new Uint8Array(input)
    )
    return JSON.parse(text) as MsgType<any>
  }

  private static hash(msg: MsgType<any>, seq: number) {
    const info = `${msg.t}:${msg.from}:${msg.to}:${msg.opcode}:${msg.quote}:${seq}`
    return uniqHash(info, HashType.MSG)
  }

  private static nextSeq() {
    Msg.seq = (Msg.seq + 1) % Number.MAX_SAFE_INTEGER
    return Msg.seq
  }

  private static async normalizeForWire(msg: MsgType<any>): Promise<MsgType<any>> {
    const body: any = msg.body
    if (!body || typeof body !== "object") {
      return msg
    }

    // Default gzip flow: when body.payload is binary, gzip it before encoding.
    if ("payload" in body && "type" in body) {
      const payload = (body as { payload?: unknown }).payload
      const isBinaryPayload =
        typeof Blob !== "undefined" &&
        (payload instanceof Blob ||
          payload instanceof ArrayBuffer ||
          payload instanceof Uint8Array)
      if (isBinaryPayload) {
        const gz = await gzipEncodeBlob(payload as MaybeBinary)
        return {
          ...msg,
          body: {
            ...body,
            payload: gz,
            contentEncoding: "gzip",
          },
        }
      }
    }

    // Legacy gzip flow: when body.data is Blob, gzip it before encoding.
    if ("data" in body && typeof Blob !== "undefined" && body.data instanceof Blob) {
      const gz = await gzipEncodeBlob(body.data as MaybeBinary)
      return {
        ...msg,
        body: {
          ...body,
          data: gz,
        },
      }
    }

    return msg
  }
}
