ALTER TABLE images
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_images_one_primary_per_listing
  ON images (listing_id)
  WHERE is_primary = TRUE;
