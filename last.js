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

function paceFromSpeed(ms) {
  if (!ms || ms <= 0) return null;
  return 1000 / ms / 60; // min/km
}

function formatPace(minPerKm) {
  if (!minPerKm) return null;
  const totalSec = Math.round(minPerKm * 60);
  return `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(
    2,
    "0"
  )}/km`;
}

async function main() {
  const zone = "Europe/Istanbul";
  const token = await refreshAccessToken();

  const api = axios.create({
    baseURL: "https://www.strava.com/api/v3",
    headers: { Authorization: `Bearer ${token}` },
  });

  // 1️⃣ get last activity
  const activities = (
    await api.get("/athlete/activities", {
      params: { per_page: 1 },
    })
  ).data;

  if (!activities.length) {
    console.log("No activities found");
    return;
  }

  const a = activities[0];

  // 2️⃣ fetch full detail
  const full = (await api.get(`/activities/${a.id}`)).data;

  const distanceKm = (full.distance ?? 0) / 1000;
  const movingMin = (full.moving_time ?? 0) / 60;

  const isRun = full.type === "Run";
  const isRide = full.type.includes("Ride");

  const avgPace =
    isRun && full.average_speed
      ? formatPace(paceFromSpeed(full.average_speed))
      : null;

  const avgSpeed =
    isRide && full.average_speed ? (full.average_speed * 3.6).toFixed(1) : null;

  const analysis = {
    exported_at: DateTime.now().setZone(zone).toISO(),
    activity: {
      id: full.id,
      name: full.name,
      type: full.type,
      sport_type: full.sport_type,
      start_local: full.start_date_local,
    },
    summary: {
      distance_km: Number(distanceKm.toFixed(2)),
      moving_time_min: Math.round(movingMin),
      elevation_gain_m: Math.round(full.total_elevation_gain ?? 0),
      avg_hr: full.average_heartrate ?? null,
      max_hr: full.max_heartrate ?? null,
      avg_cadence: full.average_cadence ?? null,
      avg_watts: full.average_watts ?? null,
      suffer_score: full.suffer_score ?? null,
    },
    performance: {
      avg_pace: avgPace, // run
      avg_speed_kmh: avgSpeed, // ride
    },
    interpretation: {
      intensity_hint:
        full.suffer_score == null
          ? "unknown"
          : full.suffer_score < 30
          ? "easy / recovery"
          : full.suffer_score < 60
          ? "moderate"
          : "hard",
    },
  };

  fs.writeFileSync(
    "strava-last.json",
    JSON.stringify(analysis, null, 2),
    "utf8"
  );

  console.log("✅ Exported analyzed last activity → strava-last.json");
}

main().catch((e) => {
  console.error(e.response?.data || e.message);
  process.exit(1);
});
