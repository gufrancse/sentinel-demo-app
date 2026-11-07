# SentinelType Demo App

### NorthGate Admin — API Integration Demonstration

A lightweight web application demonstrating how **SentinelType's Behavioural Biometric Authentication API** can be integrated into an existing application.

NorthGate Admin acts as a sample client application that delegates behavioural verification to SentinelType through REST API requests.

The purpose of this project is to demonstrate how an independent application can add behavioural biometric verification to its existing password-based authentication workflow without implementing the machine-learning logic itself.

> **This is an integration demo, not a standalone authentication product.** SentinelType handles behavioural analysis, while NorthGate Admin handles its own user credentials and application-side access decisions.

---

## Overview

Traditional applications generally authenticate users using their own credentials.

SentinelType provides an additional behavioural verification layer that an application can consume through an API.

This demo demonstrates that integration using two independent applications:

| Application | Responsibility |
|---|---|
| NorthGate Admin | User registration, password verification, session handling, and application access |
| SentinelType | Behavioural enrollment, typing-pattern analysis, and authentication risk decision |

NorthGate does not implement or access SentinelType's internal machine-learning model. It simply sends behavioural data to the API and processes the response.

---

## Authentication Workflow

The integration follows this workflow:

```text
             USER
               |
               v
       NorthGate Admin
               |
               v
       User Registration
               |
               v
      Password Authentication
               |
               v
      Capture Typing Behaviour
               |
               v
      NorthGate API Request
               |
               v
        SentinelType API
               |
               v
      Behavioural Verification
               |
               v
       Risk Decision Response
               |
          +----+----+
          |         |
          v         v
        Allowed   Rejected
          |         |
          v         v
      Dashboard   Login Error
```

### Step-by-Step Process

**1. User Registration**

The user creates an account in NorthGate Admin using a username and password.

The password is hashed using bcrypt before being stored in the application's in-memory user store.

**2. Behavioural Enrollment**

After registration, the user is redirected to the behavioural enrollment page.

The user types the predefined challenge phrase:

`Secure#Demo92!App`

The application collects five typing samples and extracts behavioural timing features.

These samples are submitted to SentinelType through its enrollment API.

**3. Password Verification**

During login, NorthGate Admin independently verifies the username and password using bcrypt.

SentinelType never receives or verifies the NorthGate password.

**4. Behavioural Verification**

After successful password verification, NorthGate captures a new typing sample and sends it to SentinelType for behavioural analysis.

**5. API Response**

SentinelType evaluates the submitted sample and returns a response containing the authentication decision, match score, and available explanation details.

**6. Access Decision**

NorthGate processes the API response:

- If the decision is `allowed`, the application creates a session and redirects the user to the dashboard.
- If behavioural verification is not accepted, the application displays the returned decision and available reasons.

---

## SentinelType API Integration

NorthGate communicates with SentinelType through HTTP REST API requests using Axios.

### 1. Behavioural Enrollment

**SentinelType endpoint:**

```http
POST /api/v1/enroll
```

NorthGate sends the username and collected behavioural samples.

Example request structure:

```json
{
  "username": "admin",
  "samples": [
    {
      "averageDwellTime": 85.4,
      "averageFlightTime": 110.2,
      "typingDuration": 2400,
      "typingSpeedWPM": 30,
      "averageMouseSpeed": 0,
      "averageClickInterval": 0
    }
  ]
}
```

The actual enrollment request contains the collected sample set.

### 2. Behavioural Verification

**SentinelType endpoint:**

```http
POST /api/v1/verify
```

NorthGate submits the username and newly captured behavioural sample.

Example request structure:

```json
{
  "username": "admin",
  "behavioralSample": {
    "averageDwellTime": 85.4,
    "averageFlightTime": 110.2,
    "typingDuration": 2400,
    "typingSpeedWPM": 30,
    "averageMouseSpeed": 0,
    "averageClickInterval": 0
  }
}
```

The response is processed by NorthGate to determine whether application access should be granted.

### API Authentication

Requests include the SentinelType API key in the request header:

```http
X-Sentinel-Api-Key: YOUR_API_KEY
```

The API URL and API key are configured through environment variables.

---

## Technology Stack

| Component | Technology |
|---|---|
| Runtime | Node.js |
| Backend Framework | Express.js |
| Template Engine | EJS |
| Frontend | HTML, CSS, JavaScript |
| HTTP Client | Axios |
| Password Hashing | bcrypt |
| Session Management | express-session |
| Environment Configuration | dotenv |
| Security Integration | SentinelType REST API |

---

## Project Structure

```text
sentinel-demo-app/
│
├── views/
│   ├── dashboard.ejs
│   ├── enroll.ejs
│   ├── login.ejs
│   └── register.ejs
│
├── public/
│   └── style.css
│
├── server.js
├── package.json
├── package-lock.json
├── .env
├── .gitignore
└── README.md
```

### Important Files

| File | Purpose |
|---|---|
| `server.js` | Express server, registration, login, session handling, and SentinelType API communication |
| `views/register.ejs` | User registration interface |
| `views/login.ejs` | Password and behavioural verification interface |
| `views/enroll.ejs` | Collection of behavioural enrollment samples |
| `views/dashboard.ejs` | NorthGate Admin demonstration dashboard |
| `public/style.css` | Application styling |
| `package.json` | Project dependencies and configuration |
| `.env` | Local environment configuration; not committed to GitHub |

---

## Run Locally

### Prerequisites

- Node.js
- npm
- Git
- SentinelType backend running and accessible

### 1. Clone the Repository

```bash
git clone https://github.com/gufrancse/sentinel-demo-app.git

cd sentinel-demo-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root.

Add the following configuration:

```env
SENTINEL_API_URL=http://127.0.0.1:5000
SENTINEL_API_KEY=your_sentinel_api_key
SESSION_SECRET=your_session_secret
```

Use the actual environment variable names expected by `server.js`:

- `SENTINEL_API_URL`
- `SENTINEL_API_KEY`

**Note:** `SESSION_SECRET` is a recommended configuration for a future secure session setup; the current server code still uses a hardcoded session secret.

Make sure the SentinelType API URL and API key match your running backend configuration.

Never commit the actual `.env` file or API credentials.

### 4. Start NorthGate Admin

```bash
node server.js
```

The application runs at:

```text
http://localhost:4000
```

Make sure SentinelType is running before testing the integration.

---

## How to Test the Integration

1. Start the SentinelType Flask backend.
2. Start the NorthGate Admin application.
3. Open `http://localhost:4000`.
4. Navigate to the registration page.
5. Create a new demo account.
6. Complete the behavioural enrollment by typing the challenge phrase five times.
7. Return to the login page.
8. Enter the registered username and password.
9. Type the same challenge phrase to generate a new behavioural sample.
10. Observe the response returned by SentinelType.
11. If the API returns `allowed`, NorthGate redirects to its dashboard. Otherwise, the login page displays the verification result.

---

## Demo Scope and Limitations

This project is intentionally lightweight and focuses on demonstrating API integration.

- User information is currently stored in an in-memory JavaScript object and is not persistent across server restarts.
- The dashboard contains demonstration data and is not a real administrative audit system.
- Session management is simplified for demonstration purposes.
- The application is not designed as a production-ready authentication platform.
- SentinelType must be running and accessible for behavioural enrollment and verification.
- The application depends on the API response to make its behavioural access decision.

---

## Relationship with SentinelType

This repository is a separate client application for demonstrating SentinelType integration.

**Main Project:** [SentinelType — Behavioural Biometric Authentication System](https://github.com/gufrancse/sentinel-type)

SentinelType performs the behavioural analysis and returns an authentication decision through its REST API.

NorthGate Admin demonstrates how an existing web application can consume that decision without directly implementing the underlying machine-learning system.

---

## Author

**Gufran Ahmad**  
B.Tech — Computer Science and Engineering  
ITS Engineering College, Greater Noida

GitHub: [@gufrancse](https://github.com/gufrancse)

---

*NorthGate Admin — A lightweight API integration demonstration for SentinelType Behavioural Biometric Authentication.*