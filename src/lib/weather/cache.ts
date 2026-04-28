// Offline cache for weather + AQI + last location.
// Uses localStorage with timestamps so the app works without internet.

import type { WeatherData, AqiData, GeoLocation } from "./api";

const PREFIX = "tb_cache_";
const LAST_LOC_KEY = "tb_last_location";

interface CachedEntry<T> {
  data: T;
  ts: number; // epoch ms
}

function key(kind: string, lat: number, lon: number) {
  return `${PREFIX}${kind}_${lat.toFixed(3)}_${lon.toFixed(3)}`;
}

function read<T>(k: string): CachedEntry<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as CachedEntry<T>) : null;
  } catch {
    return null;
  }
}

function write<T>(k: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(k, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    /* quota — ignore */
  }
}

export const weatherCache = {
  get: (lat: number, lon: number) => read<WeatherData>(key("weather", lat, lon)),
  set: (lat: number, lon: number, data: WeatherData) => write(key("weather", lat, lon), data),
};

export const aqiCache = {
  get: (lat: number, lon: number) => read<AqiData>(key("aqi", lat, lon)),
  set: (lat: number, lon: number, data: AqiData) => write(key("aqi", lat, lon), data),
};

export const lastLocation = {
  get(): GeoLocation | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(LAST_LOC_KEY);
      return raw ? (JSON.parse(raw) as GeoLocation) : null;
    } catch {
      return null;
    }
  },
  set(loc: GeoLocation) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LAST_LOC_KEY, JSON.stringify(loc));
    } catch {
      /* ignore */
    }
  },
};

export function formatAge(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
