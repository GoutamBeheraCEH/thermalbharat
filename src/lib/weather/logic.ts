// Pure logic for heat advisories, hydration, regional context.

export type HeatSeverity =
  | "comfortable"
  | "warm"
  | "hot"
  | "very-hot"
  | "extreme"
  | "severe-wave";

export interface SeverityBadge {
  level: HeatSeverity;
  label: string;
  bgClass: string;
  textClass: string;
  ring: string;
}

export function getHeatSeverityBadge(feelsLikeC: number): SeverityBadge {
  if (feelsLikeC < 27)
    return {
      level: "comfortable",
      label: "Comfortable",
      bgClass: "bg-cool/30",
      textClass: "text-ink",
      ring: "oklch(0.78 0.06 220)",
    };
  if (feelsLikeC < 32)
    return {
      level: "warm",
      label: "Warm",
      bgClass: "bg-accent/40",
      textClass: "text-ink",
      ring: "oklch(0.85 0.13 75)",
    };
  if (feelsLikeC < 38)
    return {
      level: "hot",
      label: "Hot",
      bgClass: "bg-accent",
      textClass: "text-ink",
      ring: "oklch(0.72 0.18 55)",
    };
  if (feelsLikeC < 43)
    return {
      level: "very-hot",
      label: "Very Hot",
      bgClass: "bg-primary",
      textClass: "text-primary-foreground",
      ring: "oklch(0.55 0.17 35)",
    };
  if (feelsLikeC < 48)
    return {
      level: "extreme",
      label: "Extreme Heat",
      bgClass: "bg-destructive",
      textClass: "text-destructive-foreground",
      ring: "oklch(0.5 0.22 25)",
    };
  return {
    level: "severe-wave",
    label: "Severe Heat Wave",
    bgClass: "bg-amber-deep",
    textClass: "text-primary-foreground",
    ring: "oklch(0.42 0.13 38)",
  };
}

export function getBackgroundGradientClass(tempC: number): string {
  if (tempC < 25) return "heat-gradient-cool";
  if (tempC < 35) return "heat-gradient-warm";
  if (tempC < 45) return "heat-gradient-hot";
  return "heat-gradient-extreme";
}

export function humidityLabel(h: number): string {
  if (h < 30) return "Dry";
  if (h < 50) return "Moderate";
  if (h < 70) return "Humid";
  return "Very Humid";
}

export function uvLabel(uv: number): string {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very High";
  return "Extreme";
}

export function windDirectionLabel(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

export interface Advisory {
  dos: string[];
  donts: string[];
  headline: string;
}

export function getHeatAdvisory(
  tempC: number,
  humidity: number,
  uvIndex: number
): Advisory {
  if (tempC >= 40) {
    return {
      headline: "Heat is dangerous. Treat outdoor exposure as a hazard.",
      dos: [
        "Stay indoors between 11 AM – 5 PM",
        "Sip water every 20 minutes; add ORS or salt + lemon",
        "Wear loose, light cotton — preferably white or pastel",
        "Place a wet cloth on neck, wrists and forehead",
        "Eat watery foods: cucumber, watermelon, curd rice",
      ],
      donts: [
        "Avoid direct sun, especially noon to 4 PM",
        "Avoid strenuous outdoor work or exercise",
        "Avoid dark, tight, synthetic clothing",
        "Avoid alcohol, caffeine and heavy fried meals",
        "Never leave children or pets in parked vehicles",
      ],
    };
  }
  if (tempC >= 35) {
    return {
      headline: "It's hot. Take it slow and hydrate intentionally.",
      dos: [
        "Hydrate before you feel thirsty",
        "Schedule outdoor errands before 10 AM or after 6 PM",
        "Use an umbrella, cap or scarf in the sun",
        uvIndex >= 8 ? "Apply SPF 50+ sunscreen, reapply every 2 hours" : "Apply SPF 30+ sunscreen",
        "Take 10-min indoor breaks every hour outdoors",
      ],
      donts: [
        "Don't skip meals — low blood sugar worsens heat strain",
        "Don't rely only on cold drinks — sip room-temp water too",
        humidity > 60 ? "Avoid heavy meals — humid heat slows digestion" : "Avoid prolonged sun exposure",
        "Don't ignore early warning signs: dizziness, headache, cramps",
      ],
    };
  }
  return {
    headline: "Pleasant weather. Stay generally well.",
    dos: [
      "Drink 6–8 glasses of water through the day",
      "Enjoy outdoor activity — morning or evening is ideal",
      "Use light moisturizer if AC use is high",
      "Eat seasonal fruits",
    ],
    donts: [
      "Don't over-rely on AC — give your body a break",
      "Avoid sudden temperature swings (cold drinks after sun)",
    ],
  };
}

export type ActivityLevel = "resting" | "walking" | "working" | "exercising";

export interface HydrationGuide {
  mlPerHour: number;
  totalLitres: number;
  fluids: { name: string; note: string }[];
  warnings: string[];
}

export function getHydrationGuide(
  tempC: number,
  humidity: number,
  activity: ActivityLevel
): HydrationGuide {
  const baseMl: Record<ActivityLevel, number> = {
    resting: 120,
    walking: 220,
    working: 380,
    exercising: 550,
  };
  const heatMultiplier = tempC >= 40 ? 1.5 : tempC >= 35 ? 1.25 : tempC >= 30 ? 1.1 : 1;
  const humidityMultiplier = humidity >= 70 ? 1.15 : 1;
  const mlPerHour = Math.round(
    baseMl[activity] * heatMultiplier * humidityMultiplier
  );
  return {
    mlPerHour,
    totalLitres: Math.round((mlPerHour * 14) / 100) / 10,
    fluids: [
      { name: "Plain water", note: "The base — every 20 minutes" },
      { name: "Coconut water (नारियल पानी)", note: "Natural electrolytes, light on stomach" },
      { name: "ORS / नींबू पानी", note: "Critical above 38°C — replaces sodium" },
      { name: "Buttermilk (छाछ)", note: "Cools the gut, restores gut flora" },
      { name: "Aam panna / Sattu sharbat", note: "Traditional Indian summer coolers" },
    ],
    warnings: [
      "Dark yellow urine = drink more, now",
      "Headache + dizziness + nausea → move to shade, sip ORS",
      "Hot dry skin with no sweat = heat stroke. Call a doctor.",
    ],
  };
}

// Simple Indian regional climate classifier.
const COASTAL_STATES = ["Maharashtra", "Goa", "Karnataka", "Kerala", "Tamil Nadu", "Andhra Pradesh", "Odisha", "West Bengal", "Gujarat"];
const DESERT_STATES = ["Rajasthan"];
const PLATEAU_STATES = ["Madhya Pradesh", "Chhattisgarh", "Telangana", "Jharkhand"];
const HIMALAYAN_STATES = ["Himachal Pradesh", "Uttarakhand", "Sikkim", "Arunachal Pradesh", "Jammu and Kashmir", "Ladakh"];
const NORTH_PLAINS = ["Delhi", "Punjab", "Haryana", "Uttar Pradesh", "Bihar"];
const VIDARBHA_CITIES = ["nagpur", "wardha", "chandrapur", "akola", "amravati", "yavatmal"];
const METROS = ["delhi", "mumbai", "kolkata", "chennai", "bengaluru", "hyderabad", "pune", "ahmedabad"];

export function getHeatContextExplanation(
  city: string,
  state: string | undefined,
  month: number, // 0-11
  tempC: number
): string {
  const c = city.toLowerCase();
  const s = state || "";
  const isMetro = METROS.some((m) => c.includes(m));
  const season =
    month >= 2 && month <= 4
      ? "pre-monsoon"
      : month >= 5 && month <= 8
      ? "monsoon"
      : month >= 9 && month <= 10
      ? "post-monsoon"
      : "winter";

  if (VIDARBHA_CITIES.some((v) => c.includes(v))) {
    return `${city} sits in the Vidarbha belt — a landlocked plateau with low humidity and dark basalt soil that absorbs heat fast. With no sea breeze and sparse tree cover, it consistently records India's highest summer temperatures during March–June.`;
  }
  if (DESERT_STATES.includes(s)) {
    return `${city} lies in the Thar desert ecosystem of Rajasthan. Sandy terrain heats rapidly under direct sun, daytime temperatures spike to ${Math.round(tempC)}°C+ but humidity stays low. Nights cool sharply — a classic continental desert pattern.`;
  }
  if (HIMALAYAN_STATES.includes(s)) {
    return `${city} is a Himalayan location. Even during the ${season} season, elevation and forest cover keep temperatures milder than the plains — but UV exposure stays high due to thinner atmosphere.`;
  }
  if (COASTAL_STATES.includes(s)) {
    return `${city} is influenced by the ${s.includes("Bengal") || s.includes("Odisha") || s.includes("Tamil") || s.includes("Andhra") ? "Bay of Bengal" : "Arabian Sea"}. Coastal humidity makes ${tempC}°C feel significantly hotter — the body cannot cool through sweat efficiently. Sea breeze offers afternoon relief.`;
  }
  if (NORTH_PLAINS.includes(s)) {
    if (season === "pre-monsoon") {
      return `${city} sits in the Indo-Gangetic plains. Pre-monsoon months bring dry continental winds (loo) from Rajasthan, pushing temperatures past 42°C.${isMetro ? " Urban heat island effect from concrete and traffic adds 2–4°C extra." : ""}`;
    }
    return `${city} in the North Indian plains experiences sharp seasonal swings — extremely hot summers and cool winters due to its inland position far from coastal moderation.${isMetro ? " As a metro, heat lingers into the night due to the urban heat island effect." : ""}`;
  }
  if (PLATEAU_STATES.includes(s)) {
    return `${city} lies on the Deccan/Central plateau. Rocky terrain and elevation create dry, intense daytime heat during the ${season} season, with rapid cooling after sunset.`;
  }
  return `${city}${state ? `, ${state}` : ""} is currently in its ${season} phase. Local terrain, vegetation, and proximity to water bodies all shape how this temperature feels on your skin.`;
}

// 7-day delta helpers
export function avg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
