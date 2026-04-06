# GET /find

Find profiles or accounts by query parameters.

## Table of Contents

- [Usage](#usage)
- [Request](#request)
- [Response](#response)

## Usage

`GET /find`

## Request

- Query params depend on the search type (for example, `?mobile=` or `?nickname=`).
- Authorization: `Bearer <token>` or `pmate-session` cookie.

## Response

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
