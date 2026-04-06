import { createPromptAtom } from "@/atom/createPromptAtom"
import { promptKeysAtom } from "@/atom/remotePromptsAtom"
import { Prompt } from "@pmate/meta"
import {
  PromptForm,
  PromptFormHandle,
  PromptFormState,
} from "@/component/PromptForm"
import { Button, Typography, message } from "antd"
import { useSetAtom } from "jotai"
import { useCallback, useMemo, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

const encodePromptKey = (key: string) =>
  key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")

const createInitialPrompt = (): Prompt => ({
  key: "",
  title: "",
  model: "",
  messages: [
    {
      role: "system",
      content: "",
    },
  ],
  variables: [],
  resultType: "json",
  caching: false,
  version: 0,
})

export const AddPromptPage = () => {
  const navigate = useNavigate()
  const createPrompt = useSetAtom(createPromptAtom)
  const refreshPromptKeys = useSetAtom(promptKeysAtom)
  const [submitting, setSubmitting] = useState(false)

  const initialPrompt = useMemo(() => createInitialPrompt(), [])
  const [formState, setFormState] = useState<PromptFormState>({
    prompt: initialPrompt,
    errors: [],
  })
  const promptFormRef = useRef<PromptFormHandle>(null)

  const hasValidationErrors = formState.errors.length > 0
  const trimmedKey = formState.prompt.key.trim()
  const isCreateDisabled = submitting || hasValidationErrors || !trimmedKey

  const handleCreatePrompt = useCallback(async () => {
    if (!promptFormRef.current) {
      return
    }

    let values: Prompt
    try {
      values = await promptFormRef.current.submit()
    } catch (error) {
      if ((error as { errorFields?: unknown[] } | undefined)?.errorFields) {
        message.error("Please fix validation errors before creating the prompt.")
        return
      }
      console.error(error)
      message.error("Failed to collect prompt values.")
      return
    }

    const nextKey = values.key.trim()
    if (!nextKey) {
      message.error("Prompt key is required.")
      return
    }

    const { key: _ignoredKey, version, ...templateRest } = values
    const template: Partial<Prompt> = {
      ...templateRest,
      title: values.title.trim(),
      model: values.model.trim(),
      version,
    }

    try {
      setSubmitting(true)
      await createPrompt({
        key: nextKey,
        template,
      })
      await refreshPromptKeys({ type: "refresh" })
      message.success(`Prompt "${nextKey}" created.`)
      const encodedKey = encodePromptKey(nextKey)
      navigate(`/prompts?key=${encodedKey}`, { replace: true })
    } catch (error) {
      console.error(error)
      const errorMessage =
        (error as { message?: string } | undefined)?.message ??
        "Failed to create prompt."
      message.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }, [createPrompt, navigate, refreshPromptKeys])

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-slate-300">
        <Link
          to="/prompts"
          className="font-medium text-primary-300 transition-colors hover:text-primary-200"
        >
          Prompts
        </Link>
        <span className="text-slate-500">/</span>
        <span className="font-medium text-slate-100">Add Prompt</span>
      </nav>
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-lg">
        <div className="mb-6 space-y-1">
          <Typography.Title
            level={3}
            className="!m-0 text-slate-100"
            style={{ color: "inherit" }}
          >
            Create a new prompt
          </Typography.Title>
          <Typography.Paragraph className="!m-0 text-slate-400">
            Define a unique key and optional metadata. You can edit the prompt
            details after creation.
          </Typography.Paragraph>
        </div>
        <div className="space-y-4">
          <PromptForm
            ref={promptFormRef}
            initialPrompt={initialPrompt}
            onStateUpdate={setFormState}
            allowKeyEdit
            disableEditKey={submitting}
          />
          <div className="flex justify-end gap-3">
            <Button onClick={() => navigate("/prompts")} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleCreatePrompt}
              loading={submitting}
              disabled={isCreateDisabled}
            >
              Create Prompt
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddPromptPage
