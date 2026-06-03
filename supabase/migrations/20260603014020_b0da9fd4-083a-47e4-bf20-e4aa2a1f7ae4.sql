DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'btc_global_state'
      AND policyname = 'Backend can manage BTC global state'
  ) THEN
    CREATE POLICY "Backend can manage BTC global state"
    ON public.btc_global_state
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;