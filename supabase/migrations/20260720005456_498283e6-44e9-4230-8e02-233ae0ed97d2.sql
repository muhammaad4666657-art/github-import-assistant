
DROP FUNCTION IF EXISTS public.authenticate_distributor(text,text);
DROP FUNCTION IF EXISTS public.get_distributor_stats(text);

CREATE OR REPLACE FUNCTION public.authenticate_distributor(p_username text, p_password text)
RETURNS TABLE(id uuid, username text, plan_id uuid, candidate_referrals integer, paid_amount numeric, pending_amount numeric, display_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT d.id, d.username, d.plan_id, d.candidate_referrals, d.paid_amount, d.pending_amount, d.display_name, d.avatar_url
  FROM public.distributors d
  WHERE lower(d.username) = lower(p_username) AND d.password = p_password
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_distributor_stats(p_username text)
RETURNS TABLE(username text, display_name text, avatar_url text, plan_name text, commission_percent numeric, sales_count integer, candidate_referrals integer, total_commission numeric, paid_amount numeric, pending_amount numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  d_row public.distributors%ROWTYPE;
  v_plan_name text;
  v_commission_percent numeric := 0;
  v_sales_count integer := 0;
  v_revenue numeric := 0;
BEGIN
  SELECT * INTO d_row FROM public.distributors WHERE lower(distributors.username) = lower(p_username) LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;
  IF d_row.plan_id IS NOT NULL THEN
    SELECT p.name, COALESCE(p.commission_percent, 0) INTO v_plan_name, v_commission_percent
    FROM public.distributor_plans p WHERE p.id = d_row.plan_id;
  END IF;
  SELECT COALESCE(SUM(oi.quantity), 0), COALESCE(SUM(o.subtotal), 0) INTO v_sales_count, v_revenue
  FROM public.orders o LEFT JOIN public.order_items oi ON oi.order_id = o.id
  WHERE lower(o.referral_code) = lower(d_row.username) AND o.status <> 'cancelled';

  username := d_row.username; display_name := d_row.display_name; avatar_url := d_row.avatar_url;
  plan_name := v_plan_name; commission_percent := v_commission_percent;
  sales_count := v_sales_count; candidate_referrals := d_row.candidate_referrals;
  total_commission := round((v_revenue * v_commission_percent) / 100);
  paid_amount := d_row.paid_amount; pending_amount := d_row.pending_amount;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_distributor_profile(
  p_username text, p_password text, p_display_name text, p_avatar_url text
) RETURNS TABLE(username text, display_name text, avatar_url text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE d_row public.distributors%ROWTYPE;
BEGIN
  SELECT * INTO d_row FROM public.distributors
   WHERE lower(distributors.username) = lower(p_username) AND password = p_password LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid credentials'; END IF;

  UPDATE public.distributors SET
    display_name = NULLIF(btrim(p_display_name), ''),
    avatar_url   = NULLIF(btrim(p_avatar_url), ''),
    updated_at   = now()
  WHERE id = d_row.id
  RETURNING distributors.username, distributors.display_name, distributors.avatar_url
  INTO username, display_name, avatar_url;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_distributor_team(p_username text)
RETURNS TABLE(username text, display_name text, avatar_url text, plan_name text, commission_percent numeric, joined_at timestamptz, sub_team_count integer, orders_count integer, revenue numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    d.username, d.display_name, d.avatar_url,
    p.name AS plan_name, COALESCE(p.commission_percent, 0),
    d.created_at,
    (SELECT COUNT(*)::int FROM public.distributors sd WHERE lower(sd.referred_by) = lower(d.username)),
    (SELECT COUNT(*)::int FROM public.orders o WHERE lower(o.referral_code) = lower(d.username) AND o.status <> 'cancelled'),
    (SELECT COALESCE(SUM(o.subtotal),0) FROM public.orders o WHERE lower(o.referral_code) = lower(d.username) AND o.status <> 'cancelled')
  FROM public.distributors d
  LEFT JOIN public.distributor_plans p ON p.id = d.plan_id
  WHERE lower(d.referred_by) = lower(p_username)
  ORDER BY d.created_at DESC
$$;

GRANT EXECUTE ON FUNCTION public.authenticate_distributor(text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_distributor_stats(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_distributor_profile(text,text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_distributor_team(text) TO anon, authenticated;
