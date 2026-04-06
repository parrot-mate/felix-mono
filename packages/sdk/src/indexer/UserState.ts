import { Emitter, VocabularyMap } from "@pmate/utils"
import {
  BaseLog,
  Book,
  BookReadingStats,
  ContextQAItem,
  LibraryItem,
  Log,
  LogType,
  ReadingStats,
  ReadingStatsType,
  Vocabulary,
  VolcabularyAction,
} from "@pmate/meta"

const AGG_VERSION = 1

export interface AggregatorData {
  version: number
  vocabularies: Record<string, Vocabulary>
  vocabularyMap: VocabularyMap<Vocabulary>
  account: {
    amountIn: number
    amountOut: number
  }
  readingRecords: Record<string, Record<number, boolean>>
  lastReadingPosition: Record<string, { pid: number; t: number }>
  bookStats: Record<string, BookReadingStats>
  books: Record<string, LibraryItem>
  todayStats: ReadingStats
  totalStats: ReadingStats
  notes: Book[]
  settings: Record<string, any>
  qaHistory: Record<string, ContextQAItem[]>
  hashSet: Set<string>
}

const createDefaultData = (): AggregatorData => ({
  version: AGG_VERSION,
  vocabularies: {},
  vocabularyMap: new VocabularyMap<Vocabulary>(),
  account: { amountIn: 0, amountOut: 0 },
  readingRecords: {},
  lastReadingPosition: {},
  bookStats: {},
  books: {},
  todayStats: {
    type: ReadingStatsType.Today,
    wc: 0,
    pc: 0,
    learned: new Set<string>(),
    reviewed: new Set<string>(),
  },
  totalStats: {
    type: ReadingStatsType.Total,
    wc: 0,
    pc: 0,
    learned: new Set<string>(),
    reviewed: new Set<string>(),
  },
  notes: [],
  settings: {},
  qaHistory: {},
  hashSet: new Set<string>(),
})

export enum AggregatorEvent {
  BalanceUpdate,
  VocabularyUpdate,
  ReadingUpdate,
  TodayStats,
  TotalStats,
  NotesUpdate,
  BooksUpdate,
}

function withinToday(t: number) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return t >= today.getTime()
}

export class UserState {
  private aggregator: AggregatorData = createDefaultData()

  public constructor(private readonly emitter: Emitter<AggregatorEvent>) {}

  public aggregate(log: Log) {
    if (this.aggregator.hashSet.has(log.hash)) {
      return
    }
    this.aggregator.hashSet.add(log.hash)

    switch (log.type) {
      case LogType.Mint: {
        this.aggregator.account.amountIn += log.data.coin
        this.emit(AggregatorEvent.BalanceUpdate)
        break
      }
      case LogType.Reading: {
        this.aggregateReadingLog(log as BaseLog<LogType.Reading>)
        break
      }
      case LogType.UserNotes: {
        const book: Book = {
          name: log.data.title,
          author: "",
          desc: "",
          lang: "en",
          chapters: [],
        }
        book.chapters.push({
          title: log.data.title,
          paragraphs: log.data.content
            .split("\n")
            .filter((x) => x.trim())
            .map((x) => ({ content: x, words: x.split(/\s+/) })),
        })
        this.aggregator.notes.push(book)
        this.emit(AggregatorEvent.NotesUpdate)
        break
      }
      case LogType.Vocabulary: {
        this.aggregateVocabularyLog(log as BaseLog<LogType.Vocabulary>)
        break
      }
      case LogType.UserSettings: {
        const data = log.data
        this.aggregator.settings[data.key] = data.value
        break
      }
      case LogType.Books: {
        const data = log.data
        if (data.op === 0) {
          this.aggregator.books[data.book.id] = data.book
        } else if (data.op === 1) {
          delete this.aggregator.books[data.book.id]
        }
        this.emit(AggregatorEvent.BooksUpdate)
        break
      }
      case LogType.ContextQA: {
        const data = log.data
        const key = data.key
        if (!key) {
          break
        }
        if (!this.aggregator.qaHistory[key]) {
          this.aggregator.qaHistory[key] = []
        }
        this.aggregator.qaHistory[key]!.push(data)
        break
      }
      default:
        break
    }
  }

  private aggregateReadingLog(log: BaseLog<LogType.Reading>) {
    const data = log.data
    if (!this.aggregator.readingRecords[data.book]) {
      this.aggregator.readingRecords[data.book] = {}
    }
    const record = this.aggregator.readingRecords[data.book]!
    record[data.pid] = true

    const last = this.aggregator.lastReadingPosition[data.book]
    if (!last || last.t < log.t) {
      this.aggregator.lastReadingPosition[data.book] = {
        pid: data.pid,
        t: log.t,
      }
    }

    if (!this.aggregator.bookStats[data.book]) {
      this.aggregator.bookStats[data.book] = { finishedVolume: 0 }
    }
    this.aggregator.bookStats[data.book]!.finishedVolume += data.wc

    if (withinToday(log.t)) {
      this.updateStats(this.aggregator.todayStats, log)
    }
    this.updateStats(this.aggregator.totalStats, log)

    for (const word of data.uniqWords) {
      const vocabulary = this.aggregator.vocabularies[word]
      if (vocabulary && vocabulary.entryTime < log.t) {
        this.aggregator.todayStats.reviewed.add(word)
        vocabulary.reviews++
        this.emit(AggregatorEvent.VocabularyUpdate)
      }
    }

    this.emit(AggregatorEvent.ReadingUpdate, { book: data.book })
  }

  private aggregateVocabularyLog(log: BaseLog<LogType.Vocabulary>) {
    const data = log.data
    if (!this.aggregator.vocabularies[data.word]) {
      if (!log.t) {
        return
      }
      this.aggregator.vocabularies[data.word] = {
        entryTime: log.t,
        word: data.word,
        pickups: 0,
        reviews: 0,
        deleted: data.action !== VolcabularyAction.Cancel,
      }
    }
    const vocabulary = this.aggregator.vocabularies[data.word]!
    if (data.action === VolcabularyAction.Add) {
      vocabulary.pickups++
      vocabulary.reviews++
      vocabulary.deleted = false
      this.emit(AggregatorEvent.VocabularyUpdate)
      this.aggregator.vocabularyMap.insert(data.word, vocabulary)
    } else if (data.action === VolcabularyAction.Cancel) {
      vocabulary.deleted = true
      this.emit(AggregatorEvent.VocabularyUpdate)
      this.aggregator.vocabularyMap.remove(data.word)
    }
  }

  private updateStats(
    stats: ReadingStats,
    log: BaseLog<LogType.Reading>
  ): void {
    const data = log.data
    stats.wc += data.wc
    stats.pc += 1
    if (data.picked) {
      for (const word of data.picked) {
        stats.learned.add(word)
      }
      if (stats.type === ReadingStatsType.Today) {
        this.emit(AggregatorEvent.TodayStats)
      }
      if (stats.type === ReadingStatsType.Total) {
        this.emit(AggregatorEvent.TotalStats)
      }
    }
  }

  private emit(event: AggregatorEvent, payload?: unknown) {
    this.emitter.emit(event, payload as any)
  }

  public fetch(): AggregatorData {
    return this.aggregator
  }

  public rebuild(logs: Log[]) {
    this.aggregator = createDefaultData()
    for (const log of logs) {
      this.aggregate(log)
    }
  }
}
