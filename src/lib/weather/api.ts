// Weather + geocoding + AQI clients. All public APIs, no auth needed.

import { weatherCache, aqiCache } from "./cache";

export const WAQI_TOKEN = "4c77127f3c590c596756cab369e70a00ef3057a3";

export interface GeoLocation {
  name: string;
  state?: string;
  district?: string;
  latitude: number;
  longitude: number;
  displayName: string;
}

export interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    rain: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    uv_index: number;
    surface_pressure: number;
    visibility: number;
    time: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    precipitation_probability: number[];
    wind_speed_10m: number[];
    uv_index: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    uv_index_max: number[];
  };
  timezone: string;
}

export async function geocodeIndianPlace(query: string): Promise<GeoLocation[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&countrycodes=in&format=json&addressdetails=1&limit=6`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) throw new Error("Geocoding failed");
  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
    address?: { state?: string; state_district?: string; city?: string; town?: string; village?: string; county?: string };
    name?: string;
  }>;
  return data.map((d) => ({
    name: d.name || d.address?.city || d.address?.town || d.address?.village || d.display_name.split(",")[0],
    state: d.address?.state,
    district: d.address?.state_district || d.address?.county,
    latitude: parseFloat(d.lat),
    longitude: parseFloat(d.lon),
    displayName: d.display_name,
  }));
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeoLocation> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&addressdetails=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) throw new Error("Reverse geocoding failed");
  const d = (await res.json()) as {
    display_name: string;
    address?: { state?: string; state_district?: string; city?: string; town?: string; village?: string; county?: string };
    name?: string;
  };
  return {
    name:
      d.name ||
      d.address?.city ||
      d.address?.town ||
      d.address?.village ||
      d.display_name.split(",")[0],
    state: d.address?.state,
    district: d.address?.state_district || d.address?.county,
    latitude: lat,
    longitude: lon,
    displayName: d.display_name,
  };
}



export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,wind_speed_10m,wind_direction_10m,uv_index,surface_pressure,visibility",
    hourly:
      "temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m,uv_index",
    daily:
      "temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max",
    past_days: "7",
    forecast_days: "7",
    timezone: "Asia/Kolkata",
  });
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!res.ok) throw new Error("Weather fetch failed");
    const data = (await res.json()) as WeatherData;
    weatherCache.set(lat, lon, data);
    return data;
  } catch (err) {
    const cached = weatherCache.get(lat, lon);
    if (cached) return cached.data;
    throw err;
  }
}

export interface AqiData {
  aqi: number;
  category: string;
  dominantPollutant?: string;
  station?: string;
}

export async function fetchAqi(lat: number, lon: number): Promise<AqiData | null> {
  try {
    const res = await fetch(
      `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${WAQI_TOKEN}`
    );
    if (!res.ok) throw new Error("aqi http");
    const json = (await res.json()) as {
      status: string;
      data?: { aqi: number; dominentpol?: string; city?: { name?: string } };
    };
    if (json.status !== "ok" || !json.data) throw new Error("aqi status");
    const result: AqiData = {
      aqi: json.data.aqi,
      category: aqiCategory(json.data.aqi),
      dominantPollutant: json.data.dominentpol,
      station: json.data.city?.name,
    };
    aqiCache.set(lat, lon, result);
    return result;
  } catch {
    const cached = aqiCache.get(lat, lon);
    return cached ? cached.data : null;
  }
}

function aqiCategory(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy (Sensitive)";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}
