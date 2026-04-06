# POST /captcha/verify

Validate a captcha token before requesting an SMS code.

## Table of Contents

- [Usage](#usage)
- [Request](#request)
- [Response](#response)
- [Notes](#notes)

## Usage

`POST /captcha/verify`

## Request

```json
{
  "token": "<aliyun-captcha-token>",
  "scene": "login"
}
```

## Response

```json
{
  "success": true
}
```

## Notes

- Used by `POST /vcode` internally or in preflight flows.
