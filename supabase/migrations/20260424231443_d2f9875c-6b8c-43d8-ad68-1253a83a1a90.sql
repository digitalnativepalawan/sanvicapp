
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  zone TEXT,
  tag TEXT,
  phone TEXT,
  whatsapp TEXT,
  season_status TEXT,
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses are viewable by everyone"
ON public.businesses FOR SELECT
USING (true);

INSERT INTO public.businesses (name, category, zone, tag, phone, whatsapp, season_status) VALUES
('Sunset Grill', 'Eat', 'Long Beach', 'Fresh Seafood', '+639171234567', '+639171234567', 'Open'),
('Bamboo Bar', 'Eat', 'Poblacion', 'Cocktails & Bites', '+639181234567', '+639181234567', 'Open'),
('Tropic Kitchen', 'Eat', 'New Agutaya', 'Filipino BBQ', '+639191234567', '+639191234567', 'Open'),
('Island Hop Co.', 'Experience', 'Port Barton', 'Day Tours', '+639201234567', '+639201234567', 'Peak Season'),
('Reef Snorkel Tours', 'Experience', 'Long Beach', 'Snorkeling', '+639211234567', '+639211234567', 'Open'),
('Hidden Coves Boat', 'Experience', 'Port Barton', 'Private Boat', '+639221234567', '+639221234567', 'Open'),
('Bamboo Beach Hut', 'Stay', 'Long Beach', 'Beachfront', '+639231234567', '+639231234567', 'Open'),
('Eco Villa Retreat', 'Stay', 'New Agutaya', 'Eco Resort', '+639241234567', '+639241234567', 'Peak Season'),
('Island Room Stay', 'Stay', 'Port Barton', 'Budget Friendly', '+639251234567', '+639251234567', 'Open'),
('Coastal Vans', 'Travel', 'Poblacion', 'Van Transfer', '+639261234567', '+639261234567', 'Open'),
('Boat Transfers PH', 'Travel', 'Port Barton', 'Boat Transfer', '+639271234567', '+639271234567', 'Open'),
('Palawan Road Trips', 'Travel', 'Poblacion', 'Private Driver', '+639281234567', '+639281234567', 'Open');
