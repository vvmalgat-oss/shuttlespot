-- Saved venues table
CREATE TABLE IF NOT EXISTS saved_venues (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id    INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, venue_id)
);

-- RLS
ALTER TABLE saved_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved venues"
  ON saved_venues FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
