import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Drawer, DrawerContent, DrawerOverlay, DrawerPortal } from "@/components/ui/drawer";
import {
  Phone, MessageCircle, MapPin, Wifi, Waves, Snowflake, UtensilsCrossed, Compass, Car, Ship,
  Globe, Facebook, Instagram, Heart, Navigation, Check,
} from "lucide-react";
import { pickStockImage } from "@/lib/stockImages";
import type { Business } from "./FeedItem";

interface Props {
  business: Business | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const buildWhatsAppLink = (raw: string, name: string) => {
  const num = raw.replace(/[^\d]/g, "");
  const msg = encodeURIComponent(`Hi ${name}! I found you on San Vicente Live.`);
  return `https://wa.me/${num}?text=${msg}`;
};

const ensureUrl = (u?: string | null) => {
  if (!u) return null;
  const t = u.trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
};

const deriveDetails = (b: Business) => {
  const tag = (b.tag || "").toLowerCase();
  const beachfront = /beach|sea|ocean|front/.test(tag) || /beach/i.test(b.zone || "");
  const popular = /popular|featured/.test(tag);
  const budget = /budget|cheap/.test(tag);
  const price = budget ? "₱" : popular ? "₱₱₱" : "₱₱";

  const fallbackAmenities = [
    { key: "wifi", label: "Wi-Fi", on: true },
    { key: "beach", label: "Beachfront", on: beachfront },
    { key: "ac", label: "Aircon", on: b.category === "Stay" },
    { key: "rest", label: "Restaurant", on: b.category === "Stay" || b.category === "Eat" },
  ].filter((a) => a.on).map((a) => a.label);

  const fallbackServices: Record<string, string[]> = {
    Experience: ["Island hopping", "Snorkeling", "Sunset tours"],
    Travel: ["Airport transfer", "Van rentals", "Boat charter"],
    Eat: ["Dine-in", "Takeaway", "Local cuisine"],
    Stay: ["Daily housekeeping", "Tour booking", "Breakfast available"],
  };

  const amenities = (b.amenities && b.amenities.length ? b.amenities : fallbackAmenities);
  const services = (b.services && b.services.length ? b.services : fallbackServices[b.category] || []);
  const rooms = b.category === "Stay" ? ["Standard double", "Family room", "Beachfront suite"] : [];

  const description = b.description ||
    (b.category === "Stay"
      ? `Comfortable ${beachfront ? "beachfront" : "in-town"} stay in ${b.zone || "San Vicente"}, ideal for slow island days.`
      : b.category === "Eat"
      ? `Local favorite in ${b.zone || "San Vicente"} serving fresh ${beachfront ? "seafood by the shore" : "Filipino dishes"}.`
      : b.category === "Experience"
      ? `Curated ${b.tag || "island"} experience around ${b.zone || "Palawan"} with trusted local guides.`
      : `Reliable transport service operating across ${b.zone || "San Vicente"} and nearby zones.`);

  return { beachfront, price, amenities, services, rooms, description };
};

const amenityIcon = (label: string) => {
  const l = label.toLowerCase();
  if (/wifi|wi-fi/.test(l)) return Wifi;
  if (/beach|ocean|sea/.test(l)) return Waves;
  if (/aircon|ac\b|cool/.test(l)) return Snowflake;
  if (/restaurant|food|dining|breakfast/.test(l)) return UtensilsCrossed;
  return Compass;
};

export const BusinessSheet = ({ business, open, onOpenChange }: Props) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [selected, setSelected] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!business) return;
    try {
      const raw = localStorage.getItem("svl:saved");
      const arr: string[] = raw ? JSON.parse(raw) : [];
      setSaved(arr.includes(business.id));
    } catch {
      setSaved(false);
    }
    setScrolled(false);
  }, [business?.id]);

  const toggleSaved = () => {
    if (!business) return;
    try {
      const raw = localStorage.getItem("svl:saved");
      const arr: string[] = raw ? JSON.parse(raw) : [];
      const next = arr.includes(business.id)
        ? arr.filter((x) => x !== business.id)
        : [...arr, business.id];
      localStorage.setItem("svl:saved", JSON.stringify(next));
      setSaved(next.includes(business.id));
    } catch {}
  };

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    setSnapCount(emblaApi.scrollSnapList().length);
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", () => {
      setSnapCount(emblaApi.scrollSnapList().length);
      onSelect();
    });
    onSelect();
  }, [emblaApi, business?.id]);

  if (!business) return null;
  const fallback = pickStockImage(business.category, business.id);
  const gallery = (business.images && business.images.length
    ? business.images
    : [business.cover_image || fallback]
  ).filter(Boolean) as string[];

  const d = deriveDetails(business);
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${business.name} ${business.zone ?? ""} San Vicente Palawan`,
  )}`;

  const website = ensureUrl(business.website);
  const facebook = ensureUrl(business.facebook);
  const instagram = ensureUrl(business.instagram);

  const cats = (business.categories && business.categories.length ? business.categories : [business.category]).filter(Boolean);
  const subtitle = [business.zone, cats.join(" · ")].filter(Boolean).join(" • ");

  const hasCoords =
    typeof business.latitude === "number" && typeof business.longitude === "number";
  const mapPreviewUrl = hasCoords
    ? `https://staticmap.openstreetmap.de/staticmap.php?center=${business.latitude},${business.longitude}&zoom=15&size=600x240&markers=${business.latitude},${business.longitude},red-pushpin`
    : null;

  const detailsGrid: { label: string; value: string }[] = [];
  if (business.tag) detailsGrid.push({ label: "Type", value: business.tag });
  detailsGrid.push({ label: "Price", value: d.price });
  if (business.zone) detailsGrid.push({ label: "Area", value: business.zone });
  if (business.season_status) detailsGrid.push({ label: "Season", value: business.season_status });
  if (business.category) detailsGrid.push({ label: "Category", value: business.category });

  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerPortal>
        <DrawerOverlay className="bg-background/80 backdrop-blur-md" />
        <DrawerContent className="h-[92vh] max-h-[92vh] border-border/40 bg-background px-0 rounded-t-3xl animate-slide-in-right">
          <div
            className="relative flex flex-col h-full overflow-y-auto overflow-x-hidden overscroll-contain"
            onScroll={(e) => setScrolled((e.target as HTMLDivElement).scrollTop > 200)}
          >
            {/* Sticky header (appears on scroll) */}
            <div
              className={`sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-background/85 backdrop-blur-xl border-b border-border/40 transition-opacity duration-200 ${
                scrolled ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <h3 className="font-display text-base font-semibold truncate flex-1">{business.name}</h3>
              <button
                onClick={toggleSaved}
                aria-label="Save"
                className="h-9 w-9 grid place-items-center rounded-full bg-secondary active:scale-95 transition"
              >
                <Heart className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
              </button>
            </div>

            {/* Hero image carousel */}
            <div className="relative w-full h-[44vh] -mt-[49px] overflow-hidden bg-secondary">
              {gallery.length > 1 ? (
                <div className="embla absolute inset-0" ref={emblaRef}>
                  <div className="flex h-full">
                    {gallery.map((src, i) => (
                      <div className="relative flex-[0_0_100%] h-full" key={src + i}>
                        <img src={src} alt={`${business.name} ${i + 1}`} className="absolute inset-0 h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <img src={gallery[0]} alt={business.name} className="absolute inset-0 h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />

              {snapCount > 1 && (
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-none">
                  {Array.from({ length: snapCount }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${i === selected ? "w-5 bg-foreground" : "w-1.5 bg-foreground/50"}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 pt-5 pb-36 space-y-6">
              {/* Title */}
              <div>
                <h2 className="font-display text-2xl font-bold leading-tight">{business.name}</h2>
                <p className="text-[12px] text-muted-foreground mt-1">{subtitle}</p>
              </div>

              {/* Action buttons row */}
              <div className="grid grid-cols-4 gap-2">
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1 h-16 rounded-2xl bg-secondary active:scale-95 transition"
                >
                  <Navigation className="h-5 w-5" />
                  <span className="text-[10px] font-medium">Directions</span>
                </a>
                {business.whatsapp ? (
                  <a
                    href={buildWhatsAppLink(business.whatsapp, business.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-1 h-16 rounded-2xl bg-primary text-primary-foreground active:scale-95 transition"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-[10px] font-medium">WhatsApp</span>
                  </a>
                ) : business.phone ? (
                  <a
                    href={`tel:${business.phone}`}
                    className="flex flex-col items-center justify-center gap-1 h-16 rounded-2xl bg-primary text-primary-foreground active:scale-95 transition"
                  >
                    <Phone className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Call</span>
                  </a>
                ) : (
                  <div className="h-16 rounded-2xl bg-secondary/50 opacity-40" />
                )}
                {website ? (
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-1 h-16 rounded-2xl bg-secondary active:scale-95 transition"
                  >
                    <Globe className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Website</span>
                  </a>
                ) : business.phone && business.whatsapp ? (
                  <a
                    href={`tel:${business.phone}`}
                    className="flex flex-col items-center justify-center gap-1 h-16 rounded-2xl bg-secondary active:scale-95 transition"
                  >
                    <Phone className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Call</span>
                  </a>
                ) : (
                  <div className="h-16 rounded-2xl bg-secondary/50 opacity-40" />
                )}
                <button
                  onClick={toggleSaved}
                  className="flex flex-col items-center justify-center gap-1 h-16 rounded-2xl bg-secondary active:scale-95 transition"
                >
                  <Heart className={`h-5 w-5 ${saved ? "fill-primary text-primary" : ""}`} />
                  <span className="text-[10px] font-medium">{saved ? "Saved" : "Save"}</span>
                </button>
              </div>

              {/* Tags / amenities */}
              {d.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {d.amenities.map((a) => {
                    const Icon = amenityIcon(a);
                    return (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-[11px] text-foreground/85"
                      >
                        <Icon className="h-3 w-3" />
                        {a}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Highlights */}
              {d.services.length > 0 && (
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    {business.category === "Experience" ? "What you'll do" : business.category === "Travel" ? "Services" : "Highlights"}
                  </h3>
                  <ul className="space-y-2">
                    {d.services.map((s) => (
                      <li key={s} className="flex items-start gap-2.5 text-sm text-foreground/90">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Description */}
              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">About</h3>
                <p className="text-sm text-foreground/80 leading-relaxed line-clamp-5">{d.description}</p>
              </section>

              {/* Details grid */}
              {detailsGrid.length > 0 && (
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Details</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {detailsGrid.map((d) => (
                      <div key={d.label} className="rounded-2xl bg-secondary/60 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.label}</p>
                        <p className="text-sm text-foreground/90 mt-0.5 truncate">{d.value}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Room types (Stay only) */}
              {business.category === "Stay" && d.rooms.length > 0 && (
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Room types</h3>
                  <ul className="space-y-2">
                    {d.rooms.map((r) => (
                      <li key={r} className="flex items-center gap-2 text-sm text-foreground/85">
                        <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Image gallery grid */}
              {gallery.length > 1 && (
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Gallery</h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    {gallery.map((src, i) => (
                      <button
                        key={src + i}
                        onClick={() => setLightbox(src)}
                        className="relative aspect-square rounded-xl overflow-hidden bg-secondary active:scale-95 transition"
                      >
                        <img src={src} alt={`${business.name} photo ${i + 1}`} className="absolute inset-0 h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Map preview */}
              {hasCoords && mapPreviewUrl && (
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Location</h3>
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative rounded-2xl overflow-hidden bg-secondary active:scale-[0.99] transition"
                  >
                    <img src={mapPreviewUrl} alt="Map preview" className="w-full h-40 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{business.zone || "View on map"}</span>
                      </div>
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-foreground text-background font-semibold">Open</span>
                    </div>
                  </a>
                </section>
              )}

              {/* Social */}
              {(facebook || instagram) && (
                <section className="flex items-center gap-2">
                  {facebook && (
                    <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                      className="h-11 w-11 grid place-items-center rounded-full bg-secondary active:scale-95 transition">
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}
                  {instagram && (
                    <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                      className="h-11 w-11 grid place-items-center rounded-full bg-secondary active:scale-95 transition">
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                </section>
              )}
            </div>

            {/* Sticky bottom CTA */}
            <div className="fixed bottom-0 inset-x-0 z-30 bg-gradient-to-t from-background via-background to-background/80 px-4 pt-3 pb-5 border-t border-border/40">
              <div className="flex items-center gap-2 max-w-md mx-auto">
                {business.whatsapp ? (
                  <a
                    href={buildWhatsAppLink(business.whatsapp, business.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary text-primary-foreground font-semibold text-[15px] active:scale-[0.98] transition"
                  >
                    <MessageCircle className="h-5 w-5" strokeWidth={2.25} />
                    WhatsApp
                  </a>
                ) : business.phone ? (
                  <a
                    href={`tel:${business.phone}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary text-primary-foreground font-semibold text-[15px] active:scale-[0.98] transition"
                  >
                    <Phone className="h-5 w-5" />
                    Call
                  </a>
                ) : (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary text-primary-foreground font-semibold text-[15px] active:scale-[0.98] transition"
                  >
                    <Navigation className="h-5 w-5" />
                    Directions
                  </a>
                )}
                {business.phone && business.whatsapp && (
                  <a
                    href={`tel:${business.phone}`}
                    aria-label="Call"
                    className="h-12 w-12 grid place-items-center rounded-full bg-secondary active:scale-95 transition"
                  >
                    <Phone className="h-5 w-5" />
                  </a>
                )}
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Directions"
                  className="h-12 w-12 grid place-items-center rounded-full bg-secondary active:scale-95 transition"
                >
                  <MapPin className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Lightbox */}
            {lightbox && (
              <button
                onClick={() => setLightbox(null)}
                className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm grid place-items-center p-4 animate-fade-in"
                aria-label="Close image"
              >
                <img src={lightbox} alt="Expanded" className="max-w-full max-h-full object-contain rounded-2xl" />
              </button>
            )}
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
};
