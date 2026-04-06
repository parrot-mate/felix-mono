import { ChatTitleBar } from "@/component/chat/ChatTitleBar"
import { useQrScanner } from "@/hook/useQrScanner"
import { useTranslation } from "@pmate/i18n"
import { profileAtom } from "@pmate/account-sdk"
import { searchFriendAtom, searchKeywordAtom } from "@pmate/sdk"
import {
  Avatar,
  IconArrowBack,
  IconButton,
  IconImage,
  IconScan,
  InputField,
  Modal,
  Spinner,
  useSnackbar,
} from "@pmate/uikit"
import { useAtomValue, useSetAtom } from "jotai"
import { QRCodeCanvas } from "qrcode.react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"

export const FindFriend = () => {
  const t = useTranslation()
  const nav = useNavigate()
  const setKeyword = useSetAtom(searchKeywordAtom)
  const result = useAtomValue(searchFriendAtom)
  const { enqueueSnackbar } = useSnackbar()

  const user = useAtomValue(profileAtom)
  const username = user?.userName || ""
  const myId = user?.id ?? ""
  const addLink = `${window.location.origin}/friend/add/${myId}` // fake link

  const [typed, setTyped] = useState("")
  const keywordRef = useRef("")
  const [slowPending, setSlowPending] = useState(false)

  const doSearch = useCallback(
    (kw: string) => {
      const keyword = kw.trim()
      keywordRef.current = keyword
      if (keyword.length >= 10) {
        setKeyword(keyword)
      }
    },
    [setKeyword]
  )

  const handleScanSuccess = useCallback(
    (value: string) => {
      const marker = "/friend/add/"
      if (value.includes(marker)) {
        const after = value.split(marker)?.[1]
        if (after) {
          const cleanId = after.split(/[?#]/)[0]
          if (cleanId) {
            nav(`/friend/add/${cleanId}`, { replace: true })
            return
          }
        }
      }

      setTyped(value)
      enqueueSnackbar(t("Username captured from QR code"))
      if (value.length >= 10) {
        doSearch(value)
      }
    },
    [doSearch, enqueueSnackbar, nav, setTyped, t]
  )

  const {
    videoRef,
    hasStream,
    scanError,
    scannerOpen,
    openScanner,
    closeScanner,
    scanImageFile,
  } = useQrScanner({ onScanSuccess: handleScanSuccess })
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleSelectImage = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImageChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null
      if (file) {
        scanImageFile(file)
        event.target.value = ""
      }
    },
    [scanImageFile]
  )

  useEffect(() => {
    doSearch(typed)
  }, [typed, doSearch])

  const isPending = result.isPending()
  useEffect(() => {
    let timer: number | undefined
    if (isPending) {
      setSlowPending(false)
      timer = window.setTimeout(() => setSlowPending(true), 1000)
    } else {
      setSlowPending(false)
    }
    return () => {
      if (timer) window.clearTimeout(timer)
    }
  }, [isPending])

  const canSearch = typed.trim().length >= 10
  const showQr = !canSearch

  return (
    <div className="w-full h-full flex flex-col">
      <ChatTitleBar
        title={t("Find Friend")}
        variant="solid"
        right={
          <IconButton
            className="text-white w-10 h-10 hover:bg-white/10"
            onClick={openScanner}
          >
            <IconScan className="w-6 h-6" />
          </IconButton>
        }
      />

      <div className="p-4 flex flex-col gap-3 flex-1 overflow-hidden items-center justify-start">
        <div className="flex items-center gap-2 w-full">
          <InputField
            type="text"
            placeholder={t("Input Username")}
            className="flex-1"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSearch) {
                doSearch(typed)
              }
            }}
          />
        </div>

        {/* 我的二维码，仅在未开始搜索时显示 */}
        {showQr && (
          <div className="flex flex-col items-center mt-6 gap-2">
            <QRCodeCanvas value={addLink} size={180} includeMargin />
            <div className="text-sm font-medium text-gray-700">
              {t("my account: ")}
              {username}
            </div>
          </div>
        )}

        {/* 搜索结果区 */}
        <div className="mt-4 flex flex-col gap-2 w-full">
          {canSearch && (
            <>
              {isPending && (
                <div className="flex items-center gap-2">
                  <Spinner />
                  {slowPending && <span>搜索中......</span>}
                </div>
              )}

              {result.isFail() && <div>Search Fail, Please Retry</div>}

              {result.isNothing() && !isPending && <div>No Result</div>}

              {result
                .map((r) => {
                  const { profile, relationship } = r
                  const goAdd = () =>
                    nav(`/friend/add/${profile.id}`, { replace: true })

                  return (
                    <div key={profile.id} className="flex flex-col">
                      <div
                        className="flex items-center gap-2 p-2 -mx-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                        onClick={goAdd}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) =>
                          (e.key === "Enter" || e.key === " ") && goAdd()
                        }
                      >
                        <Avatar
                          src={profile.avatar}
                          nickName={profile.nickName || profile.userName}
                          className="w-12 h-12 mr-1"
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {profile.nickName || profile.userName}
                          </span>
                          <div className="flex items-center gap-2">
                            {profile.role && (
                              <span className="text-sm text-gray-500">
                                {profile.role}
                              </span>
                            )}
                            {relationship === "requesting" && (
                              <span className="text-sm text-gray-500">
                                {t("Already Applied")}
                              </span>
                            )}
                            {relationship === "blocked" && (
                              <span className="text-sm text-gray-500">
                                {t("User is blocked")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
                .unwrapOr(null)}
            </>
          )}
        </div>
      </div>
      <Modal
        open={scannerOpen}
        onClose={closeScanner}
        overlayClassName="bg-black"
        className="w-screen h-screen max-w-none max-h-none rounded-none p-0"
      >
        <div className="fixed top-0 left-0  w-full h-full bg-black text-white">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          {!hasStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white bg-black/60 text-sm">
              <Spinner />
              <div>{t("Initializing camera...")}</div>
            </div>
          )}
          <div className="absolute top-0 left-0 right-0 flex items-center gap-3 px-4 pt-6 pb-4">
            <IconButton
              className="text-white w-10 h-10 bg-black/40 hover:bg-black/60"
              onClick={closeScanner}
            >
              <IconArrowBack className="w-5 h-5" />
            </IconButton>
            <div className="text-lg font-semibold">{t("Scan QR Code")}</div>
          </div>
          <div className="absolute left-0 right-0 bottom-20 px-4">
            {scanError ? (
              <div className="text-sm text-red-400">{scanError}</div>
            ) : (
              <div className="text-sm text-white/80">
                {t(
                  "Align the QR code within the frame to capture a username automatically."
                )}
              </div>
            )}
          </div>
          <IconButton
            className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-white/90 text-gray-900 hover:bg-white"
            onClick={handleSelectImage}
          >
            <IconImage className="w-6 h-6" />
          </IconButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>
      </Modal>
    </div>
  )
}
