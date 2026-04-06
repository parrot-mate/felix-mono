# PUT /profile

Update an existing profile for the authenticated account.

## Table of Contents

- [Usage](#usage)
- [Request](#request)
- [Response](#response)

## Usage

`PUT /profile`

## Request

```json
{
  "id": "<profile-id>",
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
