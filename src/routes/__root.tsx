import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import appCss from "../styles.css?url";

interface RouterContext {
  queryClient: QueryClient;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="max-w-md text-center bg-card border-2 border-ink shadow-brutal-lg p-8">
        <h1 className="font-display font-black text-7xl text-primary">404</h1>
        <h2 className="mt-2 font-display font-bold text-xl">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          That route doesn't exist on ThermalBharat.
        </p>
        <div className="mt-5">
          <Link to="/" className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground border-2 border-ink shadow-brutal-sm font-bold uppercase text-xs tracking-wider">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ThermalBharat — India's Hyperlocal Heat Intelligence" },
      { name: "description", content: "Hyper-accurate, location-specific heat & weather intelligence for every Indian city, town and village." },
      { name: "author", content: "ThermalBharat" },
      { property: "og:title", content: "ThermalBharat — India's Hyperlocal Heat Intelligence" },
      { property: "og:description", content: "Hyper-accurate, location-specific heat & weather intelligence for every Indian city, town and village." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ThermalBharat — India's Hyperlocal Heat Intelligence" },
      { name: "twitter:description", content: "Hyper-accurate, location-specific heat & weather intelligence for every Indian city, town and village." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/93dcdc01-d696-444a-9300-7c8673b89be5/id-preview-e2461839--a3fb4b7e-cdce-4fff-953f-a4c3b1c311af.lovable.app-1777205394047.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/93dcdc01-d696-444a-9300-7c8673b89be5/id-preview-e2461839--a3fb4b7e-cdce-4fff-953f-a4c3b1c311af.lovable.app-1777205394047.png" },
      { name: "theme-color", content: "#c2591a" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "ThermalBharat" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
