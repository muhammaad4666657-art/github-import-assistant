
CREATE TABLE public.customer_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  message text NOT NULL,
  source text NOT NULL DEFAULT 'chat',
  handled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_leads TO authenticated;
GRANT INSERT ON public.customer_leads TO anon;
GRANT ALL ON public.customer_leads TO service_role;
ALTER TABLE public.customer_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone create lead" ON public.customer_leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins manage leads" ON public.customer_leads FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
