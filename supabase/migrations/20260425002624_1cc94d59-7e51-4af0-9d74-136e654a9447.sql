ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS description text;

CREATE INDEX IF NOT EXISTS idx_businesses_featured ON public.businesses(featured);
CREATE INDEX IF NOT EXISTS idx_businesses_coords ON public.businesses(latitude, longitude);