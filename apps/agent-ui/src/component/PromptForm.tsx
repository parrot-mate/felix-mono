import { Prompt, PromptFieldType, ModelNames, PromptTaskType } from "@pmate/meta"
import { Button, Collapse, Empty, Form, Input, Select, Switch } from "antd"
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons"
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react"

type FormError = {
  name: (string | number)[]
  errors: string[]
}

export type PromptFormState = {
  prompt: Prompt
  errors: FormError[]
}

export type PromptFormHandle = {
  submit: () => Promise<Prompt>
  setPromptKey: (value: string) => void
}

type PromptFormProps = {
  initialPrompt: Prompt
  onStateUpdate: (state: PromptFormState) => void
  onEditKey?: () => void
  disableEditKey?: boolean
  allowKeyEdit?: boolean
}

const promptRoleOptions = [
  { label: "system", value: "system" },
  { label: "user", value: "user" },
]

const promptFieldTypeOptions = Object.values(PromptFieldType).map((value) => ({
  label: value,
  value,
}))

const modelOptions = Object.values(ModelNames).map((value) => ({
  label: value,
  value,
}))

const taskTypeOptions = [
  { label: "LLM", value: PromptTaskType.TextToText },
  { label: "语音转文本", value: PromptTaskType.SpeechToText },
  { label: "文本转语音", value: PromptTaskType.TextToSpeech },
  { label: "翻译", value: PromptTaskType.Translation },
  { label: "生成图片", value: PromptTaskType.ImageGeneration },
]

const clonePromptForForm = (source: Prompt): Prompt => ({
  ...source,
  messages: source.messages.map((message) => ({ ...message })),
  variables: source.variables.map((variable) => ({
    ...variable,
    required: variable.required ?? true,
  })),
})

const normalizePromptValues = (
  basePrompt: Prompt,
  values: Partial<Prompt>
): Prompt => ({
  ...basePrompt,
  ...values,
  key: values.key ?? basePrompt.key,
  caching:
    typeof values.caching === "boolean"
      ? values.caching
      : Boolean(basePrompt.caching),
  messages: (values.messages ?? []).map((message) => ({
    role: message?.role ?? "system",
    content: message?.content ?? "",
  })),
  variables: (values.variables ?? []).map((variable) => ({
    type: variable?.type ?? PromptFieldType.Text,
    name: variable?.name ?? "",
    description: variable?.description ?? "",
    required:
      typeof variable?.required === "boolean" ? variable.required : true,
  })),
})

const promptKeyValidationRules = [
  { required: true, message: "Prompt key is required" },
  {
    validator: (_rule: unknown, value: string) => {
      if (typeof value !== "string") {
        return Promise.resolve()
      }
      const trimmed = value.trim()
      if (!trimmed) {
        return Promise.reject(new Error("Prompt key cannot be empty."))
      }
      if (trimmed.includes("..")) {
        return Promise.reject(new Error('Prompt key cannot contain "..".'))
      }
      return Promise.resolve()
    },
  },
]

export const PromptForm = forwardRef<PromptFormHandle, PromptFormProps>(
  (
    {
      initialPrompt,
      onStateUpdate,
      onEditKey,
      disableEditKey,
      allowKeyEdit = false,
    },
    ref
  ) => {
    const [form] = Form.useForm<Prompt>()
    const initialFormValues = useMemo(
      () => clonePromptForForm(initialPrompt),
      [initialPrompt]
    )

    const collectFieldErrors = useCallback(
      () => form.getFieldsError().filter(({ errors }) => errors.length > 0),
      [form]
    )

    const syncState = useCallback(() => {
      const rawValues = form.getFieldsValue(true) as Partial<Prompt>
      const normalized = normalizePromptValues(initialPrompt, rawValues)
      onStateUpdate({
        prompt: normalized,
        errors: collectFieldErrors(),
      })
    }, [collectFieldErrors, form, initialPrompt, onStateUpdate])

    useImperativeHandle(
      ref,
      () => ({
        submit: async () => {
          const values = await form.validateFields()
          const normalized = normalizePromptValues(initialPrompt, values)
          onStateUpdate({
            prompt: normalized,
            errors: collectFieldErrors(),
          })
          return normalized
        },
        setPromptKey: (value: string) => {
          form.setFieldValue("key", value)
          syncState()
        },
      }),
      [collectFieldErrors, form, initialPrompt, onStateUpdate, syncState]
    )

    useEffect(() => {
      form.setFieldsValue(initialFormValues)
      onStateUpdate({
        prompt: normalizePromptValues(initialPrompt, initialFormValues),
        errors: [],
      })
    }, [form, initialFormValues, initialPrompt, onStateUpdate])

    const handleEditKey = useCallback(() => {
      if (disableEditKey) {
        return
      }
      onEditKey?.()
    }, [disableEditKey, onEditKey])

    return (
      <Form
        layout="vertical"
        form={form}
        initialValues={initialFormValues}
        onValuesChange={syncState}
        className="flex flex-col gap-6"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Item label="Key" required={allowKeyEdit}>
            <div className="flex items-center gap-2">
              <Form.Item
                name="key"
                noStyle
                rules={allowKeyEdit ? promptKeyValidationRules : undefined}
              >
                <Input
                  disabled={!allowKeyEdit || disableEditKey}
                  placeholder={allowKeyEdit ? "e.g. reader/example" : undefined}
                  autoFocus={allowKeyEdit}
                />
              </Form.Item>
              {!allowKeyEdit && (
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={handleEditKey}
                  disabled={!onEditKey || disableEditKey}
                  title="Modify prompt key"
                />
              )}
            </div>
          </Form.Item>
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input placeholder="Friendly title" />
          </Form.Item>
          <Form.Item
            label="Model"
            name="model"
            rules={[{ required: true, message: "Model key is required" }]}
          >
            <Select
              showSearch
              placeholder="Select a model"
              options={modelOptions}
              filterOption={(input, option) =>
                (option?.value as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item label="Task Type" name="taskType">
            <Select placeholder="Select a task type" options={taskTypeOptions} />
          </Form.Item>
          <Form.Item label="Result Type" name="resultType">
            <Select
              options={[
                { label: "json", value: "json" },
                { label: "text", value: "text" },
              ]}
            />
          </Form.Item>
        </div>

        <Collapse
          bordered={false}
          defaultActiveKey={["messages", "variables"]}
          className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface-2)]"
          items={[
            {
              key: "messages",
              label: (
                <span className="font-semibold text-[var(--ui-text)]">
                  Messages <span className="text-red-400">*</span>
                </span>
              ),
              children: (
                <Form.List name="messages">
                  {(fields, { add, remove }) => (
                    <div className="flex flex-col gap-4">
                      {fields.length === 0 ? (
                        <Empty description="No messages. Add one to start." />
                      ) : (
                        fields.map(({ key, name, ...field }) => (
                          <div
                            key={key}
                            className="rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <Form.Item
                                {...field}
                                name={[name, "role"]}
                                className="mb-0 w-40"
                                rules={[
                                  { required: true, message: "Role is required" },
                                ]}
                              >
                                <Select
                                  options={promptRoleOptions}
                                  className="[&_.ant-select-selection-item]:font-semibold [&_.ant-select-selection-item]:text-[var(--ui-accent)]"
                                />
                              </Form.Item>
                              <Button
                                danger
                                type="text"
                                icon={<DeleteOutlined />}
                                onClick={() => remove(name)}
                              />
                            </div>
                            <Form.Item
                              {...field}
                              name={[name, "content"]}
                              className="mt-3 mb-0"
                              rules={[
                                {
                                  required: true,
                                  message: "Content is required",
                                },
                              ]}
                            >
                              <Input.TextArea
                                autoSize={{ minRows: 3 }}
                                placeholder="Message content"
                              />
                            </Form.Item>
                          </div>
                        ))
                      )}
                      <Button
                        type="dashed"
                        className="w-full border-[var(--ui-border)] text-[var(--ui-text)]"
                        icon={<PlusOutlined />}
                        onClick={() =>
                          add({
                            role: "system",
                            content: "",
                          })
                        }
                      >
                        Add Message
                      </Button>
                    </div>
                  )}
                </Form.List>
              ),
            },
            {
              key: "variables",
              label: (
                <span className="font-semibold text-[var(--ui-text)]">Variables</span>
              ),
              children: (
                <Form.List name="variables">
                  {(variableItems, { add, remove }) => (
                    <div className="flex flex-col gap-4">
                      {variableItems.length === 0 ? (
                        <Empty description="No variables configured." />
                      ) : (
                        variableItems.map(({ key, name, ...fieldProps }) => (
                          <div
                            key={key}
                            className="rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <Form.Item
                                {...fieldProps}
                                name={[name, "type"]}
                                className="mb-0 w-48"
                              >
                                <Select
                                  options={promptFieldTypeOptions}
                                  className="[&_.ant-select-selection-item]:font-semibold [&_.ant-select-selection-item]:text-[var(--ui-accent)]"
                                />
                              </Form.Item>
                              <Button
                                danger
                                type="text"
                                icon={<DeleteOutlined />}
                                onClick={() => remove(name)}
                              />
                            </div>
                            <Form.Item
                              {...fieldProps}
                              name={[name, "name"]}
                              className="mt-3 mb-0"
                              rules={[
                                {
                                  required: true,
                                  message: "Variable name required",
                                },
                              ]}
                            >
                              <Input placeholder="Variable name" />
                            </Form.Item>
                            <Form.Item
                              {...fieldProps}
                              name={[name, "description"]}
                              className="mt-3 mb-0"
                            >
                              <Input placeholder="Description (optional)" />
                            </Form.Item>
                            <Form.Item
                              {...fieldProps}
                              name={[name, "required"]}
                              label="Required"
                              valuePropName="checked"
                              className="mt-3 mb-0"
                            >
                              <Switch
                                checkedChildren="Required"
                                unCheckedChildren="Optional"
                              />
                            </Form.Item>
                          </div>
                        ))
                      )}
                      <Button
                        type="dashed"
                        className="w-full border-[var(--ui-border)] text-[var(--ui-text)]"
                        icon={<PlusOutlined />}
                        onClick={() =>
                          add({
                            name: "",
                            description: "",
                            type: PromptFieldType.Text,
                            required: true,
                          })
                        }
                      >
                        Add Variable
                      </Button>
                    </div>
                  )}
                </Form.List>
              ),
            },
          ]}
        />

        <Form.Item
          label="Caching"
          name="caching"
          valuePropName="checked"
          tooltip="Enable caching for this prompt?"
        >
          <Switch />
        </Form.Item>
      </Form>
    )
  }
)
PromptForm.displayName = "PromptForm"
