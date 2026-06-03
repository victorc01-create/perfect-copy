CREATE TABLE IF NOT EXISTS public.btc_global_state (
  key TEXT PRIMARY KEY,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.btc_global_state TO service_role;

ALTER TABLE public.btc_global_state ENABLE ROW LEVEL SECURITY;

INSERT INTO public.btc_global_state (key, state)
VALUES ('main', '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;