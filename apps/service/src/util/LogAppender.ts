import { POSS } from "./alioss"
import { wait } from "./wait"

export class LogAppender<T> {
  private writePosition = "0"
  private queue: {
    value: T
    resolve: (_: any) => void
    reject: (err: any) => void
  }[] = []
  private constructor(private key: string) {
    this.run()
  }

  private run = async () => {
    if (this.queue.length === 0) {
      await wait(50)
      this.run()
      return
    }

    if (this.writePosition === "0") {
      this.writePosition = await POSS.publicOSS.getHeadPosition(this.key)
      console.log("header-wp", this.writePosition)
    }

    const logs = this.queue.map((x) => x.value)
    const clonedQueue = this.queue.slice()
    this.queue = []

    try {
      this.writePosition = await POSS.publicOSS.appendJSONOSS(
        this.key,
        logs,
        this.writePosition
      )
      console.log("next wp", this.writePosition)
      for (const x of clonedQueue) {
        x.resolve(null)
      }
    } catch (err) {
      for (const x of clonedQueue) {
        x.reject(err)
      }
    }
    await wait(50)
    this.run()
  }

  append = async (value: any) => {
    return new Promise((resolve, reject) => {
      this.queue.push({ value, resolve, reject })
    })
  }

  static appenders = new Map<string, LogAppender<any>>()

  static get<T>(key: string) {
    if (!LogAppender.appenders.has(key)) {
      LogAppender.appenders.set(key, new LogAppender(key))
    }
    return LogAppender.appenders.get(key) as LogAppender<T>
  }
}
