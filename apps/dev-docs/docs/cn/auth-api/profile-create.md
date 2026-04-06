# POST /profile

为当前账号创建新的 profile。

## 目录

- [用法](#用法)
- [请求](#请求)
- [响应](#响应)

## 用法

`POST /profile`

## 请求

```json
{
  "nickname": "Alice",
  "lang": "en",
  "avatar": "<optional-url>"
}
```

## 响应

```json
{
  "id": "<profile-id>",
  "nickname": "Alice",
  "lang": "en"
}
```
