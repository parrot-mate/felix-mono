export enum SYSTEM_NOTIFY_CODE {
  DM_ACL_REJECT = 4000,
  GROUP_ACL_REJECT = 4001,
}

export const SYSTEM_NOTIFY = 36

export interface SystemNotifyPayload {
  code: SYSTEM_NOTIFY_CODE
}
