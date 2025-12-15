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
  const res = await axios.post("https://www.strava.com/oauth/token", {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: REFRESH_TOKEN,
  });
  return res.data.access_token;
}

async function fetchAllActivities(api, afterUnix, beforeUnix) {
  const perPage = 200;
  let page = 1;
  const all = [];

  while (true) {
    const res = await api.get("/athlete/activities", {
      params: { after: afterUnix, before: beforeUnix, per_page: perPage, page },
    });

    const chunk = res.data;
    if (!Array.isArray(chunk) || chunk.length === 0) break;

    all.push(...chunk);
    if (chunk.length < perPage) break;
    page += 1;
  }

  return all;
}

async function main() {
  const zone = "Europe/Istanbul";

  // default: current month
  const monthStart = DateTime.now().setZone(zone).startOf("month");
  const monthEnd = monthStart.plus({ months: 1 }); // exclusive end

  const afterUnix = Math.floor(monthStart.toSeconds());
  const beforeUnix = Math.floor(monthEnd.toSeconds());

  const accessToken = await refreshAccessToken();
  const api = axios.create({
    baseURL: "https://www.strava.com/api/v3",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const activities = await fetchAllActivities(api, afterUnix, beforeUnix);

  const exportObj = {
    exported_at: DateTime.now().setZone(zone).toISO(),
    timezone: zone,
    month_start_local: monthStart.toISO(),
    month_end_local_exclusive: monthEnd.toISO(),
    after_unix: afterUnix,
    before_unix: beforeUnix,
    count: activities.length,
    activities,
  };

  const outPath = `strava-month-${monthStart.toFormat("yyyy-LL")}.json`;
  fs.writeFileSync(outPath, JSON.stringify(exportObj, null, 2), "utf8");

  console.log(`✅ Exported ${activities.length} activities to: ${outPath}`);

  // Quick console summary
  const byType = {};
  let totalDistanceKm = 0;
  let totalMovingTimeMin = 0;

  for (const a of activities) {
    byType[a.type] = (byType[a.type] || 0) + 1;
    totalDistanceKm += (a.distance ?? 0) / 1000;
    totalMovingTimeMin += (a.moving_time ?? 0) / 60;
  }

  console.log("By type:", byType);
  console.log("Total distance (km):", totalDistanceKm.toFixed(1));
  console.log("Total moving time (h):", (totalMovingTimeMin / 60).toFixed(1));
}

main().catch((e) => {
  const msg = e?.response?.data ? JSON.stringify(e.response.data) : String(e);
  console.error("❌ Error:", msg);
  process.exit(1);
});
