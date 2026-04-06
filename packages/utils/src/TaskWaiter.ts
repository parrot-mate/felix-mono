import { Emitter } from "."

export class TaskWaiter extends Emitter<string> {
  private resolve: (() => void) | null = null
  private reject: (() => void) | null = null
  private waiter: Promise<void>
  constructor() {
    super()
    this.waiter = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }

  done() {
    this.resolve!()
    this.emit("finish")
  }

  fail() {
    this.reject!()
    this.emit("finish")
  }

  getWaiter() {
    return this.waiter
  }
}
