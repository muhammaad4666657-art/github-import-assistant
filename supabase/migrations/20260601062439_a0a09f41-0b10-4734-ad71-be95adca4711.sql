
CREATE TABLE public.distributor_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  commission_percent NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.distributor_plans TO authenticated;
GRANT ALL ON public.distributor_plans TO service_role;

ALTER TABLE public.distributor_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage distributor plans"
ON public.distributor_plans FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_distributor_plans_updated_at
BEFORE UPDATE ON public.distributor_plans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE public.distributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  plan_id UUID REFERENCES public.distributor_plans(id) ON DELETE SET NULL,
  candidate_referrals INTEGER NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  pending_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.distributors TO authenticated;
GRANT ALL ON public.distributors TO service_role;

ALTER TABLE public.distributors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage distributors"
ON public.distributors FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_distributors_updated_at
BEFORE UPDATE ON public.distributors
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
