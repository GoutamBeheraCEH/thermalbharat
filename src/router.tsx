import { QueryClient } from "@tanstack/react-query";
import { createRouter, useRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="max-w-md text-center bg-card border-2 border-ink shadow-brutal-lg p-8">
        <div className="font-display font-black text-5xl text-primary mb-3">Oops.</div>
        <h1 className="font-display font-bold text-xl mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="px-4 py-2 bg-primary text-primary-foreground border-2 border-ink shadow-brutal-sm font-bold uppercase text-xs tracking-wider"
          >
            Try again
          </button>
          <a href="/" className="px-4 py-2 bg-card border-2 border-ink shadow-brutal-sm font-bold uppercase text-xs tracking-wider">Home</a>
        </div>
      </div>
    </div>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
  });
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
  });
  return router;
};
