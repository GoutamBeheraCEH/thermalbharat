import { motion } from "framer-motion";
import { format } from "date-fns";
import { Wind, Droplet, Sun, Eye, CloudRain, Gauge, Sunrise, Sunset, Thermometer } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, CartesianGrid, Cell,
} from "recharts";
import type { WeatherData, AqiData } from "@/lib/weather/api";
import {
  getHeatSeverityBadge,
  getBackgroundGradientClass,
  humidityLabel,
  uvLabel,
  windDirectionLabel,
  getHeatAdvisory,
  getHeatContextExplanation,
  getHydrationGuide,
  type ActivityLevel,
} from "@/lib/weather/logic";
import { useMemo, useState } from "react";

// ============== HERO ==============
export function HeroHeatCard({
  weather, aqi, locationName, state, district,
}: {
  weather: WeatherData;
  aqi: AqiData | null;
  locationName: string;
  state?: string;
  district?: string;
}) {
  const c = weather.current;
  const badge = getHeatSeverityBadge(c.apparent_temperature);
  const gradient = getBackgroundGradientClass(c.temperature_2m);
  const updated = format(new Date(c.time), "EEE, d MMM • HH:mm 'IST'");

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      className={`${gradient} border-2 border-ink shadow-brutal-lg p-6 md:p-10 relative overflow-hidden`}
    >
      <div className="absolute top-3 right-3 text-[10px] uppercase tracking-[0.18em] text-ink/60 font-mono">
        Live • {updated}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink/70 mb-1">You're viewing</div>
          <h1 className="font-display font-black text-3xl md:text-5xl text-ink leading-none">{locationName}</h1>
          <div className="text-sm mt-1 text-ink/70">
            {[district, state].filter(Boolean).join(" • ")}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 ${badge.bgClass} ${badge.textClass} border-2 border-ink shadow-brutal-sm font-display font-bold uppercase text-xs tracking-wider`}>
            {badge.label}
          </span>
          {aqi && (
            <span className="px-3 py-1 bg-card border-2 border-ink shadow-brutal-sm font-mono text-xs">
              AQI {aqi.aqi} • {aqi.category}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-end gap-6 flex-wrap">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="font-display font-black text-[8rem] md:text-[12rem] leading-[0.8] text-ink tabular-nums"
        >
          {Math.round(c.temperature_2m)}°
        </motion.div>
        <div className="pb-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink/70">Feels like</div>
          <div className="font-display font-bold text-4xl md:text-5xl text-ink">
            {Math.round(c.apparent_temperature)}°<span className="text-2xl">C</span>
          </div>
          <div className="text-sm text-ink/70 mt-1">
            {humidityLabel(c.relative_humidity_2m)} • {windDirectionLabel(c.wind_direction_10m)} {Math.round(c.wind_speed_10m)} km/h
          </div>
        </div>
      </div>
    </motion.section>
  );
}

// ============== TODAY GRID ==============
export function TodayGrid({ weather }: { weather: WeatherData }) {
  const c = weather.current;
  const d = weather.daily;
  const today = 7; // past_days=7, so index 7 is today
  const stats = [
    { icon: Thermometer, label: "Max / Min", value: `${Math.round(d.temperature_2m_max[today])}° / ${Math.round(d.temperature_2m_min[today])}°` },
    { icon: Droplet, label: "Humidity", value: `${c.relative_humidity_2m}%`, sub: humidityLabel(c.relative_humidity_2m) },
    { icon: Wind, label: "Wind", value: `${Math.round(c.wind_speed_10m)} km/h`, sub: windDirectionLabel(c.wind_direction_10m) },
    { icon: CloudRain, label: "Rainfall", value: `${d.precipitation_sum[today].toFixed(1)} mm`, sub: `${d.precipitation_probability_max[today]}% chance` },
    { icon: Eye, label: "Visibility", value: `${(c.visibility / 1000).toFixed(1)} km` },
    { icon: Sun, label: "UV Index", value: `${Math.round(c.uv_index)}`, sub: uvLabel(c.uv_index) },
    { icon: Gauge, label: "Pressure", value: `${Math.round(c.surface_pressure)} hPa` },
    { icon: Droplet, label: "Dew Point", value: `${Math.round(estimateDewPoint(c.temperature_2m, c.relative_humidity_2m))}°C` },
  ];
  return (
    <section>
      <SectionTitle eyebrow="Right now" title="Today's atmosphere" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border-2 border-ink shadow-brutal-sm p-4"
          >
            <s.icon className="w-4 h-4 text-primary mb-2" />
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{s.label}</div>
            <div className="font-display font-bold text-2xl tabular-nums">{s.value}</div>
            {s.sub && <div className="text-xs text-muted-foreground">{s.sub}</div>}
          </motion.div>
        ))}
      </div>

      {/* Sun arc */}
      <div className="mt-3 bg-card border-2 border-ink shadow-brutal-sm p-4">
        <SunArc sunrise={d.sunrise[today]} sunset={d.sunset[today]} />
      </div>
    </section>
  );
}

function estimateDewPoint(t: number, rh: number): number {
  const a = 17.27, b = 237.7;
  const alpha = (a * t) / (b + t) + Math.log(rh / 100);
  return (b * alpha) / (a - alpha);
}

function SunArc({ sunrise, sunset }: { sunrise: string; sunset: string }) {
  const now = new Date();
  const sr = new Date(sunrise);
  const ss = new Date(sunset);
  const total = ss.getTime() - sr.getTime();
  const elapsed = Math.max(0, Math.min(total, now.getTime() - sr.getTime()));
  const t = total > 0 ? elapsed / total : 0;
  // arc point
  const x = 20 + t * 260;
  const y = 70 - Math.sin(t * Math.PI) * 50;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="flex items-center gap-1"><Sunrise className="w-4 h-4 text-accent" /> {format(sr, "HH:mm")}</span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Sun's path</span>
        <span className="flex items-center gap-1">{format(ss, "HH:mm")} <Sunset className="w-4 h-4 text-primary" /></span>
      </div>
      <svg viewBox="0 0 300 80" className="w-full h-20">
        <path d="M 20 70 Q 150 -10 280 70" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" fill="none" className="text-ink/30" />
        <line x1="20" y1="70" x2="280" y2="70" stroke="currentColor" strokeWidth="2" className="text-ink" />
        <circle cx={x} cy={y} r="8" className="fill-accent stroke-ink" strokeWidth="2" />
      </svg>
    </div>
  );
}

// ============== HOURLY ==============
export function HourlyStrip({ weather }: { weather: WeatherData }) {
  const now = new Date();
  const startIdx = weather.hourly.time.findIndex((t) => new Date(t) >= now);
  const slice = Array.from({ length: 24 }, (_, i) => startIdx + i).filter((i) => i < weather.hourly.time.length);
  return (
    <section>
      <SectionTitle eyebrow="Next 24 hours" title="Hourly forecast" />
      <div className="border-2 border-ink shadow-brutal-sm bg-card overflow-x-auto">
        <div className="flex min-w-max">
          {slice.map((i) => {
            const time = new Date(weather.hourly.time[i]);
            const hr = time.getHours();
            const peak = hr >= 12 && hr <= 16;
            const t = weather.hourly.temperature_2m[i];
            return (
              <div
                key={i}
                className={`flex flex-col items-center gap-1 px-4 py-3 border-r border-ink/15 min-w-[72px] ${peak ? "bg-destructive/10" : ""}`}
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{format(time, "HH:mm")}</div>
                <div className="font-display font-bold text-xl tabular-nums">{Math.round(t)}°</div>
                <div className="text-[10px] text-muted-foreground">{weather.hourly.precipitation_probability[i]}%</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Wind className="w-3 h-3" />{Math.round(weather.hourly.wind_speed_10m[i])}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-2 flex items-center gap-2">
        <span className="inline-block w-3 h-3 bg-destructive/30 border border-ink" /> Peak heat hours (12 PM – 4 PM)
      </div>
    </section>
  );
}

// ============== HISTORY CHART ==============
type Metric = "temp" | "humidity" | "rain" | "wind";
export function HistoryChart({ weather }: { weather: WeatherData }) {
  const [metric, setMetric] = useState<Metric>("temp");
  const data = useMemo(() => {
    const days = weather.daily.time.slice(0, 8); // past 7 days + today
    return days.map((d, i) => ({
      day: format(new Date(d), "EEE d"),
      max: weather.daily.temperature_2m_max[i],
      min: weather.daily.temperature_2m_min[i],
      avg: (weather.daily.temperature_2m_max[i] + weather.daily.temperature_2m_min[i]) / 2,
      rain: weather.daily.precipitation_sum[i],
      wind: weather.daily.wind_speed_10m_max[i],
      uv: weather.daily.uv_index_max[i],
    }));
  }, [weather]);

  // Calculate avg humidity per day from hourly
  const dailyHum = useMemo(() => {
    const map = new Map<string, number[]>();
    weather.hourly.time.forEach((t, i) => {
      const k = t.slice(0, 10);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(weather.hourly.relative_humidity_2m[i]);
    });
    return weather.daily.time.slice(0, 8).map((d) => {
      const arr = map.get(d.slice(0, 10)) || [];
      return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    });
  }, [weather]);

  const today = data[7];
  const yesterday = data[6];
  const delta = today && yesterday ? today.avg - yesterday.avg : 0;

  const tabs: { key: Metric; label: string }[] = [
    { key: "temp", label: "Temperature" },
    { key: "humidity", label: "Humidity" },
    { key: "rain", label: "Rainfall" },
    { key: "wind", label: "Wind" },
  ];

  return (
    <section>
      <SectionTitle eyebrow="Past 7 days + today" title="Weather history" />
      <div className="bg-card border-2 border-ink shadow-brutal-sm p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setMetric(t.key)}
              className={`px-3 py-1 border-2 border-ink text-xs uppercase tracking-wider font-medium ${metric === t.key ? "bg-ink text-parchment shadow-brutal-sm" : "bg-card hover:bg-accent/30"}`}
            >
              {t.label}
            </button>
          ))}
          {metric === "temp" && (
            <div className="ml-auto text-xs px-3 py-1 bg-accent/30 border border-ink">
              Today is{" "}
              <strong className="font-mono">
                {delta >= 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}°C
              </strong>{" "}
              {delta >= 0 ? "hotter" : "cooler"} than yesterday
            </div>
          )}
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            {metric === "temp" ? (
              <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="day" stroke="currentColor" fontSize={11} tickLine={false} />
                <YAxis stroke="currentColor" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="max" fill="oklch(0.55 0.17 35)" name="Max °C" maxBarSize={28}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={i === 7 ? "oklch(0.5 0.22 25)" : "oklch(0.55 0.17 35)"} />
                  ))}
                </Bar>
                <Bar dataKey="min" fill="oklch(0.78 0.06 220)" name="Min °C" maxBarSize={28} />
                <Line type="monotone" dataKey="avg" stroke="oklch(0.18 0.02 40)" strokeWidth={2} dot={{ r: 3 }} name="Avg °C" />
              </ComposedChart>
            ) : metric === "humidity" ? (
              <LineChart data={data.map((d, i) => ({ ...d, hum: Math.round(dailyHum[i]) }))} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="day" stroke="currentColor" fontSize={11} tickLine={false} />
                <YAxis stroke="currentColor" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="hum" stroke="oklch(0.6 0.13 220)" strokeWidth={2} dot={{ r: 3 }} name="Humidity %" />
              </LineChart>
            ) : metric === "rain" ? (
              <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="day" stroke="currentColor" fontSize={11} tickLine={false} />
                <YAxis stroke="currentColor" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="rain" fill="oklch(0.6 0.13 220)" name="Rainfall mm" />
              </BarChart>
            ) : (
              <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="day" stroke="currentColor" fontSize={11} tickLine={false} />
                <YAxis stroke="currentColor" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="wind" stroke="oklch(0.55 0.17 35)" strokeWidth={2} dot={{ r: 3 }} name="Max wind km/h" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

const tooltipStyle = {
  background: "oklch(0.99 0.01 85)",
  border: "2px solid oklch(0.18 0.02 40)",
  borderRadius: 0,
  fontFamily: "DM Mono, monospace",
  fontSize: 12,
};

// ============== WHY HOT ==============
export function WhyHotCard({
  city, state, tempC,
}: { city: string; state?: string; tempC: number }) {
  const explanation = getHeatContextExplanation(city, state, new Date().getMonth(), tempC);
  return (
    <section className="bg-amber-deep text-primary-foreground border-2 border-ink shadow-brutal p-6 md:p-8">
      <div className="text-[10px] uppercase tracking-[0.2em] opacity-80 mb-2">🔥 Climate context</div>
      <h2 className="font-display font-black text-2xl md:text-3xl mb-3">Why is it so hot here?</h2>
      <p className="text-base md:text-lg leading-relaxed font-display italic">{explanation}</p>
    </section>
  );
}

// ============== ADVISORY ==============
export function AdvisoryCard({ weather }: { weather: WeatherData }) {
  const { dos, donts, headline } = getHeatAdvisory(
    weather.current.temperature_2m,
    weather.current.relative_humidity_2m,
    weather.current.uv_index
  );
  return (
    <section>
      <SectionTitle eyebrow="Stay safe" title="What to do & what to avoid" />
      <div className="bg-card border-2 border-ink shadow-brutal p-5 mb-3">
        <div className="font-display font-bold text-lg">{headline}</div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="bg-success/10 border-2 border-ink shadow-brutal-sm p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-success mb-3">✅ Do this</div>
          <ul className="space-y-2 text-sm">
            {dos.map((d) => (
              <li key={d} className="flex gap-2"><span className="text-success font-bold">✓</span>{d}</li>
            ))}
          </ul>
        </div>
        <div className="bg-destructive/10 border-2 border-ink shadow-brutal-sm p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-destructive mb-3">❌ Avoid this</div>
          <ul className="space-y-2 text-sm">
            {donts.map((d) => (
              <li key={d} className="flex gap-2"><span className="text-destructive font-bold">✗</span>{d}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ============== HYDRATION ==============
export function HydrationPanel({ weather }: { weather: WeatherData }) {
  const [activity, setActivity] = useState<ActivityLevel>("walking");
  const [reminders, setReminders] = useState(false);
  const guide = getHydrationGuide(weather.current.temperature_2m, weather.current.relative_humidity_2m, activity);

  function toggleReminders() {
    if (!reminders && typeof Notification !== "undefined") {
      Notification.requestPermission().then((p) => setReminders(p === "granted"));
    } else {
      setReminders(false);
    }
  }

  const acts: { k: ActivityLevel; l: string }[] = [
    { k: "resting", l: "Resting" },
    { k: "walking", l: "Walking" },
    { k: "working", l: "Outdoors work" },
    { k: "exercising", l: "Exercising" },
  ];

  return (
    <section>
      <SectionTitle eyebrow="Hydration intelligence" title="How much water you need" />
      <div className="bg-card border-2 border-ink shadow-brutal p-5">
        <div className="flex flex-wrap gap-2 mb-4">
          {acts.map((a) => (
            <button
              key={a.k}
              onClick={() => setActivity(a.k)}
              className={`px-3 py-1 border-2 border-ink text-xs uppercase tracking-wider ${activity === a.k ? "bg-primary text-primary-foreground shadow-brutal-sm" : "bg-card hover:bg-accent/30"}`}
            >
              {a.l}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-cool/30 border-2 border-ink p-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Per hour</div>
            <div className="font-display font-black text-4xl">{guide.mlPerHour} <span className="text-xl">ml</span></div>
            <div className="text-xs text-muted-foreground mt-1">≈ {Math.round(guide.mlPerHour / 250)} glasses</div>
          </div>
          <div className="bg-accent/30 border-2 border-ink p-4">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Across waking hours (~14h)</div>
            <div className="font-display font-black text-4xl">{guide.totalLitres}<span className="text-xl">L</span></div>
            <div className="text-xs text-muted-foreground mt-1">Spread evenly, don't chug</div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Best fluids</div>
            <ul className="space-y-1 text-sm">
              {guide.fluids.map((f) => (
                <li key={f.name}><strong>{f.name}</strong> — <span className="text-muted-foreground">{f.note}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Watch for</div>
            <ul className="space-y-1 text-sm">
              {guide.warnings.map((w) => (
                <li key={w} className="flex gap-2"><span className="text-destructive">⚠</span>{w}</li>
              ))}
            </ul>
            <button onClick={toggleReminders} className={`mt-3 px-3 py-2 border-2 border-ink text-xs uppercase tracking-wider ${reminders ? "bg-primary text-primary-foreground" : "bg-card"}`}>
              {reminders ? "Reminders on" : "Enable hourly reminder"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============== 7 DAY STRIP ==============
export function ForecastStrip({ weather }: { weather: WeatherData }) {
  const days = weather.daily.time.slice(7, 14); // today + 6 future
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section>
      <SectionTitle eyebrow="Next week" title="7-day forecast" />
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          const idx = 7 + i;
          const max = weather.daily.temperature_2m_max[idx];
          const min = weather.daily.temperature_2m_min[idx];
          const rain = weather.daily.precipitation_probability_max[idx];
          const isToday = i === 0;
          return (
            <button
              key={d}
              onClick={() => setOpen(open === i ? null : i)}
              className={`border-2 border-ink shadow-brutal-sm p-2 md:p-3 text-center hover:shadow-brutal transition-shadow ${isToday ? "bg-primary text-primary-foreground" : "bg-card"}`}
            >
              <div className="text-[10px] uppercase tracking-wider opacity-80">{isToday ? "Today" : format(new Date(d), "EEE")}</div>
              <div className="font-display font-black text-lg md:text-2xl tabular-nums mt-1">{Math.round(max)}°</div>
              <div className="text-[10px] tabular-nums opacity-80">{Math.round(min)}°</div>
              <div className="text-[10px] mt-1 flex items-center justify-center gap-1">
                <CloudRain className="w-3 h-3" />{rain}%
              </div>
            </button>
          );
        })}
      </div>
      {open !== null && (
        <div className="mt-3 bg-card border-2 border-ink shadow-brutal-sm p-4 text-sm">
          <div className="font-display font-bold text-lg mb-2">
            {format(new Date(days[open]), "EEEE, d MMM")}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <Stat label="Max temp" value={`${Math.round(weather.daily.temperature_2m_max[7 + open])}°C`} />
            <Stat label="Min temp" value={`${Math.round(weather.daily.temperature_2m_min[7 + open])}°C`} />
            <Stat label="Rain total" value={`${weather.daily.precipitation_sum[7 + open].toFixed(1)} mm`} />
            <Stat label="Max wind" value={`${Math.round(weather.daily.wind_speed_10m_max[7 + open])} km/h`} />
            <Stat label="Sunrise" value={format(new Date(weather.daily.sunrise[7 + open]), "HH:mm")} />
            <Stat label="Sunset" value={format(new Date(weather.daily.sunset[7 + open]), "HH:mm")} />
            <Stat label="Max UV" value={`${Math.round(weather.daily.uv_index_max[7 + open])}`} />
            <Stat label="Rain prob." value={`${weather.daily.precipitation_probability_max[7 + open]}%`} />
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="font-display font-bold text-lg tabular-nums">{value}</div>
    </div>
  );
}

// ============== HEAT INDEX EXPLAINER ==============
export function HeatIndexScale({ feelsLike }: { feelsLike: number }) {
  const min = 27, max = 54;
  const t = Math.max(0, Math.min(1, (feelsLike - min) / (max - min)));
  const left = `${t * 100}%`;
  const zones = [
    { label: "Caution", from: 27, to: 32, bg: "bg-accent/40" },
    { label: "Extreme Caution", from: 32, to: 41, bg: "bg-accent" },
    { label: "Danger", from: 41, to: 54, bg: "bg-primary" },
    { label: "Extreme Danger", from: 54, to: 60, bg: "bg-destructive" },
  ];
  return (
    <section>
      <SectionTitle eyebrow="Heat index" title="What does it feel like?" />
      <div className="bg-card border-2 border-ink shadow-brutal-sm p-5">
        <div className="relative h-10 border-2 border-ink flex">
          {zones.map((z) => (
            <div key={z.label} className={`${z.bg} flex-1 flex items-center justify-center text-[10px] uppercase tracking-wider font-bold`}>
              {z.label}
            </div>
          ))}
          <div className="absolute -top-3 -translate-x-1/2 transition-all" style={{ left }}>
            <div className="bg-ink text-parchment font-mono text-xs px-2 py-1 border-2 border-ink shadow-brutal-sm">
              {Math.round(feelsLike)}°
            </div>
          </div>
        </div>
        <div className="flex justify-between text-[10px] tabular-nums text-muted-foreground mt-2 font-mono">
          <span>27°C</span><span>32°C</span><span>41°C</span><span>54°C</span>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          The heat index combines temperature and humidity. It's how your body actually experiences the heat — humid 35°C can feel like dry 42°C.
        </p>
      </div>
    </section>
  );
}

// ============== LAYOUT HELPERS ==============
export function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">{eyebrow}</div>
      <h2 className="font-display font-black text-2xl md:text-3xl text-ink leading-tight">{title}</h2>
    </div>
  );
}
