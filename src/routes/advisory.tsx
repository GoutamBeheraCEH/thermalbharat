import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header, MobileNav, Footer } from "@/components/Shell";
import { fetchWeather, reverseGeocode, type GeoLocation } from "@/lib/weather/api";
import { AdvisoryCard, HeatIndexScale, WhyHotCard } from "@/components/Dashboard";

const FALLBACK: GeoLocation = { name: "New Delhi", state: "Delhi", latitude: 28.6139, longitude: 77.209, displayName: "New Delhi" };

export const Route = createFileRoute("/advisory")({
  head: () => ({
    meta: [
      { title: "Heat Advisory — ThermalBharat" },
      { name: "description", content: "Real-time heat safety advisory: what to do, what to avoid, and why your area gets so hot." },
      { property: "og:title", content: "Heat Advisory — ThermalBharat" },
      { property: "og:description", content: "Heat safety guidance for Indian cities — do's, don'ts, and climate context." },
    ],
  }),
  component: AdvisoryPage,
});

function AdvisoryPage() {
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
          <div className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Stay safe</div>
          <h1 className="font-display font-black text-4xl md:text-6xl">Heat advisory</h1>
          {loc && <p className="text-muted-foreground mt-1">For {loc.name}{loc.state ? `, ${loc.state}` : ""}</p>}
        </div>
        {wq.data && loc && (
          <>
            <AdvisoryCard weather={wq.data} />
            <div className="grid lg:grid-cols-2 gap-6">
              <WhyHotCard city={loc.name} state={loc.state} tempC={wq.data.current.temperature_2m} />
              <HeatIndexScale feelsLike={wq.data.current.apparent_temperature} />
            </div>
          </>
        )}
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
