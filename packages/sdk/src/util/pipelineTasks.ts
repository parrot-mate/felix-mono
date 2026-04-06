import { HashType, uniqHash } from "@pmate/utils"

export class SimpleTask<T> {
  private done: boolean
  private resolve: ((value: T | PromiseLike<T>) => void) | null
  private reject: ((reason?: any) => void) | null
  private id: string
  private data?: T

  constructor() {
    this.done = false
    this.resolve = null
    this.reject = null
    this.id = uniqHash(Date.now().toString(), HashType.Task)
  }

  public setData(data: T) {
    this.data = data
  }
  public getData() {
    return this.data
  }

  public getId() {
    return this.id
  }

  // Set the task as done and resolve the promise
  public finish(data: T) {
    if (this.done) {
      throw new Error("Task already finished")
    }
    this.done = true
    if (this.resolve) {
      this.resolve(data)
    }
  }

  // Set the task as done and reject the promise
  public error(reason: any) {
    if (this.done) {
      throw new Error("Task already finished")
    }
    this.done = true
    if (this.reject) {
      this.reject(reason)
    }
  }

  // Get the promise associated with the task
  public getPromise() {
    return new Promise<T>((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
}
