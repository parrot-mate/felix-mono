# Auth API Test Cases

#### Test Case: test auth flow requires `/vcode` before `/login`

- Scenario: A test client obtains a nonce from `/vcode` and then logs in through `/login`.
- Preconditions: `TEST_AUTH_KEY` is configured and the mobile starts with `test_`.
- Steps:
  1. Call `POST /vcode` with `x-test`, `mobile`, and `purpose`.
  2. Read `nonce` and `issuedAt` from the response.
  3. Call `POST /login` with the same mobile, `nonce`, `issuedAt`, and fixed vcode `888888`.
- Expected Result: Login succeeds and creates a usable session token.

#### Test Case: direct test login without `/vcode` is rejected

- Scenario: A caller tries to log in with `x-test` and fixed vcode `888888` without a test-issued nonce.
- Preconditions: `TEST_AUTH_KEY` is configured.
- Steps:
  1. Call `POST /login` directly with a fake nonce.
- Expected Result: The request fails with unauthorized status.

#### Test Case: real mobiles cannot enter the test flow

- Scenario: A caller sends `x-test` with a non-`test_` mobile.
- Preconditions: `TEST_AUTH_KEY` is configured.
- Steps:
  1. Call `POST /vcode` with `x-test` and a real mobile.
  2. Call `POST /login` with `x-test` and a real mobile.
- Expected Result: Both requests are rejected.

#### Test Case: incorrect fixed test vcode is rejected

- Scenario: A valid test nonce is paired with an incorrect vcode.
- Preconditions: A valid test nonce has been issued.
- Steps:
  1. Call `POST /login` with the valid test nonce and a vcode other than `888888`.
- Expected Result: Login fails with an incorrect verification code error.
