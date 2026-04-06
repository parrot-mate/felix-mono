# GET /session

在 token 有效时返回当前会话信息。

## 目录

- [用法](#用法)
- [请求](#请求)
- [响应](#响应)
- [说明](#说明)

## 用法

`GET /session`

## 请求

- Authorization：`Bearer <token>` 或 `pmate-session` cookie。

## 响应

```json
{
  "identity": {
    "id": "<account-id>",
    "mobile": "+86-13800000000"
  }
}
```

## 说明

- 会话缺失或过期时返回 401。
