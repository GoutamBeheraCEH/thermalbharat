import { createFileRoute } from "@tanstack/react-router";
import { WeatherDashboard } from "@/components/WeatherDashboard";

interface CitySearch {
  lat: number;
  lon: number;
}

export const Route = createFileRoute("/city/$cityName")({
  validateSearch: (s: Record<string, unknown>): CitySearch => ({
    lat: Number(s.lat) || 28.6139,
    lon: Number(s.lon) || 77.209,
  }),
  head: ({ params }) => ({
    meta: [
      { title: `${decodeURIComponent(params.cityName)} weather & heat — ThermalBharat` },
      { name: "description", content: `Live heat intelligence, hourly forecast, hydration & advisory for ${decodeURIComponent(params.cityName)}.` },
      { property: "og:title", content: `${decodeURIComponent(params.cityName)} — heat intelligence` },
      { property: "og:description", content: `Hyperlocal weather & heat advisory for ${decodeURIComponent(params.cityName)}.` },
    ],
  }),
  component: CityPage,
});

function CityPage() {
  const { cityName } = Route.useParams();
  const { lat, lon } = Route.useSearch();
  return (
    <WeatherDashboard
      initialLocation={{
        name: decodeURIComponent(cityName),
        latitude: lat,
        longitude: lon,
        displayName: decodeURIComponent(cityName),
      }}
    />
  );
}
