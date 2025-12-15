# Strava API – Personal Analytics (Node.js)

This project connects to the **Strava API** using OAuth and allows me to:

- Authenticate locally via Strava
- Refresh access tokens automatically
- Fetch my **last 30 activities**
- Analyze the **most recent activity** (pace/speed, HR, elevation, etc.)

> ⚠️ This is a **local-only** setup. Secrets and tokens must never be committed.

---

## Requirements

- Node.js 18+ (ESM support)
- A Strava account
- A Strava API Application

---

## 1. Create Strava API App

Go to:
https://www.strava.com/settings/api

Create a new application with:

- **Category:** Personal
- **Website:** http://localhost
- **Authorization Callback Domain:** `localhost`

You will receive:

- Client ID
- Client Secret

---

## 2. Project Setup

```bash
npm init -y
npm install express axios open dotenv
```
