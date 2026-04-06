import { Box, Modal } from "@mui/material"
import { useState } from "react"

export const Thumb = ({ src }: { src: string }) => {
  const [show, setShow] = useState(false)
  return (
    <>
      <img
        src={src}
        alt=""
        style={{
          width: "100%",
          height: "100%",
        }}
        onClick={() => {
          setShow(true)
        }}
      />
      <Modal open={show} onClose={() => setShow(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            height: "80%",
            bgcolor: "white",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <img
            src={src}
            alt=""
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        </Box>
      </Modal>
    </>
  )
}
