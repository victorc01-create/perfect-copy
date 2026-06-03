import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/time")({
  server: {
    handlers: {
      GET: async () =>
        new Response(JSON.stringify({ now: Date.now() }), {
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        }),
    },
  },
});
