Strava Data Exporter (Node.js)

Personal Strava data exporter for daily, weekly, and monthly activity exports.
Designed to generate clean JSON files that can be analyzed later (manually or with AI).

This project does not store data remotely.
All OAuth and data fetching happens locally.

⸻

What this does
• Connects to Strava via OAuth
• Exports activities as JSON:
• Today
• Last 7 days
• Current month
• Uses local time (Europe/Istanbul)
• Outputs analysis-friendly JSON files
• One-command export via npm

⸻

Requirements
• Node.js 18+
• A Strava account
• A Strava API Application

⸻

1. Create Strava API App

Go to:
https://www.strava.com/settings/api

Use the following settings:
• Category: Personal
• Website: http://localhost
• Authorization Callback Domain: localhost

You will receive:
• Client ID
• Client Secret

⸻

2. Setup

Install dependencies:

npm install

Create a .env file (do not commit this file):

STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REFRESH_TOKEN=
STRAVA_ACCESS_TOKEN=
PORT=3000

Notes:
• STRAVA_REFRESH_TOKEN is required
• STRAVA_ACCESS_TOKEN is optional (auto-refreshed)

⸻

3. OAuth (one-time setup)

Run the OAuth helper:

node index.js

Open in your browser:

http://localhost:3000

Authorize the app on Strava.
Copy the refresh token printed in the terminal into your .env file.

⸻

4. Export Data

Run all exports (recommended)

npm run strava:all

This generates:
• strava-today-YYYY-MM-DD.json
• strava-week-YYYY-MM-DD_to_YYYY-MM-DD.json
• strava-month-YYYY-MM.json

Run individually

npm run strava:today
npm run strava:weekly
npm run strava:monthly

⸻

Output
• JSON only
• No database
• No background jobs
• Files are gitignored by default

Designed to be:
• pasted into analysis tools
• summarized
• converted to reports (PDF, charts, etc.)

⸻

Project Structure

.
├── index.js # OAuth helper
├── export-today.js # Daily export
├── export-weekly.js # Weekly export
├── export-monthly.js # Monthly export
├── .env.example
├── .gitignore
├── package.json
└── README.md

⸻

Security Notes
• Never commit .env
• Never share client secret or tokens
• OAuth authorization codes are single-use
• Refresh tokens may rotate

⸻

Next Ideas
• Weekly / monthly summaries
• PDF reports
• Charts (pace, HR, power)
• Training load analysis

This repository intentionally stays simple, local, and transparent.
