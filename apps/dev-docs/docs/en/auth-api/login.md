# POST /login

Verify an SMS code, create an account if needed, and return a session token.

## Table of Contents

- [Background](#background)
- [Usage](#usage)
- [Request](#request)
- [Response](#response)
- [Notes](#notes)

## Background

SMS login needs a consistent flow across code verification, account creation, and session issuance, or clients end up with extra retries and state mismatches. This endpoint bundles verification and account bootstrap to reduce client-side branching.

It establishes a session in a single call and supports both token and cookie scenarios, keeping downstream auth logic consistent across clients.

## Usage

`POST /login`

## Request

```json
{
  "nonce": "<nonce>",
  "issuedAt": 1700000000,
  "body": {
    "type": "sms",
    "mobile": "+86-13800000000",
    "vcode": "123456"
  }
}
```

## Response

```json
{
  "token": "<session-token>",
  "session": {
    "accountId": "<account-id>",
    "expiresAt": 1701200000
  },
  "identity": {
    "id": "<account-id>",
    "mobile": "+86-13800000000"
  }
}
```

## Notes

- The response also sets an httpOnly `pmate-session` cookie when applicable.
- If the account does not exist, it is created on first login.
- The restricted test flow must also call `POST /vcode` first and then `POST /login`.
- The test flow only accepts `test_` mobiles and the fixed test vcode `888888`; direct login without a test-issued `nonce` is rejected.
