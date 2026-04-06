# Auth Flow

The SMS-based login handled in `apps/service/src/entry/auth.server.ts` builds on the helpers under `apps/service/src/util/auth`. The diagram below stitches together the `/vcode`, `/login`, `/session`, and `/logout` endpoints, just as they are wired in the service today.

## Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Client as Web/Mobile Client
    participant AuthSvc as Auth Service
    participant VCodeMgr as VCodeManager
    participant NonceMgr as NonceManager
    participant VCodeStore as KVStore<vcode>
    participant AccountSvc as Account Service
    participant SessionMgr as SessionManager
    participant SessionStore as KVStore<session>

    rect rgb(242,242,242)
        User->>Client: Enter mobile number and request login
        Client->>AuthSvc: POST /vcode {mobile, purpose}
        AuthSvc->>VCodeMgr: issueSmsCode(payload, ipAddress)
        VCodeMgr->>NonceMgr: create(ipAddress)
        NonceMgr-->>VCodeMgr: nonce + issuedAt (rate limited, 5 min max age)
        VCodeMgr->>VCodeStore: persist {nonce, mobile, code, ttl 5 min}
        Note over VCodeMgr,User: Code is sent through the SMS channel (not shown) while the response carries the nonce/timestamps.
        VCodeMgr-->>AuthSvc: {nonce, issuedAt, expiresAt}
        AuthSvc-->>Client: Return nonce metadata for later verification
    end

    rect rgb(233,239,255)
        User->>Client: Provide SMS code + nonce
        Client->>AuthSvc: POST /login {body, nonce, issuedAt}
        AuthSvc->>VCodeMgr: verify(request)
        VCodeMgr->>VCodeStore: load nonce record
        VCodeMgr->>NonceMgr: consume(nonce) (guards age & single use)
        NonceMgr-->>VCodeMgr: nonce marked as used
        VCodeMgr-->>AuthSvc: {mobile, purpose}
        AuthSvc->>AccountSvc: exists(mobile)
        alt Account already exists
            AccountSvc-->>AuthSvc: accountId
        else First login for this mobile
            AuthSvc->>AccountSvc: createForMobile(mobile)
            AccountSvc-->>AuthSvc: accountId
        end
        AuthSvc->>SessionMgr: createSession({accountId})
        SessionMgr->>SessionStore: set(token, session, ttl 14 days)
        SessionStore-->>SessionMgr: ack
        SessionMgr-->>AuthSvc: token + session
        Note over AuthSvc,Client: HTTP response body returns identity/session, and an httpOnly pmate-session cookie carries the token.
    end

    rect rgb(242,242,242)
        Client->>AuthSvc: GET /session or POST /logout with cookie/Bearer token
        Note over Client,AuthSvc: requireSession middleware extracts pmate-session cookie or Bearer token before handlers run.
        AuthSvc->>SessionMgr: verifyL3Token(token)
        SessionMgr->>SessionStore: get(token)
        SessionStore-->>SessionMgr: session or null
        SessionMgr-->>AuthSvc: session payload
        alt GET /session
            AuthSvc-->>Client: return session.identity or 401 if missing
        else POST /logout
            AuthSvc->>SessionMgr: invalidateSession(token)
            SessionMgr->>SessionStore: delete(token)
            AuthSvc-->>Client: {success: true} + Clear-Cookie header
        end
    end
```

## Key Files

- `apps/service/src/entry/auth.server.ts` – wires the HTTP routes, including cookie handling.
- `apps/service/src/util/auth/VCodeManager.ts` – manages SMS verification codes (5-minute TTL) backed by `KVStore.vcodeStore`.
- `apps/service/src/util/auth/NonceManager.ts` – enforces IP rate limiting and one-time nonce consumption.
- `apps/service/src/util/auth/SessionManager.ts` – persists pmate-session tokens for 14 days in Redis (when available) via `KVStore.sessionStore`.
