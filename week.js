import axios from "axios";
import { DateTime } from "luxon";
import fs from "fs";
import "dotenv/config";

const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error("Missing STRAVA env variables");
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

async function fetchAll(api, after, before) {
  let page = 1;
  const perPage = 200;
  const all = [];

  while (true) {
    const res = await api.get("/athlete/activities", {
      params: { after, before, page, per_page: perPage },
    });

    if (!res.data.length) break;
    all.push(...res.data);

    if (res.data.length < perPage) break;
    page++;
  }

  return all;
}

async function main() {
  const zone = "Europe/Istanbul";
  const end = DateTime.now().setZone(zone).endOf("day");
  const start = end.minus({ days: 6 }).startOf("day"); // 7-day window

  const after = Math.floor(start.toSeconds());
  const before = Math.floor(end.toSeconds());

  const token = await refreshAccessToken();
  const api = axios.create({
    baseURL: "https://www.strava.com/api/v3",
    headers: { Authorization: `Bearer ${token}` },
  });

  const activities = await fetchAll(api, after, before);

  const output = {
    exported_at: DateTime.now().setZone(zone).toISO(),
    timezone: zone,
    week_start_local: start.toISO(),
    week_end_local: end.toISO(),
    after_unix: after,
    before_unix: before,
    count: activities.length,
    activities,
  };

  const filename = `strava-week-${start.toFormat(
    "yyyy-LL-dd"
  )}_to_${end.toFormat("yyyy-LL-dd")}.json`;
  fs.writeFileSync(filename, JSON.stringify(output, null, 2));

  console.log(`✅ Weekly export created: ${filename}`);
  console.log(`Activities found: ${activities.length}`);

  const byType = {};
  activities.forEach((a) => {
    byType[a.type] = (byType[a.type] || 0) + 1;
  });

  console.log("Summary by type:", byType);
}

main().catch((e) => {
  console.error(e.response?.data || e.message);
  process.exit(1);
});
