
-- Allow anonymous and authenticated visitors to read distributor plans (for the signup page)
GRANT SELECT ON public.distributor_plans TO anon, authenticated;

DROP POLICY IF EXISTS "distributor plans public read" ON public.distributor_plans;
CREATE POLICY "distributor plans public read"
ON public.distributor_plans
FOR SELECT
TO anon, authenticated
USING (true);

-- Secure function: authenticate a distributor by username/password
CREATE OR REPLACE FUNCTION public.authenticate_distributor(p_username text, p_password text)
RETURNS TABLE (
  id uuid,
  username text,
  plan_id uuid,
  candidate_referrals integer,
  paid_amount numeric,
  pending_amount numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.id, d.username, d.plan_id, d.candidate_referrals, d.paid_amount, d.pending_amount
  FROM public.distributors d
  WHERE lower(d.username) = lower(p_username)
    AND d.password = p_password
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.authenticate_distributor(text, text) TO anon, authenticated;

-- Secure function: compute distributor dashboard stats by username
CREATE OR REPLACE FUNCTION public.get_distributor_stats(p_username text)
RETURNS TABLE (
  username text,
  plan_name text,
  commission_percent numeric,
  sales_count integer,
  candidate_referrals integer,
  total_commission numeric,
  paid_amount numeric,
  pending_amount numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d_row public.distributors%ROWTYPE;
  v_plan_name text;
  v_commission_percent numeric := 0;
  v_sales_count integer := 0;
  v_revenue numeric := 0;
BEGIN
  SELECT * INTO d_row FROM public.distributors WHERE lower(username) = lower(p_username) LIMIT 1;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF d_row.plan_id IS NOT NULL THEN
    SELECT p.name, COALESCE(p.commission_percent, 0)
      INTO v_plan_name, v_commission_percent
    FROM public.distributor_plans p WHERE p.id = d_row.plan_id;
  END IF;

  SELECT COALESCE(SUM(oi.quantity), 0), COALESCE(SUM(o.subtotal), 0)
    INTO v_sales_count, v_revenue
  FROM public.orders o
  LEFT JOIN public.order_items oi ON oi.order_id = o.id
  WHERE lower(o.referral_code) = lower(p_username)
    AND o.status <> 'cancelled';

  username := d_row.username;
  plan_name := v_plan_name;
  commission_percent := v_commission_percent;
  sales_count := v_sales_count;
  candidate_referrals := d_row.candidate_referrals;
  total_commission := round((v_revenue * v_commission_percent) / 100);
  paid_amount := d_row.paid_amount;
  pending_amount := d_row.pending_amount;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_distributor_stats(text) TO anon, authenticated;
