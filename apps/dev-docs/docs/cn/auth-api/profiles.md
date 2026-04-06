# GET /profiles

列出当前账号的 profiles。

## 目录

- [用法](#用法)
- [请求](#请求)
- [响应](#响应)

## 用法

`GET /profiles`

## 请求

- Authorization：`Bearer <token>` 或 `pmate-session` cookie。

## 响应

```json
{
  "profiles": [
    {
      "id": "<profile-id>",
      "nickname": "Alice",
      "lang": "en"
    }
  ]
}
```
