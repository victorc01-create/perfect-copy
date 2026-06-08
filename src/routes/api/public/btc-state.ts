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

type JsonRecord = Record<string, unknown>;

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

        const parseJson = (raw: string | undefined, fallback: unknown) => {
          if (!raw) return fallback;
          try {
            return JSON.parse(raw);
          } catch {
            return fallback;
          }
        };
        const mergeById = (oldRaw: string | undefined, newRaw: string | undefined) => {
          const statusRank: Record<string, number> = { wait: 0, open: 1, pending_close: 2, win: 3, loss: 3 };
          const map = new Map<string, JsonRecord>();
          const add = (arr: unknown) => {
            if (!Array.isArray(arr)) return;
            for (const item of arr) {
              const o = item as JsonRecord;
              const id = o?.id;
              if (id == null) continue;
              const k = String(id);
              const prev = map.get(k);
              if (!prev) {
                map.set(k, o);
                continue;
              }
              const prevRank = statusRank[String(prev.status ?? "")] ?? 0;
              const nextRank = statusRank[String(o.status ?? "")] ?? 0;
              const merged = { ...prev, ...o, entryAt: o.entryAt ?? prev.entryAt, emittedAt: o.emittedAt ?? prev.emittedAt };
              map.set(k, nextRank >= prevRank ? merged : { ...o, ...prev, entryAt: prev.entryAt ?? o.entryAt, emittedAt: prev.emittedAt ?? o.emittedAt });
            }
          };
          add(parseJson(oldRaw, []));
          add(parseJson(newRaw, []));
          return JSON.stringify([...map.values()]);
        };
        const mergeState = (oldRaw: string | undefined, newRaw: string | undefined) => {
          const oldState = parseJson(oldRaw, {}) as JsonRecord;
          const newState = parseJson(newRaw, {}) as JsonRecord;
          return JSON.stringify({
            ...oldState,
            ...newState,
            gId: Math.max(Number(oldState.gId ?? 0), Number(newState.gId ?? 0)),
            tfId: { ...((oldState.tfId as JsonRecord) ?? {}), ...((newState.tfId as JsonRecord) ?? {}) },
            closed: { ...((oldState.closed as JsonRecord) ?? {}), ...((newState.closed as JsonRecord) ?? {}) },
            lossStreak: { ...((oldState.lossStreak as JsonRecord) ?? {}), ...((newState.lossStreak as JsonRecord) ?? {}) },
          });
        };
        const mergeEmitted = (oldRaw: string | undefined, newRaw: string | undefined) => {
          const oldEmitted = parseJson(oldRaw, {}) as Record<string, JsonRecord>;
          const newEmitted = parseJson(newRaw, {}) as Record<string, JsonRecord>;
          const out: Record<string, JsonRecord> = { ...oldEmitted };
          for (const [key, value] of Object.entries(newEmitted)) {
            const prev = out[key];
            out[key] = prev ? { ...prev, ...value, entryAt: value.entryAt ?? prev.entryAt, emittedAt: value.emittedAt ?? prev.emittedAt } : value;
          }
          return JSON.stringify(out);
        };

        const { data: current } = await supabaseAdmin
          .from("btc_global_state" as never)
          .select("state")
          .eq("key", "main")
          .maybeSingle();
        const currentState = ((current as StoredState | null)?.state ?? {}) as Partial<Record<string, string>>;

        const mergedHist = mergeById(currentState.hist, parsed.hist);
        const closedIds = new Set(
          (parseJson(mergedHist, []) as JsonRecord[])
            .filter((o) => o?.live === false || o?.status === "win" || o?.status === "loss")
            .map((o) => String(o.id)),
        );
        const mergedOps = (parseJson(mergeById(currentState.ops, parsed.ops), []) as JsonRecord[]).filter(
          (o) => !closedIds.has(String(o.id)),
        );

        const state = {
          ops: JSON.stringify(mergedOps),
          hist: mergedHist,
          state: mergeState(currentState.state, parsed.state),
          emitted: mergeEmitted(currentState.emitted, parsed.emitted),
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
