import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CloudRain, Wind, Sun } from "lucide-react";
import { Header, MobileNav, Footer } from "@/components/Shell";
import { fetchWeather, reverseGeocode, type GeoLocation } from "@/lib/weather/api";
import { SectionTitle, ForecastStrip } from "@/components/Dashboard";

const FALLBACK: GeoLocation = {
  name: "New Delhi", state: "Delhi", latitude: 28.6139, longitude: 77.209, displayName: "New Delhi",
};

export const Route = createFileRoute("/forecast")({
  head: () => ({
    meta: [
      { title: "7-day Forecast — ThermalBharat" },
      { name: "description", content: "Detailed 7-day weather and heat forecast for your location in India." },
      { property: "og:title", content: "7-day Forecast — ThermalBharat" },
      { property: "og:description", content: "Detailed 7-day Indian weather forecast." },
    ],
  }),
  component: ForecastPage,
});

function ForecastPage() {
  const [loc, setLoc] = useState<GeoLocation | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) { setLoc(FALLBACK); return; }
    navigator.geolocation.getCurrentPosition(
      async (p) => { try { setLoc(await reverseGeocode(p.coords.latitude, p.coords.longitude)); } catch { setLoc(FALLBACK); } },
      () => setLoc(FALLBACK), { timeout: 6000 }
    );
  }, []);
  const wq = useQuery({
    queryKey: ["weather", loc?.latitude, loc?.longitude],
    queryFn: () => fetchWeather(loc!.latitude, loc!.longitude),
    enabled: !!loc, staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-8">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Looking ahead</div>
          <h1 className="font-display font-black text-4xl md:text-6xl">7-day forecast</h1>
          {loc && <p className="text-muted-foreground mt-1">{loc.name}{loc.state ? `, ${loc.state}` : ""}</p>}
        </div>
        {wq.data && (
          <>
            <ForecastStrip weather={wq.data} />
            <section>
              <SectionTitle eyebrow="Day-by-day" title="Detailed view" />
              <div className="space-y-3">
                {wq.data.daily.time.slice(7, 14).map((d, i) => {
                  const idx = 7 + i;
                  const w = wq.data!;
                  return (
                    <div key={d} className="bg-card border-2 border-ink shadow-brutal-sm p-4 grid grid-cols-2 md:grid-cols-6 gap-3 items-center">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{i === 0 ? "Today" : format(new Date(d), "EEE")}</div>
                        <div className="font-display font-bold text-xl">{format(new Date(d), "d MMM")}</div>
                      </div>
                      <div><Stat l="Max" v={`${Math.round(w.daily.temperature_2m_max[idx])}°`} /></div>
                      <div><Stat l="Min" v={`${Math.round(w.daily.temperature_2m_min[idx])}°`} /></div>
                      <div className="flex items-center gap-1 text-sm"><CloudRain className="w-4 h-4 text-primary" />{w.daily.precipitation_probability_max[idx]}%</div>
                      <div className="flex items-center gap-1 text-sm"><Wind className="w-4 h-4 text-primary" />{Math.round(w.daily.wind_speed_10m_max[idx])} km/h</div>
                      <div className="flex items-center gap-1 text-sm"><Sun className="w-4 h-4 text-primary" />UV {Math.round(w.daily.uv_index_max[idx])}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}

function Stat({ l, v }: { l: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
      <div className="font-display font-bold text-xl tabular-nums">{v}</div>
    </div>
  );
}
