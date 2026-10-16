# NorthGate Admin (DemoShop client)

A demo internal admin portal used to showcase **SentinelType** integrated as a third-party security layer — the way a real application would consume it over an API.

This app is intentionally simple: it manages its own usernames/passwords, and on every login it calls out to SentinelType to verify the user's typing behavior before granting access. The two systems are independent — NorthGate never sees SentinelType's internals, and SentinelType never touches NorthGate's password store.

> This is a fictional internal system built only to demonstrate the integration. It is not a real product and has no connection to any real company or banking/admin system.

---

## What it shows

```
User submits username + password + typed phrase
        ↓
NorthGate verifies the password itself (bcrypt/hash check)
        ↓
NorthGate sends the captured keystroke timing data to SentinelType's API
        ↓
SentinelType returns a behavioral match score + risk level
        ↓
NorthGate decides: grant access / show error
```

- **Registration** — create a local account (password hashed, stored only in NorthGate's own DB).
- **Enrollment** — type a fixed phrase 5 times; the captured keystroke timings are sent to SentinelType's `/api/enroll-behavior` endpoint to build a behavioral baseline.
- **Login** — password is checked locally; the same phrase is typed again and sent to SentinelType's `/api/verify-behavior` endpoint, which returns whether this attempt matches the enrolled behavior.
- **Admin console** — a mock internal dashboard (access log, pending approvals, system status) shown only after both password and behavioral checks pass.

## Tech stack

| Layer | Technology |
|---|---|
| Server | Node.js, Express |
| Views | EJS |
| Styling | Plain CSS (no framework) |
| Auth | Local sessions, hashed passwords |
| Security layer | SentinelType REST API (separate service) |

## Project structure

```
demo-shop/
├── server.js              # Express app, routes (/register, /login, /logout, /api/enroll-behavior)
├── views/
│   ├── register.ejs
│   ├── login.ejs
│   ├── enroll.ejs
│   └── dashboard.ejs
├── public/
│   └── style.css
├── .env
└── package.json
```

## Running locally

Requires SentinelType running first (see its own README) since this app depends on it.

```bash
npm install
cp .env.example .env        # set SENTINELTYPE_API_URL and SESSION_SECRET
node server.js
```

Open `http://localhost:4000`.

## Flow to try

1. Go to `/register`, create an account.
2. You'll be sent to `/enroll` — type the shown phrase naturally, 5 times, to build your behavioral profile.
3. Log out, then log in again at `/login` using the same password and typing the phrase the same way → access granted.
4. Try logging in with the correct password but typed very differently (much faster/slower, different rhythm) to see the behavioral check catch the mismatch.

## Why a separate client app

Keeping NorthGate and SentinelType as two independent codebases/services mirrors how this would work in practice: SentinelType is a pluggable security layer that any application could call over an API, rather than being baked into one app's codebase. It also makes the demo honest — NorthGate genuinely doesn't know anything about keystroke dynamics or ML, it just forwards timing data and trusts the response.

## Limitations

- This is a demo/prototype, not a production authentication system.
- All "admin console" data (access log, approval counts) is static/mocked for demonstration — it is not a real audit system.
- Session handling is intentionally simple; a production system would need CSRF protection, rate limiting, and stronger session management.

## Related

- [SentinelType](https://github.com/gufrancse/sentinel-type) — the behavioral biometric authentication service this app integrates with.