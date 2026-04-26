import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Trophy, Target, BookOpen, Gamepad2, LogOut, QrCode } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { QrScannerSheet } from "@/components/QrScannerSheet";

type Challenge = { id: string; title: string; description: string | null; reward_pebbles: number };
type Story = { id: string; title: string; excerpt: string | null; cover_image: string | null; slug: string | null };
type LeaderRow = { user_id: string; display_name: string | null; avatar_url: string | null; pebbles_balance: number };
type FeedRow = {
  id: string;
  content: string | null;
  rating: number | null;
  image_url: string | null;
  created_at: string;
  user_id: string;
};

const Community = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [feed, setFeed] = useState<FeedRow[]>([]);
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    document.title = "Community — San Vicente Live";
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: ch }, { data: st }, { data: posts }, { data: top }] = await Promise.all([
        supabase.from("challenges").select("*").eq("active", true).eq("challenge_type", "daily").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("blog_stories").select("id,title,excerpt,cover_image,slug").eq("published", true).eq("featured", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("community_posts").select("id,content,rating,image_url,created_at,user_id").eq("status", "approved").order("created_at", { ascending: false }).limit(10),
        supabase.from("profiles").select("user_id,display_name,avatar_url,pebbles_balance").order("pebbles_balance", { ascending: false }).limit(3),
      ]);
      setChallenge(ch as Challenge | null);
      setStory(st as Story | null);
      setFeed((posts as FeedRow[]) ?? []);
      setLeaders((top as LeaderRow[]) ?? []);
    })();
  }, [user]);

  if (loading || !user) {
    return <main className="min-h-screen bg-background p-5"><Skeleton className="h-32 w-full" /></main>;
  }

  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/60 border-b border-border/40 px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <h1 className="font-display text-lg font-bold">Community</h1>
          <button onClick={signOut} aria-label="Sign out" className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <section className="px-5 pt-5">
        <Card className="relative overflow-hidden p-5 bg-gradient-to-br from-accent/20 via-accent/5 to-transparent border-accent/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Your pebbles</p>
              <p className="font-display text-4xl font-bold mt-1 flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-accent" />
                {profile?.pebbles_balance ?? 0}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{profile?.display_name ?? "Explorer"}</p>
              <p className="text-xs text-muted-foreground">Level {Math.floor((profile?.pebbles_balance ?? 0) / 500) + 1}</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="px-5 mt-4 grid grid-cols-4 gap-2">
        <Link to="/community/games"><Button variant="outline" className="w-full h-16 rounded-xl flex-col gap-1"><Gamepad2 className="h-4 w-4" /><span className="text-[10px]">Games</span></Button></Link>
        <Link to="/community/leaderboard"><Button variant="outline" className="w-full h-16 rounded-xl flex-col gap-1"><Trophy className="h-4 w-4" /><span className="text-[10px]">Ranks</span></Button></Link>
        <Link to="/community/blog"><Button variant="outline" className="w-full h-16 rounded-xl flex-col gap-1"><BookOpen className="h-4 w-4" /><span className="text-[10px]">Blog</span></Button></Link>
        <Button variant="outline" className="w-full h-16 rounded-xl flex-col gap-1" onClick={() => setScannerOpen(true)}>
          <QrCode className="h-4 w-4" />
          <span className="text-[10px]">Scan</span>
        </Button>
      </section>

      <QrScannerSheet
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onPebblesAwarded={refreshProfile}
      />

      {challenge && (
        <section className="px-5 mt-5">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Today's challenge</h2>
          <Card className="p-4 border-border/60">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-accent/15 p-2"><Target className="h-5 w-5 text-accent" /></div>
              <div className="flex-1">
                <p className="font-semibold">{challenge.title}</p>
                {challenge.description && <p className="text-sm text-muted-foreground mt-0.5">{challenge.description}</p>}
                <p className="text-xs text-accent font-medium mt-2">+{challenge.reward_pebbles} pebbles</p>
              </div>
            </div>
          </Card>
        </section>
      )}

      {story && (
        <section className="px-5 mt-5">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Featured story</h2>
          <Link to="/community/blog">
            <Card className="overflow-hidden border-border/60">
              {story.cover_image && <img src={story.cover_image} alt={story.title} className="w-full h-40 object-cover" loading="lazy" />}
              <div className="p-4">
                <p className="font-display font-semibold text-lg leading-tight">{story.title}</p>
                {story.excerpt && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{story.excerpt}</p>}
              </div>
            </Card>
          </Link>
        </section>
      )}

      <section className="px-5 mt-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Top explorers</h2>
          <Link to="/community/leaderboard" className="text-xs text-accent">See all</Link>
        </div>
        <Card className="p-3 border-border/60 divide-y divide-border/40">
          {leaders.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No rankings yet.</p>}
          {leaders.map((l, i) => (
            <div key={l.user_id} className="flex items-center gap-3 py-2">
              <span className="text-lg w-6 text-center">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{l.display_name ?? "Anonymous"}</p>
              </div>
              <p className="text-sm text-accent font-semibold">{l.pebbles_balance}</p>
            </div>
          ))}
        </Card>
      </section>

      <section className="px-5 mt-5">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Recent activity</h2>
        {feed.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No activity yet — be the first!</p>}
        <div className="space-y-2">
          {feed.map((p) => (
            <Card key={p.id} className="p-3 border-border/60">
              {p.rating && <p className="text-sm">{"★".repeat(p.rating)}{"☆".repeat(5 - p.rating)}</p>}
              {p.content && <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{p.content}</p>}
              {p.image_url && <img src={p.image_url} alt="" className="mt-2 w-full h-32 rounded-lg object-cover" loading="lazy" />}
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Community;