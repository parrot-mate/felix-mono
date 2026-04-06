import { useAtom } from 'jotai'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { fetchTopicLogs } from '../api/topicIndexer'
import {
  filterAtom,
  logsAtom,
  logsCursorAtom,
  logsErrorAtom,
  logsHasMoreAtom,
  logsLoadingAtom,
} from '../state'

export function useLogs(selectedTopic: string | null) {
  const [logs, setLogs] = useAtom(logsAtom)
  const [logsLoading, setLogsLoading] = useAtom(logsLoadingAtom)
  const [logsCursor, setLogsCursor] = useAtom(logsCursorAtom)
  const [logsHasMore, setLogsHasMore] = useAtom(logsHasMoreAtom)
  const [logsError, setLogsError] = useAtom(logsErrorAtom)
  const [filter, setFilter] = useAtom(filterAtom)

  const topicRef = useRef<string | null>(selectedTopic)
  useEffect(() => {
    topicRef.current = selectedTopic
  }, [selectedTopic])

  useEffect(() => {
    if (!selectedTopic) {
      setLogs([])
      setLogsCursor(null)
      setLogsHasMore(false)
      setLogsError(null)
      setLogsLoading(false)
      return
    }

    let cancelled = false
    const topic = selectedTopic

    async function loadInitial() {
      setLogs([])
      setLogsCursor(null)
      setLogsHasMore(false)
      setLogsError(null)
      setLogsLoading(true)
      try {
        const { logs: chunkLogs, nextCursor } = await fetchTopicLogs(topic)
        if (cancelled || topicRef.current !== topic) {
          return
        }
        setLogs(chunkLogs)
        setLogsCursor(nextCursor)
        setLogsHasMore(nextCursor !== null)
      } catch (error) {
        if (!cancelled && topicRef.current === topic) {
          setLogsError(error instanceof Error ? error.message : 'Failed to load logs')
        }
      } finally {
        if (!cancelled && topicRef.current === topic) {
          setLogsLoading(false)
        }
      }
    }

    void loadInitial()

    return () => {
      cancelled = true
    }
  }, [selectedTopic, setLogs, setLogsCursor, setLogsError, setLogsHasMore, setLogsLoading])

  const loadMore = useCallback(async () => {
    const topic = topicRef.current
    if (!topic || logsLoading || !logsHasMore || logsCursor === null) {
      return
    }
    setLogsLoading(true)
    setLogsError(null)
    try {
      const { logs: chunkLogs, nextCursor } = await fetchTopicLogs(topic, logsCursor)
      if (topicRef.current !== topic) {
        return
      }
      setLogs((prev) => [...prev, ...chunkLogs])
      setLogsCursor(nextCursor)
      setLogsHasMore(nextCursor !== null)
    } catch (error) {
      if (topicRef.current === topic) {
        setLogsError(error instanceof Error ? error.message : 'Failed to load more logs')
      }
    } finally {
      if (topicRef.current === topic) {
        setLogsLoading(false)
      }
    }
  }, [logsCursor, logsHasMore, logsLoading, setLogs, setLogsCursor, setLogsError, setLogsHasMore, setLogsLoading])

  const filteredLogs = useMemo(() => {
    if (!filter) {
      return logs
    }
    const term = filter.toLowerCase()
    return logs.filter((log) => log.searchText.includes(term))
  }, [filter, logs])

  return {
    logs: filteredLogs,
    totalLoaded: logs.length,
    logsLoading,
    logsError,
    logsHasMore,
    loadMore,
    filter,
    setFilter,
    isInitialLoading: logsLoading && logs.length === 0,
  }
}
