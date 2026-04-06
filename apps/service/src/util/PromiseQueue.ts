type PromiseFunction = () => Promise<any>

export class PromiseQueue {
  private concurrency: number
  private current: number
  private queue: PromiseFunction[]
  private done = 0

  constructor(
    concurrency: number = 1,
    private total?: number
  ) {
    this.concurrency = concurrency

    this.current = 0
    this.queue = []
  }

  private finishResolver = () => {}

  finish = () => {
    if (this.current === 0) {
      return
    }
    return new Promise<void>((resolve) => {
      this.finishResolver = resolve
    })
  }

  // Add a new promise to the queue
  enqueue = (task: PromiseFunction) => {
    this.queue.push(task)
    this.processQueue()
  }

  // Process the next task in the queue if concurrency limit is not reached
  private processQueue = async () => {
    if (this.queue.length === 0 || this.current >= this.concurrency) {
      return
    }

    this.current++
    const task = this.queue.shift()
    if (task) {
      try {
        await task()
      } catch (ex) {
        console.error(ex)
      } finally {
        console.log("done", ++this.done, this.total)
        this.current--
        this.processQueue()
        if (this.current === 0) {
          this.finishResolver()
        }
      }
    }
  }
}
