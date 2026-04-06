# POST /vcode

在验证码校验通过后下发短信验证码。

## 目录

- [用法](#用法)
- [请求](#请求)
- [响应](#响应)
- [说明](#说明)

## 用法

`POST /vcode`

## 请求

```json
{
  "mobile": "+86-13800000000",
  "purpose": "login",
  "captchaToken": "<aliyun-captcha-token>"
}
```

## 响应

```json
{
  "nonce": "<nonce>",
  "issuedAt": 1700000000,
  "expiresAt": 1700000300
}
```

## 说明

- 发短信前必须完成验证码校验。
- 返回的 `nonce` 用于 `POST /login`。
- 若服务端配置了 `TEST_AUTH_KEY`，可通过 `x-test` + `test_` 前缀手机号进入受限测试流程；该流程不会发送真实短信，但仍会返回必须用于 `POST /login` 的 `nonce`。
