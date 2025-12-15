import express from "express";
import axios from "axios";
import open from "open";
import "dotenv/config";

const app = express();

const PORT = Number(process.env.PORT || 3000);
const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET in .env");
  process.exit(1);
}

const REDIRECT_URI = `http://localhost:${PORT}/exchange_token`;

// Choose scopes:
// - read: basic profile
// - activity:read_all: read all your activities (not only public ones)
const SCOPE = "read,activity:read_all";

app.get("/", (_req, res) => {
  const authUrl =
    `https://www.strava.com/oauth/authorize` +
    `?client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&approval_prompt=force` +
    `&scope=${encodeURIComponent(SCOPE)}`;

  res.send(
    `<h2>Strava OAuth</h2>
     <p>Opening Strava authorization…</p>
     <p>If it didn't open, click: <a href="${authUrl}">${authUrl}</a></p>`
  );

  // try to open automatically
  open(authUrl).catch(() => {});
});

app.get("/exchange_token", async (req, res) => {
  const { code, scope, error } = req.query;

  if (error) {
    res.status(400).send(`Authorization error: ${error}`);
    return;
  }

  if (!code) {
    res.status(400).send("Missing code query param.");
    return;
  }

  try {
    const tokenResp = await axios.post("https://www.strava.com/oauth/token", {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    });

    const data = tokenResp.data;

    // Print to terminal (keep private!)
    console.log("\n✅ Token exchange success");
    console.log("Granted scope:", scope);
    console.log("Access token:", data.access_token);
    console.log("Refresh token:", data.refresh_token);
    console.log("Expires at (unix):", data.expires_at);
    console.log("Athlete id:", data.athlete?.id);

    res.send(
      `<h2>✅ Authorized</h2>
       <p>Tokens printed to your terminal.</p>
       <p>You can close this tab.</p>`
    );
  } catch (e) {
    const msg = e?.response?.data ? JSON.stringify(e.response.data) : String(e);
    console.error("❌ Token exchange failed:", msg);
    res.status(500).send(`Token exchange failed: ${msg}`);
  }
});

app.listen(PORT, () => {
  console.log(`\nListening on http://localhost:${PORT}`);
  console.log("Go to this URL to start auth:");
  console.log(`http://localhost:${PORT}\n`);
});
