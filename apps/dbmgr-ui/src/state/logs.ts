import { atom } from 'jotai'
import type { TopicLogItem } from '../api/topicIndexer'

export const logsAtom = atom<TopicLogItem[]>([])
export const logsLoadingAtom = atom<boolean>(false)
export const logsErrorAtom = atom<string | null>(null)
export const logsCursorAtom = atom<string | number | null>(null)
export const logsHasMoreAtom = atom<boolean>(false)
export const filterAtom = atom<string>('')
