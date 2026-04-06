# PUT /profile

更新当前账号下已有的 profile。

## 目录

- [用法](#用法)
- [请求](#请求)
- [响应](#响应)

## 用法

`PUT /profile`

## 请求

```json
{
  "id": "<profile-id>",
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
