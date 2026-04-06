import type { Account as AccountEntity, AccountState } from "@pmate/meta"
import { TopicNames, TS_LogKind } from "@pmate/meta"
import {
  IndexerQuery,
  TSLogBuilder,
  generateAddress,
  mappingKeys,
  signToken,
} from "@pmate/service-core"
import { blockchain } from "./blockchain"

export class Account {
  static async exists(mobile: string) {
    const id = await IndexerQuery.getMappedValue<string>(
      mappingKeys.mobileAccount(mobile)
    )
    return Boolean(id)
  }

  static async info(mobile: string): Promise<AccountEntity> {
    const id = await IndexerQuery.getMappedValue<string>(
      mappingKeys.mobileAccount(mobile)
    )
    if (!id) {
      throw new Error("用户不存在")
    }
    const user = await IndexerQuery.entity<AccountEntity>(id)
    if (!user) {
      throw new Error("用户不存在")
    }
    return user
  }

  static async createForMobile(mobile: string, app?: string) {
    const exists = await Account.exists(mobile)
    if (exists) {
      throw new Error("账号已存在")
    }

    const id = generateAddress()
    const account: AccountEntity = {
      id,
      createdAt: Date.now(),
      mobile,
      ...(app ? { app } : {}),
    }

    const mapLog = TSLogBuilder.mapping({
      key: mappingKeys.mobileAccount(mobile),
      value: id,
    })
    const accountLog = TSLogBuilder.entityCreated({
      topic: TopicNames.profiles(),
      kind: TS_LogKind.Entity_ACCOUNT,
      entity: account,
    })
    await blockchain.appendBatch([mapLog, accountLog])

    const [token, signTime] = signToken(id)
    const state: AccountState = {
      accountId: id,
      token,
      signTime,
    }

    return { account, state }
  }
}
