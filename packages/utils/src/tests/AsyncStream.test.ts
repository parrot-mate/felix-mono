import { describe, expect, it } from "vitest"
import { AsyncStream } from "../AsyncStream"

describe("AsyncStream", () => {
  it("yields queued values and closes after end", async () => {
    const stream = new AsyncStream<number>()
    const events: string[] = []

    stream.on("endRequested", () => events.push("endRequested"))
    stream.on("end", () => events.push("end"))
    stream.on("close", ({ reason }) => events.push(`close:${reason}`))

    stream.push(1)
    stream.push(2)
    stream.end()

    const collected: number[] = []
    for await (const value of stream) {
      collected.push(value)
    }

    expect(collected).toEqual([1, 2])
    expect(stream.state).toBe("closed")
    expect(events).toEqual(["endRequested", "end", "close:end"])
  })

  it("closes with consumer reason when iterator returns early", async () => {
    const stream = new AsyncStream<number>()
    const closeReasons: string[] = []

    stream.on("close", ({ reason }) => closeReasons.push(reason))

    stream.push(1)
    stream.push(2)

    const iterator = stream[Symbol.asyncIterator]()
    const first = await iterator.next()

    expect(first.value).toBe(1)
    await iterator.return?.()

    expect(stream.state).toBe("closed")
    expect(stream.length).toBe(0)
    expect(closeReasons).toEqual(["consumer"])
  })

  it("rejects waiting consumers on error", async () => {
    const stream = new AsyncStream<number>()
    const iterator = stream[Symbol.asyncIterator]()

    const pending = iterator.next()
    stream.error(new Error("boom"))

    await expect(pending).rejects.toThrow("boom")
    expect(stream.state).toBe("closed")
  })

  it("chunks blobs by minimum size", async () => {
    const source = new AsyncStream<Blob>()
    const chunked = AsyncStream.chunkBlob(source, { minBytes: 5 })

    const collected: Blob[] = []
    const drain = (async () => {
      for await (const blob of chunked) {
        collected.push(blob)
      }
    })()

    source.push(new Blob(["a"]))
    source.push(new Blob(["bc"]))
    source.push(new Blob(["def"]))
    source.end()

    await drain

    expect(collected).toHaveLength(1)
    await expect(collected[0].text()).resolves.toBe("abcdef")
  })
})
