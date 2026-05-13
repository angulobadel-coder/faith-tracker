ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER TABLE public.attendance REPLICA IDENTITY FULL;