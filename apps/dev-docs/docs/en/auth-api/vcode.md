# POST /vcode

Issue an SMS verification code after captcha validation.

## Table of Contents

- [Usage](#usage)
- [Request](#request)
- [Response](#response)
- [Notes](#notes)

## Usage

`POST /vcode`

## Request

```json
{
  "mobile": "+86-13800000000",
  "purpose": "login",
  "captchaToken": "<aliyun-captcha-token>"
}
```

## Response

```json
{
  "nonce": "<nonce>",
  "issuedAt": 1700000000,
  "expiresAt": 1700000300
}
```

## Notes

- Captcha is required before issuing SMS codes.
- The returned `nonce` is used in `POST /login`.
- When `TEST_AUTH_KEY` is configured, a restricted test flow is available through `x-test` plus a `test_` mobile. That flow does not send real SMS, but it still issues the `nonce` required by `POST /login`.
