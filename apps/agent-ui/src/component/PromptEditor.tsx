import {
  usePromptDetail,
  usePromptDeletion,
  usePromptKeyEditor,
  usePromptVersions,
} from "@/hook/usePromptEditor"
import { Prompt } from "@pmate/meta"
import {
  Alert,
  Button,
  Card,
  Divider,
  Input,
  Modal,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd"
import { DeleteOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons"
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
  onPromptDeleted: (deletedKey: string) => void
}
const PromptEditorContent = ({
  promptKey,
  onPromptKeyChanged,
  onPromptDeleted,
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
  const {
    deleteModalOpen,
    deletingPrompt,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleConfirmDeletePrompt,
  } = usePromptDeletion({
    promptKey: prompt.key,
    onPromptDeleted,
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
    <Card
      className="agent-panel"
      bodyStyle={{ display: "flex", flexDirection: "column", gap: 24 }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Title level={3} className="!mb-0">
              {prompt.title || prompt.key}
            </Title>
            <Tag color="processing">v{currentVersion}</Tag>
            {prompt.caching ? <Tag color="gold">Caching</Tag> : null}
          </div>
          <Text className="text-[var(--ui-text-muted)]">{prompt.key}</Text>
        </div>
        <Space>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleOpenDeleteModal}
            disabled={saving || modifyingKey || deletingPrompt}
          >
            Delete
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset} disabled={saving}>
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

      <Divider className="my-0" />

      <Tabs
        defaultActiveKey="editor"
        className="agent-tabs"
        items={[
          {
            key: "editor",
            label: "Editor",
            children: (
              <PromptForm
                ref={promptFormRef}
                initialPrompt={prompt}
                onStateUpdate={setFormState}
                onEditKey={handleOpenModifyKeyModal}
                disableEditKey={saving || modifyingKey}
              />
            ),
          },
          {
            key: "history",
            label: "History",
            children: (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Text className="text-[var(--ui-text-muted)]">Jump to version</Text>
                  <Input
                    value={gotoVersion}
                    onChange={(event) => setGotoVersion(event.target.value)}
                    onPressEnter={handleGotoVersion}
                    placeholder="e.g. 3"
                    className="w-28"
                  />
                  <Button onClick={handleGotoVersion}>Open</Button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {historyVersions.length === 0 ? (
                    <Text className="text-[var(--ui-text-muted)]">No history yet.</Text>
                  ) : (
                    <>
                      {hasEarlierHistory && (
                        <span className="text-[var(--ui-text-muted)]">...</span>
                      )}
                      {historyVersions.map((version, index) => (
                        <Fragment key={version}>
                          <Link
                            href={getVersionUrl(version)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            v{version}
                          </Link>
                          {index !== historyVersions.length - 1 && (
                            <span className="text-[var(--ui-text-muted)]">|</span>
                          )}
                        </Fragment>
                      ))}
                    </>
                  )}
                </div>
              </div>
            ),
          },
        ]}
      />

      <Modal
        title="Modify Prompt Key"
        open={modifyKeyModalOpen}
        okText="Confirm"
        cancelText="Cancel"
        okButtonProps={{
          danger: true,
          loading: modifyingKey,
          disabled: !newPromptKey.trim() || newPromptKey.trim() === prompt.key,
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

      <Modal
        title="Delete Prompt"
        open={deleteModalOpen}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{
          danger: true,
          loading: deletingPrompt,
        }}
        onOk={handleConfirmDeletePrompt}
        onCancel={handleCloseDeleteModal}
        destroyOnClose
      >
        <div className="flex flex-col gap-3">
          <Alert
            type="error"
            showIcon
            message="This action cannot be undone."
            description="Deleting this prompt will remove the key and its latest version from storage."
          />
          <Text className="text-[var(--ui-text-muted)]">
            Confirm deletion for <Text strong>{prompt.key}</Text>.
          </Text>
        </div>
      </Modal>
    </Card>
  )
}

export const PromptEditor = ({
  promptKey,
  onPromptKeyChanged,
  onPromptDeleted,
}: PromptEditorProps) => {
  return (
    <Suspense
      fallback={
        <Card className="agent-panel">
          <div className="flex h-[420px] items-center justify-center">
            <Spin />
          </div>
        </Card>
      }
    >
      <PromptEditorContent
        promptKey={promptKey}
        onPromptKeyChanged={onPromptKeyChanged}
        onPromptDeleted={onPromptDeleted}
      />
    </Suspense>
  )
}
