import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, MapPin, Home, CalendarDays, ShieldAlert, Droplets, Moon, Sun } from "lucide-react";
import { geocodeIndianPlace, type GeoLocation } from "@/lib/weather/api";

const RECENT_KEY = "tb_recent_locations";

export function loadRecent(): GeoLocation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveRecent(loc: GeoLocation) {
  const list = loadRecent().filter(
    (l) => `${l.latitude},${l.longitude}` !== `${loc.latitude},${loc.longitude}`
  );
  list.unshift(loc);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6)));
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("tb_dark") === "1";
    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("tb_dark", next ? "1" : "0");
  }

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await geocodeIndianPlace(q);
        setResults(r);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  function pick(loc: GeoLocation) {
    saveRecent(loc);
    setOpen(false);
    setQ("");
    navigate({ to: "/city/$cityName", params: { cityName: loc.name }, search: { lat: loc.latitude, lon: loc.longitude } });
  }

  return (
    <header className="border-b-2 border-ink bg-parchment sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-primary border-2 border-ink shadow-brutal-sm flex items-center justify-center font-display font-black text-primary-foreground text-lg">
            ट
          </div>
          <div className="leading-tight">
            <div className="font-display font-black text-lg text-ink">ThermalBharat</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Heat intelligence • IST</div>
          </div>
        </Link>

        <button
          onClick={() => setOpen(true)}
          className="ml-auto md:ml-0 md:flex-1 md:max-w-md flex items-center gap-2 px-3 py-2 border-2 border-ink bg-card text-left text-sm text-muted-foreground shadow-brutal-sm hover:shadow-brutal transition-shadow"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Search any Indian city, town or pincode…</span>
          <span className="sm:hidden">Search…</span>
        </button>

        <nav className="hidden md:flex items-center gap-1 ml-auto">
          {[
            { to: "/", label: "Home" },
            { to: "/forecast", label: "Forecast" },
            { to: "/advisory", label: "Advisory" },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{ className: "bg-ink text-parchment" }}
              activeOptions={{ exact: true }}
              className="px-3 py-2 text-sm font-medium border-2 border-transparent hover:border-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button onClick={toggleDark} className="p-2 border-2 border-ink shadow-brutal-sm bg-card" aria-label="Toggle dark mode">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {open && <SearchOverlay q={q} setQ={setQ} results={results} loading={loading} onClose={() => setOpen(false)} onPick={pick} />}
    </header>
  );
}

function SearchOverlay({
  q, setQ, results, loading, onClose, onPick,
}: {
  q: string;
  setQ: (s: string) => void;
  results: GeoLocation[];
  loading: boolean;
  onClose: () => void;
  onPick: (l: GeoLocation) => void;
}) {
  const recent = loadRecent();
  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <div className="w-full max-w-xl bg-parchment border-2 border-ink shadow-brutal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 p-3 border-b-2 border-ink">
          <Search className="w-5 h-5" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try Nagpur, Jaisalmer, 110001…"
            className="flex-1 bg-transparent outline-none text-base"
          />
          <button onClick={onClose} className="text-xs uppercase tracking-wider px-2 py-1 border border-ink">Esc</button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading && <div className="p-4 text-sm text-muted-foreground">Searching…</div>}
          {!loading && q && results.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">No matches in India.</div>
          )}
          {!q && recent.length > 0 && (
            <div className="p-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Recent</div>
              {recent.map((r) => (
                <ResultRow key={`${r.latitude},${r.longitude}`} loc={r} onPick={onPick} />
              ))}
            </div>
          )}
          {results.map((r) => (
            <ResultRow key={`${r.latitude},${r.longitude}`} loc={r} onPick={onPick} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultRow({ loc, onPick }: { loc: GeoLocation; onPick: (l: GeoLocation) => void }) {
  return (
    <button
      onClick={() => onPick(loc)}
      className="w-full text-left px-4 py-3 hover:bg-accent/30 border-b border-ink/10 flex items-start gap-3"
    >
      <MapPin className="w-4 h-4 mt-1 shrink-0 text-primary" />
      <div className="min-w-0">
        <div className="font-medium text-ink truncate">{loc.name}</div>
        <div className="text-xs text-muted-foreground truncate">
          {[loc.district, loc.state].filter(Boolean).join(" • ")} {loc.latitude.toFixed(2)}, {loc.longitude.toFixed(2)}
        </div>
      </div>
    </button>
  );
}

export function MobileNav() {
  const { pathname } = useLocation();
  const items = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/forecast", icon: CalendarDays, label: "Forecast" },
    { to: "/advisory", icon: ShieldAlert, label: "Advisory" },
    { to: "/hydration", icon: Droplets, label: "Hydration" },
  ] as const;
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-parchment border-t-2 border-ink grid grid-cols-4">
      {items.map((it) => {
        const active = pathname === it.to;
        const Icon = it.icon;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={`flex flex-col items-center gap-1 py-2 text-[10px] uppercase tracking-wider ${active ? "bg-ink text-parchment" : "text-ink"}`}
          >
            <Icon className="w-5 h-5" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="border-t-2 border-ink bg-parchment mt-12 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 grid md:grid-cols-3 gap-6 text-sm">
        <div>
          <div className="font-display font-black text-lg mb-2">ThermalBharat</div>
          <p className="text-muted-foreground">Hyperlocal heat & weather intelligence for India's cities, towns and villages.</p>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Data Sources</div>
          <p>Open-Meteo • OpenStreetMap (Nominatim) • WAQI</p>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Disclaimer</div>
          <p className="text-muted-foreground text-xs">Heat advisories are informational. During heat waves, follow IMD (India Meteorological Department) and local government guidelines.</p>
        </div>
      </div>
    </footer>
  );
}
