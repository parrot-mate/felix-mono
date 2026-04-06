export type LangShort = string
export type UserRole = string

export type Entity<T> = {
  id: string
} & T

export type ProfileInfo = {
  app: string
  account: string
  userName: string
  nickName: string
  avatar: string
  gender?: 'F' | 'M'
  email?: string
  motherTongue: LangShort
  learningTargetLang: LangShort
  role: UserRole
  name: string
}

export type Profile = Entity<ProfileInfo>
