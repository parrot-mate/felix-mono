import { detectText, Maybe } from "@pmate/utils"
import { Button } from "@pmate/uikit"
import { useState } from "react"
import { useAddTab } from "../hook/useWordCardTabs"
import classes from "./ImageUpload.module.scss"

function compressImageToBase64(event: Event): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) {
      reject(new Error("No files selected."))
      return
    }
    const file = input.files[0]

    const originalSize = file.size
    console.log(`Original size: ${originalSize} bytes`)

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const imgElement = document.createElement("img")
      imgElement.src = e.target!.result as string
      imgElement.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = imgElement.width
        canvas.height = imgElement.height

        const ctx = canvas.getContext("2d")
        ctx!.drawImage(imgElement, 0, 0, canvas.width, canvas.height)

        // Correct usage of toDataURL to get the base64 string
        const dataUrl = canvas.toDataURL("image/jpeg", 0.5)
        const compressedSize = dataUrl.length * (3 / 4) // Approximate calculation for base64
        console.log(`Compressed size (approx): ${compressedSize} bytes`)
        resolve(dataUrl)
      }
    }
    reader.onerror = (error) => reject(error)
  })
}

export const NewPanel = () => {
  const addTab = useAddTab()
  const [v, setV] = useState(0)
  const [value, setValue] = useState<string>("")
  return (
    <div
      style={{
        padding: "2rem",
      }}
    >
      <label
        style={{
          display: "block",
          marginBottom: "1rem",
        }}
      >
        Upload by Image
      </label>

      <div className={classes.ImageUpload}>
        <p>+</p>
        <input
          key={v}
          type="file"
          onChange={async (e) => {
            if (e.target.files?.length) {
              // const img = await compressImage(e)
              // if (!img) {
              //   setV((x) => x + 1)
              //   return
              // }
              const imageBase64 = await compressImageToBase64(e as any)
              const text = await detectText(imageBase64)
              if (text) {
                addTab(text, "", "", Maybe.Nothing())
                setV((x) => x + 1)
              }
            }
          }}
        />
      </div>

      <div style={{ marginBottom: 10, display: "flex", alignItems: "center" }}>
        <input
          onChange={(e) => {
            setValue(e.target.value)
          }}
          style={{
            lineHeight: `32px`,
          }}
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              addTab(value, "", "", Maybe.Nothing())
              setValue("")
            }
          }}
          placeholder="Look for ..."
        />
        <Button
          styles={{
            marginLeft: 10,
          }}
          onClick={() => {
            addTab(value, "", "", Maybe.Nothing())
            setValue("")
          }}
        >
          Add By Text
        </Button>
      </div>
    </div>
  )
}

function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      resolve(reader.result as string)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
