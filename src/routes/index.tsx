import { createFileRoute } from "@tanstack/react-router";
import { WeatherDashboard } from "@/components/WeatherDashboard";

export const Route = createFileRoute("/")({
  component: () => <WeatherDashboard />,
});
