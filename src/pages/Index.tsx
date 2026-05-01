import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FeedItem, type Business } from "@/components/FeedItem";
import { BusinessSheet } from "@/components/BusinessSheet";
import { EditBusinessModal } from "@/components/EditBusinessModal";
import { MapView } from "@/components/MapView";
import { AdminContext } from "@/lib/admin";
import { Lock, LogOut, Map as MapIcon, List, Search, X, Users, RefreshCw } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const perPage = 20;
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const initialLoadDoneRef = useRef(false);
  const [filter, setFilter] = useState<Cat>("All");
  const [active, setActive] = useState<Business | null>(null);
  const [editing, setEditing] = useState<Business | null>(null);

  // Reset pagination when filter changes
  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [filter]);
  const [view, setView] = useState<"feed" | "map">("feed");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [searchCategory, setSearchCategory] = useState<string>("All");
  
  // Pull-to-refresh state
  const pullDistanceRef = useRef(0);
  const isPullingRef = useRef(false);
  const touchStartYRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [pullProgress, setPullProgress] = useState(0);
  const [canRefresh, setCanRefresh] = useState(false);

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
    setError(null);
    try {
      // Get total count for pagination awareness
      const { count } = await supabase
        .from("businesses")
        .select("*", { count: "exact", head: true });

      if (count !== null) {
        setTotalCount(count);
        setHasMore(page * perPage < count);
      }

      let query = supabase
        .from("businesses")
        .select("*")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1);

      if (!isAdmin) {
        query = query.eq("visible", true);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Fetch error:", error);
        setError("Failed to load listings. Please check your connection and try again.");
        return;
      }
      
      if (data) {
        if (page === 1) {
          setItems(data as Business[]);
        } else {
          setItems((prev) => [...prev, ...(data as Business[])]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page]);

  useEffect(() => {
    document.title = "San Vicente Live — Eat, Stay, Explore";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Discover restaurants, stays, tours and transport in San Vicente, Palawan. Tap to message instantly.");
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses, isAdmin]);

  // Handle deep links like /?view=map&focus=<id>
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("view") === "map") setView("map");
    const focusId = params.get("focus");
    if (focusId && items.length) {
      const biz = items.find((b) => b.id === focusId);
      if (biz) setActive(biz);
    }
  }, [location.search, items]);

  // Infinite scroll: Load more when sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading]);

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
    
    // If both query empty and category is All, clear results
    if (!query.trim() && searchCategory === "All") {
      setSearchResults([]);
      return;
    }
    
    const results = items.filter(business => {
      const matchesText = !query.trim() ||
        business.name.toLowerCase().includes(query.toLowerCase()) ||
        (business.zone && business.zone.toLowerCase().includes(query.toLowerCase())) ||
        (business.tag && business.tag.toLowerCase().includes(query.toLowerCase())) ||
        business.category.toLowerCase().includes(query.toLowerCase());
      
      const matchesCategory = searchCategory === "All" || business.category === searchCategory;
      
      return matchesText && matchesCategory;
    });
    
    setSearchResults(results);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchCategory("All");
    setSearchOpen(false);
  };

  // Pull-to-refresh handlers
  const PULL_THRESHOLD = 80; // pixels to trigger refresh
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current) return;
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - touchStartYRef.current);
    pullDistanceRef.current = distance;
    const progress = Math.min(distance / PULL_THRESHOLD, 1);
    setPullProgress(progress);
    setCanRefresh(distance >= PULL_THRESHOLD);
  };
  
  const handleTouchEnd = async () => {
    isPullingRef.current = false;
    if (canRefresh) {
      await fetchBusinesses();
    }
    setPullProgress(0);
    setCanRefresh(false);
    pullDistanceRef.current = 0;
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
            
            {/* Category filter chips for search */}
            <div className="mb-4 -mx-5 px-5">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSearchCategory(c)}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                      searchCategory === c
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
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
          <MapView businesses={visible} selectedId={active?.id || null} onSelect={(b) => setActive(b)} />
        ) : (
          <section 
            className="flex flex-col gap-0.5 pb-10"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Pull-to-refresh indicator */}
            {pullProgress > 0 && (
              <div 
                className="flex items-center justify-center gap-2 py-3 text-sm transition-opacity"
                style={{ 
                  opacity: pullProgress,
                  transform: `translateY(${pullProgress * 10}px)`
                }}
              >
                <RefreshCw 
                  className={`h-5 w-5 text-accent transition-transform ${canRefresh ? 'rotate-180' : ''}`}
                  style={{ transform: canRefresh ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
                <span className="text-muted-foreground font-medium">
                  {canRefresh ? "Release to refresh" : "Pull to refresh"}
                </span>
              </div>
            )}
            {loading && (
              <div className="flex flex-col gap-0.5">
                {/* 3 skeleton cards matching FeedItem aspect ratios */}
                {[0, 1, 2].map((i) => (
                  <div key={i} className="relative w-full overflow-hidden bg-secondary animate-pulse">
                    {/* Skeleton image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary via-muted to-secondary opacity-30" />
                    {/* Skeleton text overlay */}
                    <div className="absolute top-0 inset-x-0 p-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="h-6 bg-muted/50 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-muted/30 rounded w-1/2" />
                      </div>
                    </div>
                    {/* Bottom placeholder bar */}
                    <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-background/90 via-background/60 to-transparent" />
                  </div>
                ))}
              </div>
            )}
            {!loading && error && (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 rounded-full bg-destructive/10 grid place-items-center mb-4">
                  <X className="h-7 w-7 text-destructive" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1.5">Something went wrong</h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-xs">{error}</p>
                <Button onClick={fetchBusinesses} className="gap-2">
                  Try again
                </Button>
              </div>
            )}
            {!loading && visible.length === 0 && !error && (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 rounded-full bg-secondary/50 grid place-items-center mb-4">
                  <Search className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1.5">No listings found</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {filter !== "All"
                    ? `No ${filter.toLowerCase()} businesses in this area yet.`
                    : "No businesses have been added yet."}
                </p>
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
              )}
            )}
            {/* Infinite scroll sentinel */}
            {hasMore && !loading && (
              <div ref={sentinelRef} className="h-4" aria-hidden="true" />
            )}
            {loading && page > 1 && (
              <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading more…</span>
              </div>
            )}
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
