import { List, ListItem } from "@pmate/uikit"
import React from "react"

interface LabelValuePair {
  label: string
  value: string
}

interface Props {
  items: LabelValuePair[]
}

export const LabelValueList: React.FC<Props> = ({ items }) => {
  return (
    <div className="grid grid-cols-4 md:grid-cols-5 gap-1">
      {items.map((item, index) => (
        <div key={index}>
          <List>
            <ListItem className="flex flex-col">
              <p className="text-lg font-semibold mb-2">{item.label}</p>
              <p>{item.value}</p>
            </ListItem>
          </List>
        </div>
      ))}
    </div>
  )
}
