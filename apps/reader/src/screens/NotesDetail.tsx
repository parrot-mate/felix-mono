import { readerStateAtom } from "@/atom/reading/readerStateAtom"
import { TitleBar } from "@pmate/uikit"
import { Box, List, ListItemButton } from "@mui/material"
import { profileAtom } from "@pmate/account-sdk"
import { notesBookAtom } from "@pmate/sdk"
import { ReadingBook } from "@pmate/meta"
import { useAtomValue } from "jotai"
import { useNavigate } from "react-router"

export const NotesDetail = () => {
  const profile = useAtomValue(profileAtom)
  const userId = profile?.id ?? ""
  const notes = useAtomValue(notesBookAtom(userId))
  console.log(notes)

  return (
    <Box>
      <TitleBar title="剪报" />
      {notes.length === 0 && <p>暂无</p>}
      <List
        sx={{
          background: "paper.background",
        }}
      >
        {notes.map((note) => {
          return <BookJumper key={note.id} note={note} />
        })}
      </List>
    </Box>
  )
}

const BookJumper = ({ note }: { note: ReadingBook }) => {
  const readingState = useAtomValue(readerStateAtom(note.id))
  const pid = readingState.getState().pid
  const nav = useNavigate()
  return (
    <ListItemButton
      onClick={() => {
        nav(`/reader/TearMode/${note.id}/${pid}`)
      }}
      id={note.id}
    >
      {note.title}
    </ListItemButton>
  )
}
