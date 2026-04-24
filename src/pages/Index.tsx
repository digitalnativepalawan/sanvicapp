import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FeedItem, type Business } from "@/components/FeedItem";

const CATEGORIES = ["All", "Eat", "Experience", "Stay", "Travel"] as const;
type Cat = (typeof CATEGORIES)[number];

const Index = () => {
  const [items, setItems] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Cat>("All");

  useEffect(() => {
    document.title = "San Vicente Live — Eat, Stay, Explore";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Discover restaurants, stays, tours and transport in San Vicente, Palawan. Tap to message instantly.");
  }, []);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setItems(data as Business[]);
      setLoading(false);
    })();
  }, []);

  const visible = filter === "All" ? items : items.filter((b) => b.category === filter);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Floating header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/60 border-b border-border/40">
        <div className="px-5 pt-4 pb-3">
          <h1 className="font-display text-xl font-bold tracking-tight">
            San Vicente <span className="text-accent">Live</span>
          </h1>
        </div>
        <div className="flex gap-2 px-5 pb-3 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${
                filter === c
                  ? "bg-foreground text-background"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </header>

      {/* Vertical feed */}
      <section className="flex flex-col gap-0.5 pb-10">
        {loading && (
          <div className="h-[72vh] flex items-center justify-center text-muted-foreground">
            Loading…
          </div>
        )}
        {!loading && visible.length === 0 && (
          <div className="h-[60vh] flex items-center justify-center text-muted-foreground">
            Nothing here yet.
          </div>
        )}
        {visible.map((b, i) => (
          <FeedItem
            key={b.id}
            business={b}
            priority={i === 0}
            featured={i > 0 && i % 5 === 0}
          />
        ))}
      </section>
    </main>
  );
};

export default Index;
