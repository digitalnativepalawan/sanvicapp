import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeedItem, type Business } from "@/components/FeedItem";
import { BusinessSheet } from "@/components/BusinessSheet";
import { EditBusinessModal } from "@/components/EditBusinessModal";
import { MapView } from "@/components/MapView";
import { AdminContext } from "@/lib/admin";
import { Lock, LogOut, Map as MapIcon, List, Search, X, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const results = items.filter(business => {
      const searchLower = query.toLowerCase();
      return (
        business.name.toLowerCase().includes(searchLower) ||
        (business.zone && business.zone.toLowerCase().includes(searchLower)) ||
        (business.tag && business.tag.toLowerCase().includes(searchLower)) ||
        business.category.toLowerCase().includes(searchLower)
      );
    });
    setSearchResults(results);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(false);
  };

  // Sort: Featured items first
  const visible = (filter === "All" ? items : items.filter((b) => b.category === filter))
    .sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });

  return (
    <AdminContext.Provider value={isAdmin}>
      <main className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/60 border-b border-border/40">
          <div className="px-4 sm:px-5 pt-4 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight">
                San Vicente <span className="text-accent">Live</span>
                {isAdmin && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-semibold uppercase tracking-wider align-middle">
                    Admin
                  </span>
                )}
              </h1>
              <div className="flex flex-wrap items-center justify-end gap-1.5 w-full sm:w-auto">
                {/* Search Button */}
                <button
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary/70 text-muted-foreground hover:text-foreground text-xs font-medium transition whitespace-nowrap"
                >
                  <Search className="h-3.5 w-3.5" />
                  Search
                </button>
                <button
                  onClick={() => setView((v) => (v === "feed" ? "map" : "feed"))}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary/70 text-muted-foreground hover:text-foreground text-xs font-medium transition whitespace-nowrap"
                >
                  {view === "feed" ? <MapIcon className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
                  {view === "feed" ? "Map" : "Feed"}
                </button>
                <button
                  onClick={() => navigate(isAdmin ? "/admin/community" : "/community")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-accent/15 text-accent hover:bg-accent/25 text-xs font-medium transition whitespace-nowrap"
                >
                  <Users className="h-3.5 w-3.5" />
                  Community
                </button>
                <button
                  onClick={handleAdminToggle}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary/70 text-muted-foreground hover:text-foreground text-xs font-medium transition whitespace-nowrap"
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

        {/* Search Sheet */}
        <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-background border-t border-border/40">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-left font-display text-xl">Search</SheetTitle>
            </SheetHeader>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, location, or category..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 pr-9 py-6 bg-secondary/50 border-border rounded-xl"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            
            <div className="overflow-y-auto h-[calc(85vh-140px)]">
              {searchQuery && searchResults.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                  No results found for "{searchQuery}"
                </div>
              )}
              
              {searchResults.map((business) => (
                <button
                  key={business.id}
                  onClick={() => {
                    setActive(business);
                    setSearchOpen(false);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="w-full text-left p-3 rounded-xl hover:bg-secondary/50 transition-colors mb-2"
                >
                  <h3 className="font-semibold text-foreground">{business.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {business.zone || "San Vicente"} · {business.category}
                  </p>
                  {business.tag && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-secondary text-[10px] text-muted-foreground">
                      {business.tag}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>

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
