# POST /logout

注销当前会话。

## 目录

- [用法](#用法)
- [请求](#请求)
- [响应](#响应)
- [说明](#说明)

## 用法

`POST /logout`

## 请求

- Authorization：`Bearer <token>` 或 `pmate-session` cookie。

## 响应

```json
{
  "success": true
}
```

## 说明

- 若存在 `pmate-session` cookie，将被清除。
