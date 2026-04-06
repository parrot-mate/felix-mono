export type TextRange = {
  text: string
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
}

export interface DiffLine {
  line: number
  operation: "add" | "remove" | "update"
  oldLine?: string // only needed if operation = 'remove' or 'update'
  newLine?: string // only needed if operation = 'add' or 'update'
}

export interface Mod {
  diffLines: DiffLine[]
  think?: string // Why modify
}

