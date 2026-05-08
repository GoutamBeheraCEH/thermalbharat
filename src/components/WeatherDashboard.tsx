import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { WifiOff, RefreshCw } from "lucide-react";
import { fetchWeather, fetchAqi, reverseGeocode, type GeoLocation } from "@/lib/weather/api";
import { lastLocation, weatherCache, formatAge } from "@/lib/weather/cache";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  HeroHeatCard, TodayGrid, HourlyStrip, HistoryChart, WhyHotCard,
  AdvisoryCard, HydrationPanel, ForecastStrip, HeatIndexScale,
} from "@/components/Dashboard";
import { Header, MobileNav, Footer, saveRecent } from "@/components/Shell";

// Default fallback (Delhi)
const FALLBACK: GeoLocation = {
  name: "New Delhi", state: "Delhi", district: "Central Delhi",
  latitude: 28.6139, longitude: 77.209, displayName: "New Delhi, India",
};

interface Props {
  initialLocation?: GeoLocation;
}

export function WeatherDashboard({ initialLocation }: Props) {
  const [loc, setLoc] = useState<GeoLocation | null>(
    initialLocation ?? (typeof window !== "undefined" ? lastLocation.get() : null)
  );
  const [geoError, setGeoError] = useState<string | null>(null);
  const online = useOnlineStatus();

  useEffect(() => {
    if (initialLocation) { lastLocation.set(initialLocation); return; }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      if (!loc) setLoc(FALLBACK);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // GPS works offline — use coords immediately
        const coordsLoc: GeoLocation = {
          name: "Your location",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          displayName: `${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`,
        };
        try {
          const r = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          setLoc(r);
          lastLocation.set(r);
          saveRecent(r);
        } catch {
          // Offline reverse-geocode failed — use raw GPS
          setLoc(coordsLoc);
          lastLocation.set(coordsLoc);
        }
      },
      () => {
        if (!loc) {
          setGeoError("Location blocked — showing last known");
          setLoc(lastLocation.get() ?? FALLBACK);
        }
      },
      { timeout: 15000, maximumAge: 2 * 60 * 1000, enableHighAccuracy: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLocation]);

  const weatherQ = useQuery({
    queryKey: ["weather", loc?.latitude, loc?.longitude],
    queryFn: () => fetchWeather(loc!.latitude, loc!.longitude),
    enabled: !!loc,
    staleTime: 5 * 60 * 1000,
  });

  const aqiQ = useQuery({
    queryKey: ["aqi", loc?.latitude, loc?.longitude],
    queryFn: () => fetchAqi(loc!.latitude, loc!.longitude),
    enabled: !!loc,
    staleTime: 10 * 60 * 1000,
  });

  // Auto-refresh when network returns
  useEffect(() => {
    if (online && loc) {
      weatherQ.refetch();
      aqiQ.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  const cached = loc ? weatherCache.get(loc.latitude, loc.longitude) : null;
  const showingCached = !online && !!weatherQ.data;

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-8">
        {!online && (
          <div className="bg-accent/40 border-2 border-ink shadow-brutal-sm p-3 flex items-center gap-3 text-sm">
            <WifiOff className="w-4 h-4 shrink-0 text-primary" />
            <div className="flex-1">
              <span className="font-bold uppercase tracking-wider text-xs">Offline mode</span>
              {cached && <span className="ml-2 text-muted-foreground">Last updated {formatAge(cached.ts)}</span>}
              {!cached && <span className="ml-2 text-muted-foreground">No cached data yet — connect once to download.</span>}
            </div>
            <button onClick={() => { weatherQ.refetch(); aqiQ.refetch(); }} className="p-1.5 border-2 border-ink bg-card" aria-label="Retry">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {online && cached && showingCached === false && weatherQ.data && (
          <></>
        )}
        {!loc && <ThermometerLoader label="Detecting your location…" />}
        {loc && weatherQ.isLoading && !weatherQ.data && <ThermometerLoader label={`Fetching heat data for ${loc.name}…`} />}
        {weatherQ.isError && !weatherQ.data && (
          <div className="bg-destructive/10 border-2 border-ink shadow-brutal p-6">
            <div className="font-display font-bold text-xl mb-2">Couldn't fetch weather</div>
            <p className="text-sm text-muted-foreground mb-3">
              {online ? "Check your connection and try again." : "You're offline and we have no cached data for this location yet."}
            </p>
            <button onClick={() => weatherQ.refetch()} className="px-4 py-2 bg-primary text-primary-foreground border-2 border-ink shadow-brutal-sm font-bold uppercase text-xs tracking-wider">
              Retry
            </button>
          </div>
        )}

        {loc && weatherQ.data && (
          <>
            {geoError && (
              <div className="text-xs px-3 py-2 bg-accent/30 border-2 border-ink inline-block">{geoError}</div>
            )}
            <HeroHeatCard
              weather={weatherQ.data}
              aqi={aqiQ.data ?? null}
              locationName={loc.name}
              state={loc.state}
              district={loc.district}
            />

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <TodayGrid weather={weatherQ.data} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <HourlyStrip weather={weatherQ.data} />
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <WhyHotCard city={loc.name} state={loc.state} tempC={weatherQ.data.current.temperature_2m} />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <HeatIndexScale feelsLike={weatherQ.data.current.apparent_temperature} />
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <HistoryChart weather={weatherQ.data} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <AdvisoryCard weather={weatherQ.data} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <HydrationPanel weather={weatherQ.data} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <ForecastStrip weather={weatherQ.data} />
            </motion.div>
          </>
        )}
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}

function ThermometerLoader({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative w-12 h-32 border-2 border-ink rounded-full overflow-hidden bg-card">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: "100%" }}
          transition={{ duration: 1.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          className="absolute bottom-0 inset-x-0 bg-primary"
        />
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary border-2 border-ink" />
      </div>
      <div className="font-display italic text-muted-foreground">{label}</div>
    </div>
  );
}
