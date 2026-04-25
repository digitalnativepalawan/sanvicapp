import { Drawer, DrawerContent, DrawerOverlay, DrawerPortal } from "@/components/ui/drawer";
import { Phone, MessageCircle, MapPin, Wifi, Waves, Snowflake, UtensilsCrossed, Compass, Car, Ship } from "lucide-react";
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

// Deterministic mock data derived from id+tag — keeps UI rich without schema changes.
const deriveDetails = (b: Business) => {
  const tag = (b.tag || "").toLowerCase();
  const beachfront = /beach|sea|ocean|front/.test(tag) || /beach/i.test(b.zone || "");
  const popular = /popular|featured/.test(tag);
  const budget = /budget|cheap/.test(tag);
  const price = budget ? "₱" : popular ? "₱₱₱" : "₱₱";

  const amenities = [
    { key: "wifi", label: "Wi-Fi", icon: Wifi, on: true },
    { key: "beach", label: "Beachfront", icon: Waves, on: beachfront },
    { key: "ac", label: "Aircon", icon: Snowflake, on: b.category === "Stay" },
    { key: "rest", label: "Restaurant", icon: UtensilsCrossed, on: b.category === "Stay" || b.category === "Eat" },
  ].filter((a) => a.on);

  const services: Record<string, string[]> = {
    Experience: ["Island hopping", "Snorkeling", "Sunset tours"],
    Travel: ["Airport transfer", "Van rentals", "Boat charter"],
    Eat: ["Dine-in", "Takeaway", "Local cuisine"],
    Stay: ["Daily housekeeping", "Tour booking", "Breakfast available"],
  };

  const rooms = b.category === "Stay" ? ["Standard double", "Family room", "Beachfront suite"] : [];

  const description =
    b.category === "Stay"
      ? `Comfortable ${beachfront ? "beachfront" : "in-town"} stay in ${b.zone || "San Vicente"}, ideal for slow island days.`
      : b.category === "Eat"
      ? `Local favorite in ${b.zone || "San Vicente"} serving fresh ${beachfront ? "seafood by the shore" : "Filipino dishes"}.`
      : b.category === "Experience"
      ? `Curated ${b.tag || "island"} experience around ${b.zone || "Palawan"} with trusted local guides.`
      : `Reliable transport service operating across ${b.zone || "San Vicente"} and nearby zones.`;

  return { beachfront, price, amenities, services: services[b.category] || [], rooms, description };
};

export const BusinessSheet = ({ business, open, onOpenChange }: Props) => {
  if (!business) return null;
  const img = business.cover_image || pickStockImage(business.category, business.id);
  const d = deriveDetails(business);

  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${business.name} ${business.zone ?? ""} San Vicente Palawan`,
  )}`;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerPortal>
        <DrawerOverlay className="bg-background/70 backdrop-blur-sm" />
        <DrawerContent className="max-h-[88vh] border-border/40 bg-background px-0">
          <div className="flex flex-col overflow-hidden">
            {/* Header image */}
            <div className="relative h-56 w-full -mt-2 overflow-hidden">
              <img src={img} alt={business.name} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <h2 className="font-display text-2xl font-bold leading-tight">{business.name}</h2>
                <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/65 mt-1">
                  {business.zone ? `${business.zone} · ` : ""}{business.category}
                </p>
              </div>
            </div>

            <div className="overflow-y-auto px-5 pt-4 pb-32 space-y-5">
              {/* Overview */}
              <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">{d.description}</p>

              {/* Key info chips */}
              <div className="flex flex-wrap gap-1.5">
                {business.tag && (
                  <span className="px-2.5 py-1 rounded-full bg-secondary text-[11px] text-foreground/80">
                    {business.tag}
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full bg-secondary text-[11px] text-foreground/80">
                  {d.price}
                </span>
                {business.season_status && (
                  <span className="px-2.5 py-1 rounded-full bg-secondary text-[11px] text-foreground/80">
                    {business.season_status}
                  </span>
                )}
              </div>

              {/* Stay-only: Rooms */}
              {business.category === "Stay" && d.rooms.length > 0 && (
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Room types
                  </h3>
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

              {/* Amenities */}
              {d.amenities.length > 0 && (
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Amenities
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {d.amenities.map((a) => (
                      <span
                        key={a.key}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-secondary text-[12px] text-foreground/85"
                      >
                        <a.icon className="h-3.5 w-3.5" />
                        {a.label}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Services / experience */}
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
                    className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary text-primary-foreground font-semibold text-[15px] active:scale-[0.98] transition"
                  >
                    <MessageCircle className="h-5 w-5" strokeWidth={2.25} />
                    WhatsApp
                  </a>
                )}
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
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
                  aria-label="Directions"
                  className="h-12 w-12 grid place-items-center rounded-full bg-secondary text-foreground active:scale-95 transition"
                >
                  <MapPin className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
};
