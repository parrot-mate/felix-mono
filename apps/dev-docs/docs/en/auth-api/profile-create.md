# POST /profile

Create a new profile for the authenticated account.

## Table of Contents

- [Usage](#usage)
- [Request](#request)
- [Response](#response)

## Usage

`POST /profile`

## Request

```json
{
  "nickname": "Alice",
  "lang": "en",
  "avatar": "<optional-url>"
}
```

## Response

```json
{
  "id": "<profile-id>",
  "nickname": "Alice",
  "lang": "en"
}
```
