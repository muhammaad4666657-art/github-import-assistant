
-- Fix: anon/authenticated need EXECUTE on has_role (used inside products RLS)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;

-- Update bootstrap trigger to also grant admin to the owner's personal email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  IF NEW.email IN ('admin@alminternational.pk', 'ahmadarfi918@gmail.com')
     OR NEW.phone = '923264465422' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $function$;

-- If the user already exists, retroactively grant admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'ahmadarfi918@gmail.com'
ON CONFLICT DO NOTHING;
