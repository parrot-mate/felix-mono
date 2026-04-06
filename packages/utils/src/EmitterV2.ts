export type EmitterV2EventMap = Record<PropertyKey, any>
export type EmitterV2Topic<M extends EmitterV2EventMap> = keyof M

export type EmitterV2Message<
  M extends EmitterV2EventMap,
  K extends EmitterV2Topic<M>
> = M[K] extends void ? { topic: K } : { topic: K; body: M[K] }

export type EmitterV2AnyMessage<M extends EmitterV2EventMap> = {
  [K in EmitterV2Topic<M>]: EmitterV2Message<M, K>
}[EmitterV2Topic<M>]

type EmitterV2HandlerFor<M extends EmitterV2EventMap, K extends EmitterV2Topic<M>> =
  M[K] extends void ? () => void : (body: M[K]) => void

type EmitterV2EmitArgs<M extends EmitterV2EventMap, K extends EmitterV2Topic<M>> =
  M[K] extends void ? [] : [body: M[K]]

export class EmitterV2<M extends EmitterV2EventMap> {
  private topics: Map<EmitterV2Topic<M>, Array<(...args: any[]) => void>> =
    new Map()
  private allHandlers: Array<(msg: EmitterV2AnyMessage<M>) => void> = []

  private getTopic(topic: EmitterV2Topic<M>) {
    if (!this.topics.get(topic)) {
      this.topics.set(topic, [])
    }
    return this.topics.get(topic)!
  }

  on<K extends EmitterV2Topic<M>>(topic: K, handler: EmitterV2HandlerFor<M, K>) {
    const handlers = this.getTopic(topic)
    handlers.push(handler as any)
    return () => {
      this.topics.set(
        topic,
        this.getTopic(topic).filter((x) => x !== handler)
      )
    }
  }

  onAll(handler: (msg: EmitterV2AnyMessage<M>) => void) {
    this.allHandlers.push(handler)
    return () => {
      this.allHandlers = this.allHandlers.filter((x) => x !== handler)
    }
  }

  emit<K extends EmitterV2Topic<M>>(topic: K, ...args: EmitterV2EmitArgs<M, K>) {
    const hasBody = args.length > 0
    const body = (args as any)[0]

    this.getTopic(topic).forEach((h) => {
      if (hasBody) {
        h(body)
        return
      }
      h()
    })

    const msg = (hasBody ? { topic, body } : { topic }) as unknown as EmitterV2AnyMessage<M>
    this.allHandlers.forEach((h) => {
      h(msg)
    })
  }

  clearListeners(topic?: EmitterV2Topic<M>) {
    if (typeof topic !== "undefined") {
      this.topics.delete(topic)
      return
    }

    this.topics.clear()
    this.allHandlers = []
  }
}

