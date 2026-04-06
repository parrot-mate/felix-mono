export interface EmitterMessage<TTopic, TBody> {
  topic: TTopic
  body?: TBody
}

type Handler<TData> = (value: TData) => void

export class Emitter<Topic> {
  private topics: Map<Topic, Handler<any>[]> = new Map()

  private getTopic(topic: Topic): Handler<any>[] {
    if (!this.topics.get(topic)) {
      this.topics.set(topic, [])
    }
    return this.topics.get(topic)!
  }

  on<T>(topic: Topic, handler: Handler<T>) {
    const handlers = this.getTopic(topic)
    handlers.push(handler)
    return () => {
      this.topics.set(
        topic,
        this.getTopic(topic).filter((x) => x !== handler)
      )
    }
  }

  emit<TBody>(msg: EmitterMessage<Topic, TBody>) {
    const topic = msg.topic
    this.getTopic(topic).forEach((h) => {
      h(msg.body)
    })
  }
}
