import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeedItem, type Business } from "@/components/FeedItem";
import { BusinessSheet } from "@/components/BusinessSheet";
import { EditBusinessModal } from "@/components/EditBusinessModal";
import { MapView } from "@/components/MapView";
import { AdminContext } from "@/lib/admin";
import { pickStockImage } from "@/lib/stockImages";
import { Lock, LogOut, Map as MapIcon, List, Search, X, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const CATEGORIES = ["All", "Eat", "Experience", "Stay", "Travel"] as const;
type Cat = (typeof CATEGORIES)[number];

const CATEGORY_EMOJIS: Record<Cat, string> = {
  All: "🌴",
  Eat: "🍽️",
  Experience: "🏄",
  Stay: "🏡",
  Travel: "🚤",
};

const FeedSkeleton = () => (
  <div className="flex flex-col gap-0.5">
    {([78, 58, 58] as const).map((vh, i) => (
      <div key={i} style={{ height: `${vh}vh` }} className="w-full bg-secondary animate-pulse" />
    ))}
  </div>
);

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Business[]>([]);

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
      if (!isAdmin) query = query.eq("visible", true);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (!error && data) setItems(data as Business[]);
      else if (error) console.error("Fetch error:", error);
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("view") === "map") setView("map");
    const focusId = params.get("focus");
    if (focusId && items.length) {
      const biz = items.find((b) => b.id === focusId);
      if (biz) setActive(biz);
    }
  }, [location.search, items]);

  const handleSaved = useCallback((updatedBusiness: Business) => {
    setItems(prev => prev.map(b => b.id === updatedBusiness.id ? updatedBusiness : b));
    fetchBusinesses();
  }, [fetchBusinesses]);

  const handleDeleted = useCallback((id: string) => {
    setItems(prev => prev.filter(b => b.id !== id));
    fetchBusinesses();
  }, [fetchBusinesses]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); return; }
    const q = query.toLowerCase();
    const results = items.filter(b =>
      b.name.toLowerCase().includes(q) ||
      (b.zone && b.zone.toLowerCase().includes(q)) ||
      (b.tag && b.tag.toLowerCase().includes(q)) ||
      b.category.toLowerCase().includes(q)
    );
    setSearchResults(results);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(false);
  };

  const visible = (filter === "All" ? items : items.filter((b) => b.category === filter))
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });

  return (
    <AdminContext.Provider value={isAdmin}>
      <main className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/60 border-b border-border/40">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight">
              San Vicente <span className="text-accent">Live</span>
              {isAdmin && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-semibold uppercase tracking-wider align-middle">
                  Admin
                </span>
              )}
            </h1>
            <button
              onClick={handleAdminToggle}
              aria-label={isAdmin ? "Exit admin" : "Admin login"}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary/70 text-muted-foreground hover:text-foreground text-xs font-medium transition"
            >
              {isAdmin ? <LogOut className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              {isAdmin ? "Exit" : "Admin"}
            </button>
          </div>

          {/* Category pills — horizontal scroll with emoji */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-4">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition ${
                  filter === c
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <span role="img" aria-hidden="true">{CATEGORY_EMOJIS[c]}</span>
                {c}
              </button>
            ))}
          </div>
        </header>

        {/* Search Sheet */}
        <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-background border-t border-border/40">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-left font-display text-xl">Search</SheetTitle>
            </SheetHeader>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, location, or category…"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 pr-9 py-6 bg-secondary/50 border-border rounded-xl"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <div className="overflow-y-auto h-[calc(85vh-152px)]">
              {!searchQuery && (
                <p className="text-sm text-muted-foreground text-center pt-10">
                  Start typing to search listings…
                </p>
              )}
              {searchQuery && searchResults.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                  No results for "<span className="text-foreground">{searchQuery}</span>"
                </div>
              )}
              {searchResults.map((business) => {
                const thumb = business.images?.[0] || business.cover_image || pickStockImage(business.category, business.id);
                return (
                  <button
                    key={business.id}
                    onClick={() => { setActive(business); clearSearch(); }}
                    className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 active:bg-secondary/70 transition-colors mb-1"
                  >
                    <img
                      src={thumb}
                      alt={business.name}
                      className="h-12 w-12 rounded-xl object-cover shrink-0 bg-secondary"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground truncate">{business.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {business.zone || "San Vicente"} · {business.category}
                      </p>
                      {business.tag && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-secondary text-[10px] text-muted-foreground">
                          {business.tag}
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground/40 text-lg shrink-0">›</span>
                  </button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>

        {/* Main content */}
        {view === "map" ? (
          <MapView businesses={visible} onSelect={(b) => setActive(b)} />
        ) : (
          <section className="flex flex-col gap-0.5 pb-28">
            {loading && <FeedSkeleton />}
            {!loading && visible.length === 0 && (
              <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <span className="text-4xl" role="img" aria-hidden="true">🌴</span>
                <p className="text-sm font-medium">Nothing here yet.</p>
                {filter !== "All" && (
                  <button
                    onClick={() => setFilter("All")}
                    className="text-xs text-accent underline underline-offset-2"
                  >
                    Show all listings
                  </button>
                )}
              </div>
            )}
            {!loading && visible.map((b, i) => (
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

        {/* Bottom navigation bar */}
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border/40">
          <div className="flex items-center justify-around px-2 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] max-w-md mx-auto">
            <button
              onClick={() => setView("feed")}
              className={`flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl transition-colors ${
                view === "feed" && !searchOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-5 w-5" />
              <span className="text-[10px] font-medium">Feed</span>
            </button>
            <button
              onClick={() => setView("map")}
              className={`flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl transition-colors ${
                view === "map" && !searchOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapIcon className="h-5 w-5" />
              <span className="text-[10px] font-medium">Map</span>
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className={`flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl transition-colors ${
                searchOpen ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Search className="h-5 w-5" />
              <span className="text-[10px] font-medium">Search</span>
            </button>
            <button
              onClick={() => navigate(isAdmin ? "/admin/community" : "/community")}
              className="flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users className="h-5 w-5" />
              <span className="text-[10px] font-medium">Community</span>
            </button>
          </div>
        </nav>

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
