# POST /login

校验短信验证码，如有需要会创建 account，并返回会话 token。

## 目录

- [背景](#背景)
- [用法](#用法)
- [请求](#请求)
- [响应](#响应)
- [说明](#说明)

## 背景

短信登录需要在验证码校验、账号创建、会话下发之间保持一致流程，否则容易出现多次请求或状态不一致。该接口把校验与账户初始化合并，减少客户端分支与额外判断。

它以单次请求建立登录态，同时覆盖 token 与 cookie 的多端场景，便于后续鉴权逻辑保持统一。

## 用法

`POST /login`

## 请求

```json
{
  "nonce": "<nonce>",
  "issuedAt": 1700000000,
  "body": {
    "type": "sms",
    "mobile": "+86-13800000000",
    "vcode": "123456"
  }
}
```

## 响应

```json
{
  "token": "<session-token>",
  "session": {
    "accountId": "<account-id>",
    "expiresAt": 1701200000
  },
  "identity": {
    "id": "<account-id>",
    "mobile": "+86-13800000000"
  }
}
```

## 说明

- 响应在可用时会设置 httpOnly 的 `pmate-session` cookie。
- 若 account 不存在，将在首次登录时创建。
- 受限测试流程也必须先调用 `POST /vcode` 获取 `nonce`，再调用 `POST /login`。
- 测试流程仅允许 `test_` 前缀手机号，并使用固定测试验证码 `888888`；没有测试 `nonce` 的直登请求会被拒绝。
