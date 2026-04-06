# GET /profiles

List profiles for the authenticated account.

## Table of Contents

- [Usage](#usage)
- [Request](#request)
- [Response](#response)

## Usage

`GET /profiles`

## Request

- Authorization: `Bearer <token>` or `pmate-session` cookie.

## Response

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
