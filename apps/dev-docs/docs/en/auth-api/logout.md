# POST /logout

Invalidate the current session.

## Table of Contents

- [Usage](#usage)
- [Request](#request)
- [Response](#response)
- [Notes](#notes)

## Usage

`POST /logout`

## Request

- Authorization: `Bearer <token>` or `pmate-session` cookie.

## Response

```json
{
  "success": true
}
```

## Notes

- Clears the `pmate-session` cookie when present.
