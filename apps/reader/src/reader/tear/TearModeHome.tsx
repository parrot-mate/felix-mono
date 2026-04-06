import { allBooksReadingStateAtom } from "@/atom/reading/readerStateAtom"
import { BookCard } from "@/component/BookCard"
import { useBook } from "@pmate/sdk"
import { Home } from "@mui/icons-material"
import { Box, Button, Drawer } from "@mui/material"
import { useAtom, useAtomValue } from "jotai"
import { useNavigate } from "react-router"
import { tearModeHomeAtom } from "./atoms/tearModeHomeAtom"

export const TearModeHome = () => {
  const [open, setOpen] = useAtom(tearModeHomeAtom)
  const list = useAtomValue(allBooksReadingStateAtom)
  const id = useBook()
  const nav = useNavigate()

  return (
    <Drawer
      id="tear-mode-drawer"
      open={open}
      onClose={() => {
        setOpen(false)
      }}
      anchor="left"
      PaperProps={{
        sx: {
          borderRadius: 0,
        },
      }}
    >
      <Box
        sx={{
          width: "200px",
          boxSizing: "border-box",
          margin: "10px",
          marginBottom: 0,
          overflowY: "auto",
        }}
      >
        {list
          .map((list) => {
            return list.map((bookAndState) => {
              const { book, state } = bookAndState
              if (state.pid === 0) {
                return null
              }
              return (
                <div
                  style={{
                    marginBottom: "20px",
                    width: "auto",
                  }}
                >
                  <BookCard
                    showStats={true}
                    onBookTitleChanged={(_) => {}}
                    onChange={() => {}}
                    mode={"read"}
                    key={book.id}
                    book={book}
                  />
                </div>
              )
            })
          })
          .unwrapOr(null)}
      </Box>
      <Button
        onClick={() => {
          nav(`/book/${id}`, { replace: true })
        }}
        variant="outlined"
      >
        <Home
          sx={{
            marginRight: "5px",
          }}
        />
        书籍详情
      </Button>
    </Drawer>
  )
}
