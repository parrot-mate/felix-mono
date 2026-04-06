import { addEbookAtom } from "@/atom/addEbookAtom"
import { FileUploader } from "@/component/FileUploader"
import { HomeTabsLayout } from "@/layout/HomeTabsLayout"
import { useTranslation } from "@pmate/i18n"
import { Button, Modal, Spinner, useSnackbar } from "@pmate/uikit"
import { useSetAtom } from "jotai"
import { useState } from "react"

export const BookUploader = () => {
  const addEbook = useSetAtom(addEbookAtom)

  const [modalOpen, setModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const t = useTranslation()
  const { enqueueSnackbar } = useSnackbar()

  return (
    <HomeTabsLayout>
      <div className="p-5 mt-5 mb-[100px] m-5 bg-white">
        <div>
          <Button onClick={() => setModalOpen(true)}>{t("Upload Book")}</Button>
          <Modal
            open={modalOpen}
            onClose={() => {
              if (!uploading) setModalOpen(false)
            }}
            className="relative rounded"
          >
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <Spinner />
              </div>
            )}
            <FileUploader
              label={t("Click here to upload local EPUB/MOBI/PDF/TXT")}
              onChange={async (file) => {
                setUploading(true)
                const ext = file.name.split(".").pop()

                if (!ext || !["epub", "txt", "pdf", "mobi"].includes(ext)) {
                  enqueueSnackbar(t("Only EPUB/MOBI/PDF/TXT is supported"), {
                    variant: "error",
                  })
                  setUploading(false)
                  return
                }

                try {
                  await addEbook({
                    name: file.name,
                    blob: file,
                    type: ext === "txt" ? "text" : (ext as any),
                  })
                  enqueueSnackbar(t("Upload successful"), {
                    variant: "success",
                  })
                  setModalOpen(false)
                } catch (ex) {
                  console.error(ex)
                  enqueueSnackbar(t("Book upload failed"), {
                    variant: "error",
                  })
                } finally {
                  setUploading(false)
                }
              }}
            />
          </Modal>
        </div>
        <b>{t("We only store your files locally!")}</b>
      </div>
    </HomeTabsLayout>
  )
}
