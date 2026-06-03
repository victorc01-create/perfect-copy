import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const StateSchema = z
  .object({
    ops: z.string().optional(),
    hist: z.string().optional(),
    state: z.string().optional(),
    emitted: z.string().optional(),
  })
  .passthrough();

type StoredState = {
  state?: unknown;
  updated_at?: string | null;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function hasValidApiKey(request: Request) {
  const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
  const provided = request.headers.get("apikey");
  return !!expected && provided === expected;
}

export const Route = createFileRoute("/api/public/btc-state")({
  server: {
    handlers: {
      GET: async () => {
        const { data, error } = await supabaseAdmin
          .from("btc_global_state" as never)
          .select("state, updated_at")
          .eq("key", "main")
          .maybeSingle();

        if (error) return json({ error: error.message, now: Date.now() }, 500);

        const row = data as StoredState | null;
        return json({ state: row?.state ?? {}, updatedAt: row?.updated_at ?? null, now: Date.now() });
      },
      POST: async ({ request }) => {
        if (!hasValidApiKey(request)) return json({ error: "Unauthorized" }, 401);

        let parsed: z.infer<typeof StateSchema>;
        try {
          const bodyText = await request.text();
          if (bodyText.length > 1_000_000) return json({ error: "Payload too large" }, 413);
          parsed = StateSchema.parse(JSON.parse(bodyText || "{}"));
        } catch {
          return json({ error: "Invalid payload" }, 400);
        }

        const state = {
          ops: parsed.ops ?? "[]",
          hist: parsed.hist ?? "[]",
          state: parsed.state ?? "{}",
          emitted: parsed.emitted ?? "{}",
        };

        const { error } = await supabaseAdmin.from("btc_global_state" as never).upsert({
          key: "main",
          state,
          updated_at: new Date().toISOString(),
        } as never);

        if (error) return json({ error: error.message }, 500);
        return json({ ok: true, now: Date.now() });
      },
    },
  },
});
