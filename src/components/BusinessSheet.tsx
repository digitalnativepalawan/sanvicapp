import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Drawer, DrawerContent, DrawerOverlay, DrawerPortal } from "@/components/ui/drawer";
import {
  Phone, MessageCircle, MapPin, Wifi, Waves, Snowflake, UtensilsCrossed, Compass, Car, Ship,
  Globe, Facebook, Instagram,
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerPortal>
        <DrawerOverlay className="bg-background/70 backdrop-blur-sm" />
        <DrawerContent className="max-h-[88vh] border-border/40 bg-background px-0">
          <div className="flex flex-col overflow-hidden">
            {/* Header carousel */}
            <div className="relative h-56 w-full -mt-2 overflow-hidden">
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
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent pointer-events-none" />

              {snapCount > 1 && (
                <div className="absolute bottom-14 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-none">
                  {Array.from({ length: snapCount }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${i === selected ? "w-5 bg-foreground" : "w-1.5 bg-foreground/40"}`}
                    />
                  ))}
                </div>
              )}

              <div className="absolute bottom-3 left-4 right-4 pointer-events-none">
                <h2 className="font-display text-2xl font-bold leading-tight">{business.name}</h2>
                <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/65 mt-1">
                  {business.zone ? `${business.zone} · ` : ""}{cats.join(" · ")}
                </p>
              </div>
            </div>

            <div className="overflow-y-auto px-5 pt-4 pb-32 space-y-5">
              <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">{d.description}</p>

              {/* Amenities chips */}
              {d.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-[64px] overflow-hidden">
                  {d.amenities.map((a) => {
                    const Icon = amenityIcon(a);
                    return (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-[11px] text-foreground/85"
                      >
                        <Icon className="h-3 w-3" />
                        {a}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Key info chips */}
              <div className="flex flex-wrap gap-1.5">
                {business.tag && (
                  <span className="px-2.5 py-1 rounded-full bg-secondary text-[11px] text-foreground/80">
                    {business.tag}
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full bg-secondary text-[11px] text-foreground/80">{d.price}</span>
                {business.season_status && (
                  <span className="px-2.5 py-1 rounded-full bg-secondary text-[11px] text-foreground/80">
                    {business.season_status}
                  </span>
                )}
              </div>

              {business.category === "Stay" && d.rooms.length > 0 && (
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Room types</h3>
                  <ul className="text-sm text-foreground/85 space-y-1">
                    {d.rooms.map((r) => (
                      <li key={r} className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-foreground/40" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {d.services.length > 0 && (
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {business.category === "Experience" ? "What you'll do" : business.category === "Travel" ? "Services" : "Highlights"}
                  </h3>
                  <ul className="text-sm text-foreground/85 space-y-1">
                    {d.services.map((s) => {
                      const Icon = business.category === "Travel" ? Car : business.category === "Experience" ? Ship : Compass;
                      return (
                        <li key={s} className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-foreground/60" />
                          {s}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </div>

            {/* Sticky actions */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background via-background to-background/90 px-4 pt-3 pb-5 border-t border-border/40">
              <div className="flex items-center gap-2">
                {business.whatsapp && (
                  <a
                    href={buildWhatsAppLink(business.whatsapp, business.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary text-primary-foreground font-semibold text-[15px] active:scale-[0.98] transition"
                  >
                    <MessageCircle className="h-5 w-5" strokeWidth={2.25} />
                    WhatsApp
                  </a>
                )}
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Call"
                    className="h-12 w-12 grid place-items-center rounded-full bg-secondary text-foreground active:scale-95 transition"
                  >
                    <Phone className="h-5 w-5" />
                  </a>
                )}
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Directions"
                  className="h-12 w-12 grid place-items-center rounded-full bg-secondary text-foreground active:scale-95 transition"
                >
                  <MapPin className="h-5 w-5" />
                </a>
                {website && (
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Website"
                    className="h-12 w-12 grid place-items-center rounded-full bg-secondary text-foreground active:scale-95 transition"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
                {facebook && (
                  <a
                    href={facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Facebook"
                    className="h-12 w-12 grid place-items-center rounded-full bg-secondary text-foreground active:scale-95 transition"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {instagram && (
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Instagram"
                    className="h-12 w-12 grid place-items-center rounded-full bg-secondary text-foreground active:scale-95 transition"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
};
