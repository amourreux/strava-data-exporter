import axios from "axios";
import { DateTime } from "luxon";
import fs from "fs";
import "dotenv/config";

const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error(
    "Missing STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET / STRAVA_REFRESH_TOKEN in .env"
  );
  process.exit(1);
}

async function refreshAccessToken() {
  const resp = await axios.post("https://www.strava.com/oauth/token", {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: REFRESH_TOKEN,
  });
  return resp.data.access_token;
}

async function fetchAllActivities(api, afterUnix, beforeUnix) {
  const perPage = 200;
  let page = 1;
  const all = [];

  while (true) {
    const resp = await api.get("/athlete/activities", {
      params: {
        after: afterUnix,
        before: beforeUnix,
        per_page: perPage,
        page,
      },
    });

    const chunk = resp.data;
    if (!Array.isArray(chunk) || chunk.length === 0) break;

    all.push(...chunk);

    if (chunk.length < perPage) break;
    page += 1;
  }

  return all;
}

async function main() {
  // Use your local timezone. If you want to hardcode: "Europe/Istanbul"
  const zone = "Europe/Istanbul";

  const start = DateTime.now().setZone(zone).startOf("day");
  const end = start.plus({ days: 1 });

  const afterUnix = Math.floor(start.toSeconds());
  const beforeUnix = Math.floor(end.toSeconds());

  const accessToken = await refreshAccessToken();
  const api = axios.create({
    baseURL: "https://www.strava.com/api/v3",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const activities = await fetchAllActivities(api, afterUnix, beforeUnix);

  const exportObj = {
    exported_at: DateTime.now().setZone(zone).toISO(),
    timezone: zone,
    day_start_local: start.toISO(),
    day_end_local: end.toISO(),
    after_unix: afterUnix,
    before_unix: beforeUnix,
    count: activities.length,
    activities,
  };

  const outPath = `strava-today-${start.toFormat("yyyy-LL-dd")}.json`;
  fs.writeFileSync(outPath, JSON.stringify(exportObj, null, 2), "utf8");

  console.log(`✅ Exported ${activities.length} activities to: ${outPath}`);
  if (activities.length > 0) {
    console.log("Activities today:");
    activities.forEach((a) => {
      const km = (a.distance ?? 0) / 1000;
      console.log(
        `- ${a.type} | ${a.name} | ${km.toFixed(2)} km | ${a.start_date_local}`
      );
    });
  }
}

main().catch((e) => {
  const msg = e?.response?.data ? JSON.stringify(e.response.data) : String(e);
  console.error("❌ Error:", msg);
  process.exit(1);
});
