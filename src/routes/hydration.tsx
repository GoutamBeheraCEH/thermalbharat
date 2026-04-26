import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header, MobileNav, Footer } from "@/components/Shell";
import { fetchWeather, reverseGeocode, type GeoLocation } from "@/lib/weather/api";
import { HydrationPanel } from "@/components/Dashboard";

const FALLBACK: GeoLocation = { name: "New Delhi", state: "Delhi", latitude: 28.6139, longitude: 77.209, displayName: "New Delhi" };

export const Route = createFileRoute("/hydration")({
  head: () => ({
    meta: [
      { title: "Hydration Guide — ThermalBharat" },
      { name: "description", content: "Smart hydration intelligence for Indian heat — water targets, ORS, coconut water, and warning signs." },
      { property: "og:title", content: "Hydration Guide — ThermalBharat" },
      { property: "og:description", content: "How much water you need based on temperature, humidity & activity." },
    ],
  }),
  component: HydrationPage,
});

function HydrationPage() {
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
          <div className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Stay watered</div>
          <h1 className="font-display font-black text-4xl md:text-6xl">Hydration intelligence</h1>
        </div>
        {wq.data && <HydrationPanel weather={wq.data} />}
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
