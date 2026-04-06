import { atom } from 'jotai'

export const topicsAtom = atom<string[]>([])
export const topicsLoadingAtom = atom<boolean>(false)
export const selectedTopicAtom = atom<string | null>(null)
export const topicErrorAtom = atom<string | null>(null)
