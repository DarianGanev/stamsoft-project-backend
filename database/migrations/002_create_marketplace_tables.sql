DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
    CREATE TYPE listing_status AS ENUM ('draft', 'published', 'sold', 'archived');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_id, name),
  UNIQUE (id, brand_id)
);

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands (id) ON DELETE RESTRICT,
  model_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  year SMALLINT CHECK (year IS NULL OR year BETWEEN 1886 AND 2100),
  mileage_km INTEGER CHECK (mileage_km IS NULL OR mileage_km >= 0),
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'BGN',
  status listing_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (model_id, brand_id) REFERENCES models (id, brand_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_models_brand_id ON models (brand_id);
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings (user_id);
CREATE INDEX IF NOT EXISTS idx_listings_brand_id ON listings (brand_id);
CREATE INDEX IF NOT EXISTS idx_listings_model_id ON listings (model_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings (status);
CREATE INDEX IF NOT EXISTS idx_images_listing_id ON images (listing_id);
