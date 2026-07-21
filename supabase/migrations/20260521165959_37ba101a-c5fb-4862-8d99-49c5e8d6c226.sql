
-- Business city setting
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS business_city text NOT NULL DEFAULT 'Lahore';

UPDATE public.site_settings SET business_city = 'Lahore' WHERE id = 1;

-- Chat conversations
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_id text,
  visitor_name text,
  visitor_email text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  unread_admin integer NOT NULL DEFAULT 0,
  unread_user integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conv_anon ON public.chat_conversations(anon_id);
CREATE INDEX IF NOT EXISTS idx_chat_conv_last ON public.chat_conversations(last_message_at DESC);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Anyone can create a conversation (guest or auth)
CREATE POLICY "anyone create conversation" ON public.chat_conversations
  FOR INSERT WITH CHECK (true);

-- Owners or admins can view
CREATE POLICY "owner or admin view conversation" ON public.chat_conversations
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR anon_id IS NOT NULL
  );

-- Owners or admins can update (mark read, set name etc.)
CREATE POLICY "owner or admin update conversation" ON public.chat_conversations
  FOR UPDATE USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR anon_id IS NOT NULL
  );

CREATE POLICY "admins delete conversation" ON public.chat_conversations
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Chat messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('user','bot','admin')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON public.chat_messages(conversation_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Insert: anyone for an existing conversation (validated by conversation existence). Admin sender requires admin role.
CREATE POLICY "insert message own or admin" ON public.chat_messages
  FOR INSERT WITH CHECK (
    (sender = 'admin' AND has_role(auth.uid(), 'admin'::app_role))
    OR (sender IN ('user','bot') AND EXISTS (
      SELECT 1 FROM public.chat_conversations c WHERE c.id = conversation_id
    ))
  );

CREATE POLICY "view messages of own conv or admin" ON public.chat_messages
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = conversation_id
        AND (
          (auth.uid() IS NOT NULL AND c.user_id = auth.uid())
          OR c.anon_id IS NOT NULL
        )
    )
  );

CREATE POLICY "admins delete messages" ON public.chat_messages
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_chat_conv_updated ON public.chat_conversations;
CREATE TRIGGER trg_chat_conv_updated
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Realtime
ALTER TABLE public.chat_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
