UPDATE public.btc_global_state
SET state = jsonb_build_object(
  'ops', COALESCE((
    SELECT jsonb_agg(elem ORDER BY ord)::text
    FROM (
      SELECT DISTINCT ON (elem->>'id') elem, ord
      FROM jsonb_array_elements((state->>'ops')::jsonb) WITH ORDINALITY AS t(elem,ord)
      WHERE elem->>'id' IS NOT NULL
      ORDER BY elem->>'id', ord
    ) s
  ), '[]'),
  'hist', COALESCE((
    SELECT jsonb_agg(elem ORDER BY ord)::text
    FROM (
      SELECT DISTINCT ON (elem->>'id') elem, ord
      FROM jsonb_array_elements((state->>'hist')::jsonb) WITH ORDINALITY AS t(elem,ord)
      WHERE elem->>'id' IS NOT NULL
      ORDER BY elem->>'id', ord
    ) s
  ), '[]'),
  'state', COALESCE(state->>'state', '{}'),
  'emitted', COALESCE(state->>'emitted', '{}')
),
updated_at = now()
WHERE key = 'main';