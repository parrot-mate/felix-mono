import { defaultChainId, requestIndexer } from './indexerClient';

const TOPIC_INDEXER_NAME = 'topics';

export const chainId = defaultChainId;

export interface TopicPageResponse {
  page: number;
  totalPage: number;
  pageSize: number;
  data: unknown[];
}

export interface TopicCursorResponse {
  cursor: string;
  prev_cursor?: string | null;
  prevCursor?: string | null;
  data: unknown[];
}

export interface TopicLogItem {
  id: string;
  kind: string;
  topic: string;
  time?: number;
  hash?: string;
  payload: Record<string, unknown>;
  searchText: string;
}

interface TopicLogResult {
  logs: TopicLogItem[];
  nextCursor: string | number | null;
}

export async function fetchTopics(): Promise<string[]> {
  const responseData = await requestIndexer<unknown>(chainId, TOPIC_INDEXER_NAME, 'list');
  if (!Array.isArray(responseData)) {
    throw new Error('invalid topics payload');
  }
  return responseData.map((topic) => String(topic));
}

export async function fetchTopicLogs(
  topic: string,
  cursor?: number | string | null,
): Promise<TopicLogResult> {
  const params: Record<string, string | undefined> = { topic };
  if (typeof cursor === 'number') {
    params.page = cursor.toString();
  } else if (typeof cursor === 'string' && cursor.length > 0) {
    params.cursor = cursor;
  }
  const page = await requestIndexer<unknown>(chainId, TOPIC_INDEXER_NAME, 'logs', params);

  if (isTopicCursorResponse(page)) {
    const logs = page.data.map((entry, index) =>
      normalizeLog(entry, index, topic, page.cursor),
    );
    return {
      logs,
      nextCursor: resolvePrevCursor(page),
    };
  }

  if (isTopicPageResponse(page)) {
    const logs = page.data.map((entry, index) =>
      normalizeLog(entry, index, topic, page.page),
    );
    const prevPage = page.page > 0 ? page.page - 1 : null;
    return {
      logs,
      nextCursor: prevPage,
    };
  }

  throw new Error('invalid topic log page payload');
}

function resolvePrevCursor(page: TopicCursorResponse): string | null {
  const raw = typeof page.prev_cursor === 'string' ? page.prev_cursor : page.prevCursor;
  if (typeof raw === 'string' && raw.length > 0) {
    return raw;
  }
  return null;
}

function normalizeLog(
  entry: unknown,
  index: number,
  fallbackTopic: string,
  pageIdentifier: string | number,
): TopicLogItem {
  let payload: Record<string, unknown>;
  if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
    payload = entry as Record<string, unknown>;
  } else {
    payload = { value: entry } as Record<string, unknown>;
  }

  const topicValue =
    typeof payload.topic === 'string' && payload.topic.length > 0 ? payload.topic : fallbackTopic;
  const hash =
    typeof payload.hash === 'string' && payload.hash.length > 0 ? payload.hash : undefined;
  const time =
    typeof payload.t === 'number'
      ? payload.t
      : typeof payload.time === 'number'
        ? payload.time
        : undefined;
  const kindValue =
    typeof payload.kind === 'string' && payload.kind.length > 0
      ? payload.kind
      : typeof payload.kind === 'number'
        ? String(payload.kind)
        : 'unknown';

  const id = hash ?? `${pageIdentifier}-${time ?? 'time'}-${index}`;
  const searchText = JSON.stringify(payload).toLowerCase();

  return {
    id,
    kind: kindValue,
    topic: topicValue,
    hash,
    time,
    payload,
    searchText,
  };
}

function isTopicPageResponse(value: unknown): value is TopicPageResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.page !== 'number') {
    return false;
  }
  const totalPage = record.totalPage ?? record.total_page;
  if (typeof totalPage !== 'number') {
    return false;
  }
  const pageSize = record.pageSize ?? record.page_size;
  if (typeof pageSize !== 'number') {
    return false;
  }
  if (!('totalPage' in record)) {
    record.totalPage = totalPage;
  }
  if (!('pageSize' in record)) {
    record.pageSize = pageSize;
  }
  if (!Array.isArray(record.data)) {
    return false;
  }
  return true;
}

function isTopicCursorResponse(value: unknown): value is TopicCursorResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.cursor !== 'string' || record.cursor.length === 0) {
    return false;
  }
  if (!Array.isArray(record.data)) {
    return false;
  }
  const prevCursor = record.prev_cursor ?? record.prevCursor;
  if (
    typeof prevCursor !== 'string' &&
    prevCursor !== null &&
    typeof prevCursor !== 'undefined'
  ) {
    return false;
  }
  return true;
}
