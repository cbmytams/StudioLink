-- ============================================================
-- StudioLink — Row Level Security (RLS) Policies
-- ============================================================

-- ===================== PROFILES =====================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view any profile"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ===================== MISSIONS =====================
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view missions"
  ON missions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Studios can insert own missions"
  ON missions FOR INSERT
  WITH CHECK (auth.uid() = studio_id);

CREATE POLICY "Studios can update own missions"
  ON missions FOR UPDATE
  USING (auth.uid() = studio_id);

CREATE POLICY "Studios can delete own draft missions"
  ON missions FOR DELETE
  USING (auth.uid() = studio_id AND status = 'draft');

-- ===================== APPLICATIONS =====================
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pros can view own applications"
  ON applications FOR SELECT
  USING (auth.uid() = pro_id);

CREATE POLICY "Studios can view applications for own missions"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM missions
      WHERE missions.id = applications.mission_id
      AND missions.studio_id = auth.uid()
    )
  );

CREATE POLICY "Pros can insert applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = pro_id);

CREATE POLICY "Studios can update application status for own missions"
  ON applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM missions
      WHERE missions.id = applications.mission_id
      AND missions.studio_id = auth.uid()
    )
  );

-- ===================== CONVERSATIONS =====================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- ===================== MESSAGES =====================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Participants can insert messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Participants can update read status"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
    )
  );

-- ===================== NOTIFICATIONS =====================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ===================== REVIEWS =====================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view reviews"
  ON reviews FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- ===================== SAVED ITEMS =====================
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved items"
  ON saved_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved items"
  ON saved_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved items"
  ON saved_items FOR DELETE
  USING (auth.uid() = user_id);

-- ===================== INVITATIONS =====================
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view invitations for validation"
  ON invitations FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage invitations"
  ON invitations FOR ALL
  USING (auth.jwt() ->> 'email' = current_setting('app.admin_email', true));

-- ===================== PORTFOLIO ITEMS =====================
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view portfolio items"
  ON portfolio_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Pros can insert own portfolio items"
  ON portfolio_items FOR INSERT
  WITH CHECK (auth.uid() = pro_id);

CREATE POLICY "Pros can delete own portfolio items"
  ON portfolio_items FOR DELETE
  USING (auth.uid() = pro_id);

-- ===================== STORAGE: AVATARS =====================
-- Run in Supabase Dashboard > Storage > Policies

-- CREATE POLICY "Users can upload own avatar"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- CREATE POLICY "Anyone can view avatars"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'avatars');

-- CREATE POLICY "Users can update own avatar"
--   ON storage.objects FOR UPDATE
--   USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ===================== STORAGE: MESSAGE FILES =====================
-- CREATE POLICY "Users can upload message files"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'message-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- CREATE POLICY "Authenticated can view message files"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'message-files' AND auth.role() = 'authenticated');
