# GET /find

按查询参数检索 profiles 或 accounts。

## 目录

- [用法](#用法)
- [请求](#请求)
- [响应](#响应)

## 用法

`GET /find`

## 请求

- 查询参数取决于检索类型（例如 `?mobile=` 或 `?nickname=`）。
- Authorization：`Bearer <token>` 或 `pmate-session` cookie。

## 响应

```json
{
  "results": [
    {
      "id": "<profile-id>",
      "nickname": "Alice",
      "mobile": "+86-13800000000"
    }
  ]
}
```
