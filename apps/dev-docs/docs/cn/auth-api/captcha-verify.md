# POST /captcha/verify

在请求短信验证码前校验验证码 token。

## 目录

- [用法](#用法)
- [请求](#请求)
- [响应](#响应)
- [说明](#说明)

## 用法

`POST /captcha/verify`

## 请求

```json
{
  "token": "<aliyun-captcha-token>",
  "scene": "login"
}
```

## 响应

```json
{
  "success": true
}
```

## 说明

- `POST /vcode` 会内部调用，也可用于前置校验流程。
