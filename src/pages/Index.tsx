import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeedItem, type Business } from "@/components/FeedItem";
import { BusinessSheet } from "@/components/BusinessSheet";
import { EditBusinessModal } from "@/components/EditBusinessModal";
import { AdminContext } from "@/lib/admin";
import { Lock, LogOut } from "lucide-react";

const CATEGORIES = ["All", "Eat", "Experience", "Stay", "Travel"] as const;
type Cat = (typeof CATEGORIES)[number];

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith("/admin");
  const [items, setItems] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Cat>("All");
  const [active, setActive] = useState<Business | null>(null);
  const [editing, setEditing] = useState<Business | null>(null);

  const handleAdminToggle = () => {
    if (isAdmin) {
      navigate("/");
      return;
    }
    const code = window.prompt("Enter admin passkey");
    if (code === null) return;
    if (code.trim() === "5309") {
      navigate("/admin");
    } else {
      window.alert("Incorrect passkey");
    }
  };

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
    <AdminContext.Provider value={isAdmin}>
    <main className="min-h-screen bg-background text-foreground">
      {/* Floating header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/60 border-b border-border/40">
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-xl font-bold tracking-tight">
              San Vicente <span className="text-accent">Live</span>
              {isAdmin && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-semibold uppercase tracking-wider align-middle">
                  Admin
                </span>
              )}
            </h1>
            <button
              onClick={handleAdminToggle}
              aria-label={isAdmin ? "Exit admin mode" : "Enter admin mode"}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/70 text-muted-foreground hover:text-foreground text-xs font-medium transition"
            >
              {isAdmin ? <LogOut className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              {isAdmin ? "Exit" : "Admin"}
            </button>
          </div>
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
            onOpen={(biz) => setActive(biz)}
            onEdit={(biz) => setEditing(biz)}
          />
        ))}
      </section>

      <BusinessSheet
        business={active}
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
      />
      <EditBusinessModal
        business={editing}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        onSaved={(b) => setItems((arr) => arr.map((x) => (x.id === b.id ? b : x)))}
      />
    </main>
    </AdminContext.Provider>
  );
};

export default Index;
