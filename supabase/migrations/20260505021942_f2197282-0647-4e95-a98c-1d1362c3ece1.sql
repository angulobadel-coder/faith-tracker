
-- 1. Tighten members table
DROP POLICY IF EXISTS "Anon can read newly inserted member" ON public.members;
DROP POLICY IF EXISTS "Anyone can register as member" ON public.members;

-- 2. Tighten attendance table
DROP POLICY IF EXISTS "Anon can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Anon can read attendance" ON public.attendance;

-- 3. Tighten alerts table (keep anon insert removed; alerts created via RPC)
DROP POLICY IF EXISTS "Anyone can create alerts" ON public.alerts;
DROP POLICY IF EXISTS "Anon can read alerts" ON public.alerts;

-- 4. Fix handle_new_user: never trust user-supplied role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'member'
  );
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Secure RPC for ESP32 fingerprint attendance
CREATE OR REPLACE FUNCTION public.register_attendance_by_fingerprint(
  _fp_id text,
  _service text DEFAULT 'Servicio Dominical'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _member_id uuid;
  _member_name text;
BEGIN
  SELECT id, full_name INTO _member_id, _member_name
  FROM public.members
  WHERE fingerprint_id = _fp_id AND active = true
  LIMIT 1;

  IF _member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.attendance
    WHERE member_id = _member_id
      AND attendance_date = CURRENT_DATE
      AND service_type = _service
  ) THEN
    RETURN jsonb_build_object('success', true, 'member_name', _member_name, 'duplicate', true);
  END IF;

  INSERT INTO public.attendance (member_id, service_type)
  VALUES (_member_id, _service);

  RETURN jsonb_build_object('success', true, 'member_name', _member_name);
END;
$$;

REVOKE ALL ON FUNCTION public.register_attendance_by_fingerprint(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_attendance_by_fingerprint(text, text) TO anon, authenticated;

-- 6. Secure RPC for public member self-registration
CREATE OR REPLACE FUNCTION public.register_member(
  _full_name text,
  _email text,
  _phone text DEFAULT NULL,
  _birth_date date DEFAULT NULL,
  _reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  IF _full_name IS NULL OR length(trim(_full_name)) = 0 THEN
    RAISE EXCEPTION 'full_name required';
  END IF;
  IF _email IS NULL OR length(trim(_email)) = 0 THEN
    RAISE EXCEPTION 'email required';
  END IF;

  INSERT INTO public.members (full_name, email, phone, birth_date, membership_reason)
  VALUES (trim(_full_name), trim(_email), _phone, _birth_date, _reason)
  RETURNING id INTO _id;

  INSERT INTO public.alerts (member_id, alert_type, description, status)
  VALUES (_id, 'nuevo_miembro', 'Nuevo miembro registrado: ' || trim(_full_name), 'pendiente');
END;
$$;

REVOKE ALL ON FUNCTION public.register_member(text, text, text, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_member(text, text, text, date, text) TO anon, authenticated;
