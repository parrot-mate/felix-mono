import { modifyPromptKeyAtom } from "@/atom/modifyPromptKeyAtom"
import { deletePromptAtom } from "@/atom/deletePromptAtom"
import { promptDetailAtom, promptKeysAtom } from "@/atom/remotePromptsAtom"
import { updatePromptAtom } from "@/atom/updatePromptAtom"
import { appendCacheBuster } from "@/util/cacheBusting"
import { Prompt } from "@pmate/meta"
import { message } from "antd"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useAtomValue, useSetAtom } from "jotai"

const RESOURCE_BASE_URL = (
  process.env.VITE_PUBLIC_RESOURCE_URL ?? "https://book.skedo.cn"
).replace(/\/+$/, "")

export const usePromptDetail = (promptKey: string) => {
  const detailAtom = useMemo(() => promptDetailAtom(promptKey), [promptKey])
  const prompt = useAtomValue(detailAtom)
  const refreshPrompt = useSetAtom(detailAtom)
  const updatePrompt = useSetAtom(updatePromptAtom)

  return {
    prompt,
    refreshPrompt,
    updatePrompt,
  }
}

export const usePromptVersions = (prompt: Prompt) => {
  const encodedPromptKey = useMemo(
    () =>
      prompt.key
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/"),
    [prompt.key]
  )

  const currentVersion = useMemo(() => prompt.version ?? 1, [prompt.version])

  const historyVersions = useMemo(() => {
    if (currentVersion <= 1) {
      return []
    }
    const versionsToShow = Math.min(5, currentVersion - 1)
    const startVersion = currentVersion - versionsToShow

    return Array.from(
      { length: versionsToShow },
      (_value, index) => startVersion + index
    )
  }, [currentVersion])

  const hasEarlierHistory = useMemo(() => {
    if (historyVersions.length === 0) {
      return false
    }
    const earliestVersion = historyVersions[0]
    return earliestVersion > 1
  }, [historyVersions])

  const getVersionUrl = useCallback(
    (targetVersion: number) => {
      const baseUrl =
        targetVersion >= currentVersion
          ? `${RESOURCE_BASE_URL}/prompts/${encodedPromptKey}.json`
          : `${RESOURCE_BASE_URL}/prompts/${encodedPromptKey}-${targetVersion}.json`
      return appendCacheBuster(baseUrl)
    },
    [currentVersion, encodedPromptKey]
  )

  return {
    currentVersion,
    historyVersions,
    hasEarlierHistory,
    getVersionUrl,
  }
}

type PromptKeyEditorParams = {
  promptKey: string
  onPromptKeyChanged: (nextKey: string) => void
  onPromptKeyUpdated?: (nextKey: string) => void
}

export const usePromptKeyEditor = ({
  promptKey,
  onPromptKeyChanged,
  onPromptKeyUpdated,
}: PromptKeyEditorParams) => {
  const refreshPromptKeys = useSetAtom(promptKeysAtom)
  const modifyPromptKey = useSetAtom(modifyPromptKeyAtom)
  const [modifyKeyModalOpen, setModifyKeyModalOpen] = useState(false)
  const [newPromptKey, setNewPromptKey] = useState(promptKey)
  const [modifyingKey, setModifyingKey] = useState(false)

  useEffect(() => {
    setNewPromptKey(promptKey)
  }, [promptKey])

  const handleOpenModifyKeyModal = useCallback(() => {
    setNewPromptKey(promptKey)
    setModifyKeyModalOpen(true)
  }, [promptKey])

  const handleCloseModifyKeyModal = useCallback(() => {
    setModifyKeyModalOpen(false)
    setModifyingKey(false)
  }, [])

  const handleConfirmModifyKey = useCallback(async () => {
    const trimmedKey = newPromptKey.trim()
    if (!trimmedKey) {
      message.error("New prompt key is required.")
      return
    }
    if (trimmedKey === promptKey) {
      message.warning("Please enter a different prompt key.")
      return
    }

    try {
      setModifyingKey(true)
      await modifyPromptKey({ oldKey: promptKey, newKey: trimmedKey })
      refreshPromptKeys({ type: "refresh" })
      onPromptKeyUpdated?.(trimmedKey)
      setModifyKeyModalOpen(false)
      onPromptKeyChanged(trimmedKey)
      message.success(`Prompt key updated to "${trimmedKey}"`)
    } catch (error) {
      console.error(error)
      message.error("Failed to modify prompt key.")
    } finally {
      setModifyingKey(false)
    }
  }, [
    modifyPromptKey,
    newPromptKey,
    onPromptKeyChanged,
    onPromptKeyUpdated,
    promptKey,
    refreshPromptKeys,
  ])

  return {
    modifyKeyModalOpen,
    newPromptKey,
    modifyingKey,
    setNewPromptKey,
    handleOpenModifyKeyModal,
    handleCloseModifyKeyModal,
    handleConfirmModifyKey,
  }
}

type PromptDeletionParams = {
  promptKey: string
  onPromptDeleted?: (deletedKey: string) => void
}

export const usePromptDeletion = ({
  promptKey,
  onPromptDeleted,
}: PromptDeletionParams) => {
  const deletePrompt = useSetAtom(deletePromptAtom)
  const refreshPromptKeys = useSetAtom(promptKeysAtom)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingPrompt, setDeletingPrompt] = useState(false)

  useEffect(() => {
    setDeleteModalOpen(false)
    setDeletingPrompt(false)
  }, [promptKey])

  const handleOpenDeleteModal = useCallback(() => {
    setDeleteModalOpen(true)
  }, [])

  const handleCloseDeleteModal = useCallback(() => {
    setDeleteModalOpen(false)
    setDeletingPrompt(false)
  }, [])

  const handleConfirmDeletePrompt = useCallback(async () => {
    try {
      setDeletingPrompt(true)
      await deletePrompt({ key: promptKey })
      refreshPromptKeys({ type: "refresh" })
      setDeleteModalOpen(false)
      onPromptDeleted?.(promptKey)
      message.success(`Prompt "${promptKey}" deleted`)
    } catch (error) {
      console.error(error)
      message.error("Failed to delete prompt.")
    } finally {
      setDeletingPrompt(false)
    }
  }, [deletePrompt, onPromptDeleted, promptKey, refreshPromptKeys])

  return {
    deleteModalOpen,
    deletingPrompt,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleConfirmDeletePrompt,
  }
}
