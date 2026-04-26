
-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  pebbles_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile + handle updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Community posts (reviews/photos)
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  post_type TEXT NOT NULL DEFAULT 'review',
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved posts viewable by everyone" ON public.community_posts FOR SELECT USING (status = 'approved');
CREATE POLICY "Users view own posts" ON public.community_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can update posts" ON public.community_posts FOR UPDATE USING (true);
CREATE POLICY "Admin can delete posts" ON public.community_posts FOR DELETE USING (true);

-- Blog stories
CREATE TABLE public.blog_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  excerpt TEXT,
  content TEXT,
  cover_image TEXT,
  author TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.blog_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published stories viewable by everyone" ON public.blog_stories FOR SELECT USING (published = true);
CREATE POLICY "Admin can manage stories insert" ON public.blog_stories FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can manage stories update" ON public.blog_stories FOR UPDATE USING (true);
CREATE POLICY "Admin can manage stories delete" ON public.blog_stories FOR DELETE USING (true);

CREATE TRIGGER blog_stories_updated BEFORE UPDATE ON public.blog_stories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- QR codes
CREATE TABLE public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  reward_pebbles INTEGER NOT NULL DEFAULT 50,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "QR codes viewable by everyone" ON public.qr_codes FOR SELECT USING (true);
CREATE POLICY "Admin manage qr insert" ON public.qr_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage qr update" ON public.qr_codes FOR UPDATE USING (true);
CREATE POLICY "Admin manage qr delete" ON public.qr_codes FOR DELETE USING (true);

-- QR scans
CREATE TABLE public.qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qr_code_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  pebbles_awarded INTEGER NOT NULL DEFAULT 0,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own scans" ON public.qr_scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own scans" ON public.qr_scans FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Pebbles transactions
CREATE TABLE public.pebbles_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pebbles_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions" ON public.pebbles_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own transactions" ON public.pebbles_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can insert transactions" ON public.pebbles_transactions FOR INSERT WITH CHECK (true);

-- Challenges
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL DEFAULT 'daily',
  reward_pebbles INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenges viewable by everyone" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Admin challenges insert" ON public.challenges FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin challenges update" ON public.challenges FOR UPDATE USING (true);
CREATE POLICY "Admin challenges delete" ON public.challenges FOR DELETE USING (true);

-- User challenges
CREATE TABLE public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own challenge progress" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own challenge progress insert" ON public.user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own challenge progress update" ON public.user_challenges FOR UPDATE USING (auth.uid() = user_id);

-- User badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges viewable by everyone" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Users earn own badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Game spins
CREATE TABLE public.game_spins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pebbles_won INTEGER NOT NULL DEFAULT 0,
  spun_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.game_spins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own spins" ON public.game_spins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own spins" ON public.game_spins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trivia questions
CREATE TABLE public.trivia_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  reward_pebbles INTEGER NOT NULL DEFAULT 25,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trivia_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trivia viewable by everyone" ON public.trivia_questions FOR SELECT USING (active = true);
CREATE POLICY "Admin trivia insert" ON public.trivia_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin trivia update" ON public.trivia_questions FOR UPDATE USING (true);
CREATE POLICY "Admin trivia delete" ON public.trivia_questions FOR DELETE USING (true);

-- Helper: update pebbles balance from transaction
CREATE OR REPLACE FUNCTION public.apply_pebbles_transaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET pebbles_balance = pebbles_balance + NEW.amount WHERE user_id = NEW.user_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER pebbles_after_insert AFTER INSERT ON public.pebbles_transactions
FOR EACH ROW EXECUTE FUNCTION public.apply_pebbles_transaction();

-- Indexes
CREATE INDEX idx_posts_status ON public.community_posts(status);
CREATE INDEX idx_posts_business ON public.community_posts(business_id);
CREATE INDEX idx_scans_user ON public.qr_scans(user_id);
CREATE INDEX idx_tx_user ON public.pebbles_transactions(user_id);
CREATE INDEX idx_profiles_balance ON public.profiles(pebbles_balance DESC);
