import {
  usePromptDetail,
  usePromptKeyEditor,
  usePromptVersions,
} from "@/hook/usePromptEditor"
import { Prompt } from "@pmate/meta"
import { Alert, Button, Divider, Input, Modal, Space, Spin, Typography, message } from "antd"
import { ReloadOutlined, SaveOutlined } from "@ant-design/icons"
import {
  Fragment,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { PromptForm, PromptFormHandle, PromptFormState } from "./PromptForm"

const { Title, Text, Link } = Typography

type PromptEditorProps = {
  promptKey: string
  onPromptKeyChanged: (nextKey: string) => void
}
const PromptEditorContent = ({
  promptKey,
  onPromptKeyChanged,
}: PromptEditorProps) => {
  const { prompt, refreshPrompt, updatePrompt } = usePromptDetail(promptKey)
  const {
    currentVersion,
    historyVersions,
    hasEarlierHistory,
    getVersionUrl,
  } = usePromptVersions(prompt)
  const {
    modifyKeyModalOpen,
    newPromptKey,
    modifyingKey,
    setNewPromptKey,
    handleOpenModifyKeyModal,
    handleCloseModifyKeyModal,
    handleConfirmModifyKey,
  } = usePromptKeyEditor({
    promptKey: prompt.key,
    onPromptKeyChanged,
    onPromptKeyUpdated: (nextKey) => {
      promptFormRef.current?.setPromptKey(nextKey)
    },
  })
  const [saving, setSaving] = useState(false)
  const [gotoVersion, setGotoVersion] = useState("")
  const promptFormRef = useRef<PromptFormHandle>(null)
  const [formState, setFormState] = useState<PromptFormState>({
    prompt,
    errors: [],
  })
  const hasValidationErrors = formState.errors.length > 0

  useEffect(() => {
    setGotoVersion("")
    setFormState({
      prompt,
      errors: [],
    })
  }, [prompt])

  const handleSave = useCallback(async () => {
    if (!promptFormRef.current) {
      return
    }
    try {
      setSaving(true)
      const values = await promptFormRef.current.submit()
      const targetVersion = (prompt.version ?? 0) + 1
      const payload: Prompt = {
        ...prompt,
        ...values,
        key: prompt.key,
        version: targetVersion,
        caching: Boolean(
          typeof values.caching === "boolean" ? values.caching : prompt.caching
        ),
        messages: (values.messages ?? []).map((message) => ({
          role: message.role,
          content: message.content,
        })),
        variables: (values.variables ?? []).map((variable) => ({
          type: variable.type,
          name: variable.name,
          description: variable.description,
          required:
            typeof variable.required === "boolean" ? variable.required : true,
        })),
      }
      await updatePrompt(payload)
      await refreshPrompt({ type: "refresh" })
      message.success(`Prompt "${promptKey}" saved`)
    } catch (error) {
      if ((error as any)?.errorFields) {
        message.error("Please fix validation errors before saving.")
        return
      }
      console.error(error)
      message.error("Failed to save prompt.")
    } finally {
      setSaving(false)
    }
  }, [updatePrompt, refreshPrompt, prompt, promptKey])

  const handleReset = useCallback(async () => {
    await refreshPrompt({ type: "refresh" })
    message.success("Prompt reloaded")
  }, [refreshPrompt])

  const handleGotoVersion = useCallback(() => {
    const trimmedValue = gotoVersion.trim()
    if (!trimmedValue) {
      message.warning("Enter a version number to open.")
      return
    }
    const parsed = Number.parseInt(trimmedValue, 10)
    if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
      message.error("Version must be a valid number.")
      return
    }
    if (parsed < 1 || parsed > currentVersion) {
      message.error(`Version must be between 1 and ${currentVersion}.`)
      return
    }
    const targetUrl = getVersionUrl(parsed)
    if (typeof window !== "undefined") {
      window.open(targetUrl, "_blank", "noopener,noreferrer")
    }
    setGotoVersion("")
  }, [currentVersion, getVersionUrl, gotoVersion])

  return (
    <div className="flex h-full flex-col gap-4 rounded-lg border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-lg shadow-slate-900/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Title level={4} className="!mb-0 font-semibold text-slate-100">
            {prompt.title || prompt.key}
          </Title>
          <Text type="secondary" className="!text-slate-400">
            {prompt.key}
          </Text>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
            <span className="uppercase tracking-wide text-slate-500">
              History
            </span>
            <span className="text-slate-500">goto</span>
            <Input
              size="small"
              value={gotoVersion}
              onChange={(event) => setGotoVersion(event.target.value)}
              onPressEnter={handleGotoVersion}
              placeholder="Enter version"
              className="w-24 !bg-slate-800 !text-slate-100"
            />
            <span className="text-slate-700">|</span>
            {historyVersions.length === 0 ? (
              <span className="text-slate-600">No history yet</span>
            ) : (
              <>
                {hasEarlierHistory && (
                  <>
                    <span className="text-slate-600">..</span>
                    <span className="text-slate-700">|</span>
                  </>
                )}
                {historyVersions.map((version, index) => (
                  <Fragment key={version}>
                    <Link
                      href={getVersionUrl(version)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-300"
                    >
                      {version}
                    </Link>
                    {index !== historyVersions.length - 1 && (
                      <span className="text-slate-700">|</span>
                    )}
                  </Fragment>
                ))}
              </>
            )}
          </div>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleReset}
            disabled={saving}
          >
            Reload
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            disabled={saving || hasValidationErrors}
            onClick={handleSave}
          >
            Save
          </Button>
        </Space>
      </div>

      <Divider className="my-2" />

      <PromptForm
        ref={promptFormRef}
        initialPrompt={prompt}
        onStateUpdate={setFormState}
        onEditKey={handleOpenModifyKeyModal}
        disableEditKey={saving || modifyingKey}
      />

      <Modal
        title="Modify Prompt Key"
        open={modifyKeyModalOpen}
        okText="Confirm"
        cancelText="Cancel"
        okButtonProps={{
          danger: true,
          loading: modifyingKey,
          disabled:
            !newPromptKey.trim() || newPromptKey.trim() === prompt.key,
        }}
        onOk={handleConfirmModifyKey}
        onCancel={handleCloseModifyKeyModal}
        destroyOnClose
      >
        <div className="flex flex-col gap-3">
          <Alert
            type="error"
            showIcon
            message="Dangerous operation"
            description="Changing the prompt key will create a new prompt file and may break any references to the previous key. Confirm only if you understand the impact."
          />
          <Input
            value={newPromptKey}
            onChange={(event) => setNewPromptKey(event.target.value)}
            placeholder="Enter new prompt key"
            autoFocus
          />
        </div>
      </Modal>
    </div>
  )
}

export const PromptEditor = ({
  promptKey,
  onPromptKeyChanged,
}: PromptEditorProps) => {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Spin />
        </div>
      }
    >
      <PromptEditorContent
        promptKey={promptKey}
        onPromptKeyChanged={onPromptKeyChanged}
      />
    </Suspense>
  )
}
