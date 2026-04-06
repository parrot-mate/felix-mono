import { useEffect } from 'react'
import { useAtom } from 'jotai'
import { fetchTopics } from '../api/topicIndexer'
import {
  selectedTopicAtom,
  topicErrorAtom,
  topicsAtom,
  topicsLoadingAtom,
} from '../state'

export function useTopics() {
  const [topics, setTopics] = useAtom(topicsAtom)
  const [topicsLoading, setTopicsLoading] = useAtom(topicsLoadingAtom)
  const [topicError, setTopicError] = useAtom(topicErrorAtom)
  const [selectedTopic, setSelectedTopic] = useAtom(selectedTopicAtom)

  useEffect(() => {
    let cancelled = false

    async function loadTopics() {
      setTopicsLoading(true)
      setTopicError(null)
      try {
        const list = await fetchTopics()
        if (cancelled) return
        setTopics(list)
        setSelectedTopic((prev) => {
          if (prev && list.includes(prev)) {
            return prev
          }
          return list.at(0) ?? null
        })
      } catch (error) {
        if (cancelled) return
        setTopicError(error instanceof Error ? error.message : 'Failed to load topics')
        setTopics([])
        setSelectedTopic(null)
      } finally {
        if (!cancelled) {
          setTopicsLoading(false)
        }
      }
    }

    void loadTopics()
    return () => {
      cancelled = true
    }
  }, [setSelectedTopic, setTopicError, setTopics, setTopicsLoading])

  return {
    topics,
    topicsLoading,
    topicError,
    selectedTopic,
    setSelectedTopic,
  }
}
