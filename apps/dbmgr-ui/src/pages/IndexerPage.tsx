/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Layout,
  Select,
  Space,
  Switch,
  Typography,
} from "antd"
import { useEffect, useMemo, useState } from "react"
import {
  defaultChainId,
  requestIndexer,
  fetchIndexerConfigs,
  type IndexerRequestParams,
  type ChainIndexerConfig,
  type IndexerManifest,
  type IndexerActionManifest,
  type IndexerParamManifest,
} from "../api/indexerClient"
import { HeaderBar } from "../components/layout/HeaderBar"

const { Content } = Layout
const { Title, Text } = Typography

type FormValues = Record<string, any>
type IndexerDefinition = IndexerManifest
type IndexerAction = IndexerActionManifest
type IndexerParam = IndexerParamManifest

export function IndexerPage() {
  const [configs, setConfigs] = useState<ChainIndexerConfig[]>([])
  const [configsLoading, setConfigsLoading] = useState(true)
  const [configsError, setConfigsError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setConfigsLoading(true)
      setConfigsError(null)
      try {
        const fetched = await fetchIndexerConfigs()
        if (!cancelled) {
          setConfigs(fetched)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to load indexer configuration."
          setConfigsError(message)
          setConfigs([])
        }
      } finally {
        if (!cancelled) {
          setConfigsLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const [selectedChainId, setSelectedChainId] = useState<string>(defaultChainId)

  useEffect(() => {
    if (configs.length === 0) {
      return
    }
    const hasChain = configs.some((config) => config.id === selectedChainId)
    if (!hasChain) {
      setSelectedChainId(configs[0].id)
    }
  }, [configs, selectedChainId])

  const chainConfig = useMemo<ChainIndexerConfig | undefined>(() => {
    return configs.find((config) => config.id === selectedChainId)
  }, [configs, selectedChainId])

  const indexerOptions = useMemo<IndexerDefinition[]>(() => {
    return chainConfig?.indexers ?? []
  }, [chainConfig])

  const [selectedIndexerId, setSelectedIndexerId] = useState<
    string | undefined
  >(undefined)

  useEffect(() => {
    if (indexerOptions.length === 0) {
      setSelectedIndexerId(undefined)
      return
    }
    const hasCurrent = selectedIndexerId
      ? indexerOptions.some((indexer) => indexer.id === selectedIndexerId)
      : false
    if (!hasCurrent) {
      setSelectedIndexerId(indexerOptions[0].id)
    }
  }, [indexerOptions, selectedIndexerId])

  const selectedIndexer = useMemo<IndexerDefinition | undefined>(() => {
    if (!selectedIndexerId) {
      return undefined
    }
    return indexerOptions.find((indexer) => indexer.id === selectedIndexerId)
  }, [indexerOptions, selectedIndexerId])

  const [selectedActionId, setSelectedActionId] = useState<string | undefined>(
    undefined
  )

  useEffect(() => {
    if (!selectedIndexer) {
      setSelectedActionId(undefined)
      return
    }
    const actions = selectedIndexer.actions
    if (actions.length === 0) {
      setSelectedActionId(undefined)
      return
    }
    const hasCurrent = selectedActionId
      ? actions.some((action) => action.id === selectedActionId)
      : false
    if (!hasCurrent) {
      setSelectedActionId(actions[0].id)
    }
  }, [selectedIndexer, selectedActionId])

  const selectedAction = useMemo<IndexerAction | undefined>(() => {
    if (!selectedIndexer || !selectedActionId) {
      return undefined
    }
    return selectedIndexer.actions.find(
      (action) => action.id === selectedActionId
    )
  }, [selectedActionId, selectedIndexer])

  const [form] = Form.useForm<FormValues>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<unknown>(null)

  useEffect(() => {
    setError(null)
    setResult(null)
  }, [selectedChainId, selectedIndexerId, selectedActionId])

  useEffect(() => {
    form.resetFields()
    if (!selectedAction) {
      return
    }
    const defaults: FormValues = {}
    for (const param of selectedAction.params) {
      if (typeof param.defaultValue !== "undefined") {
        defaults[param.id] = param.defaultValue
      } else if (param.type === "boolean") {
        defaults[param.id] = false
      }
    }
    form.setFieldsValue(defaults)
  }, [form, selectedAction])

  const handleChainChange = (value: string) => {
    setSelectedChainId(value)
  }

  const handleIndexerChange = (value: string) => {
    setSelectedIndexerId(value)
  }

  const handleActionChange = (value: string) => {
    setSelectedActionId(value)
  }

  const handleSubmit = async (values: FormValues) => {
    if (!selectedAction || !selectedIndexer) {
      return
    }
    const params: IndexerRequestParams = {}
    for (const paramConfig of selectedAction.params) {
      const rawValue = values[paramConfig.id]
      const normalized = normalizeParamValue(paramConfig, rawValue)
      if (typeof normalized === "undefined") {
        continue
      }
      params[paramConfig.id] = normalized as string | number | boolean
    }

    setLoading(true)
    setError(null)
    try {
      const response = await requestIndexer(
        selectedChainId,
        selectedIndexer.id,
        selectedAction.id,
        params
      )
      setResult(response)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to fetch indexer action response."
      setError(message)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <HeaderBar chainId={selectedChainId} title="Indexer Explorer" />
      <Content className="flex flex-col gap-4 bg-slate-950 px-6 py-6">
        <Card
          className="border border-slate-800/70 bg-slate-900/80"
          bodyStyle={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Space direction="vertical" size={0}>
              <Title level={4} className="!mb-0 text-slate-100">
                Indexer Explorer
              </Title>
              <Text className="text-sm text-slate-400">
                Run actions against configured indexers with generated forms.
              </Text>
            </Space>
          </div>
          {configsError ? (
            <Alert
              type="error"
              message={configsError}
              showIcon
              className="w-full"
            />
          ) : null}
          <div className="flex flex-wrap gap-4">
            <Select
              className="min-w-48"
              value={selectedChainId}
              onChange={handleChainChange}
              loading={configsLoading}
              disabled={configsLoading && configs.length === 0}
              options={configs.map((chain) => ({
                value: chain.id,
                label: formatLabel(chain.id),
              }))}
            />
            <Select
              className="min-w-52"
              value={selectedIndexerId}
              onChange={handleIndexerChange}
              disabled={indexerOptions.length === 0}
              options={indexerOptions.map((indexer) => ({
                value: indexer.id,
                label: formatLabel(indexer.id),
              }))}
              placeholder="Select indexer"
            />
            <Select
              className="min-w-52"
              value={selectedActionId}
              onChange={handleActionChange}
              disabled={
                !selectedIndexer || selectedIndexer.actions.length === 0
              }
              options={
                selectedIndexer
                  ? selectedIndexer.actions.map((action) => ({
                      value: action.id,
                      label: formatLabel(action.id),
                    }))
                  : []
              }
              placeholder="Select action"
            />
          </div>
        </Card>

        <Card className="border border-slate-800/70 bg-slate-900/60">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            disabled={!selectedAction || configsLoading}
            className="flex flex-col gap-4"
          >
            {selectedAction?.params.map((param) => {
              const label = formatLabel(param.id)
              return (
                <Form.Item
                  key={param.id}
                  label={
                    <span className="text-slate-300">
                      {label}
                      {param.required ? (
                        <span className="text-red-400">{" *"}</span>
                      ) : null}
                    </span>
                  }
                  name={param.id}
                  rules={
                    param.required
                      ? [
                          {
                            required: true,
                            message: `${label} is required`,
                          },
                        ]
                      : undefined
                  }
                  valuePropName={param.type === "boolean" ? "checked" : "value"}
                >
                  {renderInput(param)}
                </Form.Item>
              )
            })}

            {selectedAction?.params.some((param) => param.helperText) ? (
              <Space direction="vertical" size={2}>
                {selectedAction.params
                  .filter((param) => param.helperText)
                  .map((param) => (
                    <Text key={param.id} className="text-xs text-slate-400">
                      {formatLabel(param.id)}: {param.helperText}
                    </Text>
                  ))}
              </Space>
            ) : null}

            <div className="flex justify-end">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={!selectedAction || configsLoading}
              >
                Run Action
              </Button>
            </div>
          </Form>
        </Card>

        <Card className="border border-slate-800/70 bg-slate-900/60">
          {error ? (
            <Alert type="error" message={error} showIcon className="mb-4" />
          ) : null}
          {result ? (
            <pre className="max-h-[420px] overflow-auto rounded-md bg-slate-950/80 p-4 text-xs text-slate-200">
              {formatResult(result)}
            </pre>
          ) : (
            <Text className="text-sm text-slate-400">
              Run an action to view the response.
            </Text>
          )}
        </Card>
      </Content>
    </Layout>
  )
}

function renderInput(param: IndexerParam) {
  switch (param.type) {
    case "number":
      return (
        <InputNumber
          style={{ width: "100%" }}
          placeholder={param.placeholder}
          min={0}
          stringMode
        />
      )
    case "boolean":
      return <Switch />
    case "select":
      return (
        <Select
          options={param.options?.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          placeholder={param.placeholder}
        />
      )
    case "string":
    default:
      return <Input placeholder={param.placeholder} />
  }
}

function normalizeParamValue(param: IndexerParam, rawValue: unknown) {
  if (typeof rawValue === "undefined" || rawValue === null) {
    return undefined
  }

  if (param.type === "string") {
    const value = String(rawValue).trim()
    return value.length === 0 ? undefined : value
  }

  if (param.type === "number") {
    if (rawValue === "") {
      return undefined
    }
    const parsed = Number(rawValue)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  if (param.type === "boolean") {
    return Boolean(rawValue)
  }

  return rawValue
}

function formatLabel(id: string): string {
  const parts = id
    .split(/[-_]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)

  if (parts.length === 0) {
    return id
  }

  return parts
    .map(
      (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join(" ")
}

function formatResult(result: unknown) {
  try {
    return JSON.stringify(result, null, 2)
  } catch {
    return String(result)
  }
}
