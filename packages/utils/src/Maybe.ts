export enum MaybeTypeNames {
  Just,
  Nothing,
}

type Just<T> = Maybe<T> & { type: MaybeTypeNames.Just; value: T }
type Nothing = Maybe<never> & { type: MaybeTypeNames.Nothing }

export class Maybe<T> {
  type: MaybeTypeNames
  public value?: T

  private constructor(type: MaybeTypeNames, value?: T) {
    this.type = type
    if (type === MaybeTypeNames.Just) {
      this.value = value
    }
  }

  static Just<T>(value: T): Maybe<T> {
    return new Maybe(MaybeTypeNames.Just, value) as Maybe<T>
  }

  static Nothing(): Nothing {
    return new Maybe(MaybeTypeNames.Nothing) as Nothing
  }

  isJust(): this is Just<T> {
    return this.type === MaybeTypeNames.Just
  }

  isNothing(): this is Nothing {
    return this.type === MaybeTypeNames.Nothing
  }

  map<U>(f: (value: T) => U, emptyVal?: U): Maybe<U> {
    return this.isJust()
      ? Maybe.Just(f(this.value))
      : emptyVal !== undefined
        ? Maybe.Just(emptyVal)
        : Maybe.Nothing()
  }

  async mapAsync<U>(f: (value: T) => Promise<U | Maybe<U>>): Promise<Maybe<U>> {
    if (this.isNothing()) return Maybe.Nothing()
    try {
      const val = await f(this.value!)
      if (isMaybe(val)) {
        return val
      }
      return Maybe.Just(val)
    } catch (ex) {
      console.error(ex)
      return Maybe.Nothing()
    }
  }

  withDefault(val: T): Maybe<T> {
    if (this.isJust()) {
      if (this.value === undefined) {
        return Maybe.Just(val)
      }
      return this
    }
    return Maybe.Just(val)
  }

  mapWith<U, O extends unknown[]>(
    ...args: [
      ...val: { [K in keyof O]: Maybe<O[K]> },
      f: (self: T, ...args: O) => U,
    ]
  ): Maybe<U> {
    const val = args.slice(0, -1) as { [K in keyof O]: Maybe<O[K]> }
    const f = args[args.length - 1] as (self: T, ...args: O) => U

    if (this.isJust() && val.every((x) => x.isJust())) {
      const values = val.map((x) => x.value!) as O
      const result = f(this.value!, ...values)
      return Maybe.Just(result)
    }

    return Maybe.Nothing()
  }

  async mapWithAync<U, O extends unknown[]>(
    ...args: [
      ...val: { [K in keyof O]: Maybe<O[K]> },
      f: (self: T, ...args: O) => Promise<U>,
    ]
  ): Promise<Maybe<U>> {
    const val = args.slice(0, -1) as { [K in keyof O]: Maybe<O[K]> }
    const f = args[args.length - 1] as (self: T, ...args: O) => Promise<U>

    if (this.isJust() && val.every((x) => x.isJust())) {
      const values = val.map((x) => x.value!) as O
      try {
        const result = await f(this.value!, ...values)
        return Maybe.Just(result)
      } catch {
        return Maybe.Nothing()
      }
    }

    return Maybe.Nothing()
  }

  unwrapWith<U>(f: (val: T) => U, def: U): U {
    if (this.isJust()) {
      const r = f(this.value)
      return r
    }
    return def
  }

  unwrap(): T {
    return this.value as T
  }

  toBoolean(): boolean {
    if (this.isNothing()) return false
    return Boolean(this.value)
  }

  unwrapOr<U>(val: U): T | U {
    if (this.isJust()) {
      return this.unwrap()
    }
    return val as U
  }

  filterUndefined(): Maybe<Exclude<T, undefined>> {
    if (this.isNothing() || this.value === undefined) {
      return Maybe.Nothing() as Maybe<Exclude<T, undefined>>
    }
    return Maybe.Just(this.value as Exclude<T, undefined>)
  }
}

export function isMaybe<T>(val: Maybe<T> | any): val is Maybe<T> {
  return val instanceof Maybe
}
