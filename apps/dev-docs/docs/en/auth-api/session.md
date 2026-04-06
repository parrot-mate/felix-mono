# GET /session

Return the current session payload for a valid token.

## Table of Contents

- [Usage](#usage)
- [Request](#request)
- [Response](#response)
- [Notes](#notes)

## Usage

`GET /session`

## Request

- Authorization: `Bearer <token>` or `pmate-session` cookie.

## Response

```json
{
  "identity": {
    "id": "<account-id>",
    "mobile": "+86-13800000000"
  }
}
```

## Notes

- Returns 401 if the session is missing or expired.
