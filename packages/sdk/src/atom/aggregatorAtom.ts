import { IndexerNames } from "@sdk/util/cindexer.def"
import { indexerAtom } from "./indexerAtom"

export const aggregatorAtom = (user: string) =>
  indexerAtom(IndexerNames.UserLogs, user)