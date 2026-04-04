-- venue_reviews table
CREATE TABLE IF NOT EXISTS venue_reviews (
  id             SERIAL PRIMARY KEY,
  venue_id       INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  reviewer_name  TEXT    NOT NULL,
  email          TEXT    NOT NULL,
  rating         SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT    DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- One review per email per venue
CREATE UNIQUE INDEX IF NOT EXISTS uq_venue_reviews_venue_email
  ON venue_reviews (venue_id, lower(email));

CREATE INDEX IF NOT EXISTS idx_venue_reviews_venue_id ON venue_reviews(venue_id);

-- RLS
ALTER TABLE venue_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read reviews"
  ON venue_reviews FOR SELECT USING (true);

CREATE POLICY "Public insert reviews"
  ON venue_reviews FOR INSERT WITH CHECK (true);

-- Per-venue rating stats view
CREATE OR REPLACE VIEW venue_rating_stats AS
  SELECT
    venue_id,
    ROUND(AVG(rating)::numeric, 1)::float AS avg_rating,
    COUNT(*)::integer                      AS review_count
  FROM venue_reviews
  GROUP BY venue_id;
