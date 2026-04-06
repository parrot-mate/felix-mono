type Grant = FeatureGrant | QuotaGrant

export interface Subscription {
  userId: string
  plan: string // e.g., "basic", "premium"
  start: number
  end: number
  grants: Grant[]
}

export enum GrantType {
  Feature,
  Quota,
}

export interface BaseGrant {
  type: GrantType
  resource: string
}

export type FeatureGrant = BaseGrant & {
  type: GrantType.Feature
}
export type QuotaGrant = BaseGrant & {
  type: GrantType.Quota
  quota: number
}

export type ResourceConsumeLog = {
  t: number
  resource: string
  user: string
}
