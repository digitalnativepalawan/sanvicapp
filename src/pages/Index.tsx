import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeedItem, type Business } from "@/components/FeedItem";
import { BusinessSheet } from "@/components/BusinessSheet";
import { EditBusinessModal } from "@/components/EditBusinessModal";
import { MapView } from "@/components/MapView";
import { AdminContext } from "@/lib/admin";
import { Lock, LogOut, Map as MapIcon, List } from "lucide-react";

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
  const [view, setView] = useState<"feed" | "map">("feed");

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

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from("businesses").select("*");
      
      if (!isAdmin) {
        query = query.eq("visible", true);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (!error && data) {
        setItems(data as Business[]);
      } else if (error) {
        console.error("Fetch error:", error);
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    document.title = "San Vicente Live — Eat, Stay, Explore";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Discover restaurants, stays, tours and transport in San Vicente, Palawan. Tap to message instantly.");
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses, isAdmin]);

  const handleSaved = useCallback((updatedBusiness: Business) => {
    setItems(prev => prev.map(b => b.id === updatedBusiness.id ? updatedBusiness : b));
    fetchBusinesses();
  }, [fetchBusinesses]);

  const handleDeleted = useCallback((id: string) => {
    setItems(prev => prev.filter(b => b.id !== id));
    fetchBusinesses();
  }, [fetchBusinesses]);

  // Sort: Featured items first, then by creation date (newest first)
  const visible = (filter === "All" ? items : items.filter((b) => b.category === filter))
    .sort((a, b) => {
      // Featured items come first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      // If both featured or both not featured, keep original order (newest first)
      return 0;
    });

  return (
    <AdminContext.Provider value={isAdmin}>
      <main className="min-h-screen bg-background text-foreground">
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView((v) => (v === "feed" ? "map" : "feed"))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/70 text-muted-foreground hover:text-foreground text-xs font-medium transition"
                >
                  {view === "feed" ? <MapIcon className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
                  {view === "feed" ? "Map" : "Feed"}
                </button>
                <button
                  onClick={handleAdminToggle}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/70 text-muted-foreground hover:text-foreground text-xs font-medium transition"
                >
                  {isAdmin ? <LogOut className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  {isAdmin ? "Exit" : "Admin"}
                </button>
              </div>
            </div>
          </div>

          <div className="px-5 pb-4">
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition text-center ${
                    filter === c
                      ? "bg-foreground text-background"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </header>

        {view === "map" ? (
          <MapView businesses={visible} onSelect={(b) => setActive(b)} />
        ) : (
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
                featured={b.featured}
                onOpen={(biz) => setActive(biz)}
                onEdit={(biz) => setEditing(biz)}
              />
            ))}
          </section>
        )}

        <BusinessSheet
          business={active}
          open={!!active}
          onOpenChange={(o) => !o && setActive(null)}
        />
        <EditBusinessModal
          business={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          onSaved={handleSaved}
          onDelete={handleDeleted}
        />
      </main>
    </AdminContext.Provider>
  );
};

export default Index;
