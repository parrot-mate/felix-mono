import React from "react"
import type { BaseComponentProps } from "../../types/base"
import type { ThreadInfoV2 } from "@pmate/meta"
import { ThreadListItem } from "./ThreadListItem"

export interface ThreadListViewProps extends BaseComponentProps {
  threads: ThreadInfoV2[]
  onSelect?: (item: ThreadInfoV2) => void
  noDataText?: string
}

export const ThreadListView: React.FC<ThreadListViewProps> = ({
  threads,
  onSelect,
  noDataText,
  className = "",
  id,
  styles,
}) => {
  console.log("threads", threads)
  return (
    <ul
      id={id}
      data-uikit="thread_list"
      style={styles}
      className={`flex flex-col overflow-scroll pb-[80px] ${className}`.trim()}
    >
      {threads.length > 0 ? (
        threads.map((t) => (
          <ThreadListItem
            key={t.threadHash}
            {...t}
            onClick={onSelect ? () => onSelect(t) : undefined}
          />
        ))
      ) : (
        <li className="flex justify-center px-2 py-1">{noDataText}</li>
      )}
    </ul>
  )
}
