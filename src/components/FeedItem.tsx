import { useState } from "react";
import { Phone, MessageCircle, Star, ChevronRight } from "lucide-react";
import { pickStockImage } from "@/lib/stockImages";

export interface Business {
  id: string;
  name: string;
  category: string;
  zone: string | null;
  tag: string | null;
  phone: string | null;
  whatsapp: string | null;
  season_status: string | null;
  cover_image: string | null;
}

interface Props {
  business: Business;
  priority?: boolean;
  featured?: boolean;
}

const buildWhatsAppLink = (raw: string, name: string) => {
  const num = raw.replace(/[^\d]/g, "");
  const msg = encodeURIComponent(`Hi ${name}! I found you on San Vicente Live.`);
  return `https://wa.me/${num}?text=${msg}`;
};

// Deterministic per-id variation so every item feels unique even when sharing a stock image.
const variantFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const zoom = 1 + ((h % 9) / 100); // 1.00 – 1.08
  const brightness = 0.9 + ((h >> 3) % 25) / 100; // 0.90 – 1.14
  const contrast = 0.95 + ((h >> 6) % 20) / 100; // 0.95 – 1.14
  const saturate = 0.95 + ((h >> 9) % 20) / 100;
  const positions = ["50% 50%", "50% 35%", "50% 65%", "40% 50%", "60% 50%", "45% 40%", "55% 60%"];
  const position = positions[h % positions.length];
  return { zoom, brightness, contrast, saturate, position };
};

export const FeedItem = ({ business, priority, featured }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const img = business.cover_image || pickStockImage(business.category, business.id);
  const v = variantFor(business.id);

  const baseH = featured ? "h-[78vh]" : "h-[58vh]";
  const expandedH = featured ? "h-[90vh]" : "h-[68vh]";

  return (
    <article
      onClick={() => setExpanded((v) => !v)}
      className={`relative w-full overflow-hidden cursor-pointer transition-[height] duration-500 ease-out ${
        expanded ? expandedH : baseH
      }`}
    >
      <img
        src={img}
        alt={`${business.name} — ${business.tag ?? business.category} in San Vicente`}
        loading={priority ? "eager" : "lazy"}
        width={1080}
        height={1080}
        style={{
          objectPosition: v.position,
          filter: `brightness(${v.brightness}) contrast(${v.contrast}) saturate(${v.saturate})`,
          transform: `scale(${expanded ? v.zoom + 0.04 : v.zoom})`,
        }}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out"
      />

      {/* Cinematic gradient — lighter by default, slightly stronger for featured */}
      <div className={`absolute inset-0 pointer-events-none ${featured ? "feed-overlay-strong" : "feed-overlay"}`} />

      {/* Top row */}
      <div className="absolute top-0 inset-x-0 p-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground drop-shadow-lg leading-tight">
            {business.name}
          </h2>
          {business.zone && (
            <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/65 mt-1">
              {business.zone} · {business.category}
            </p>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          {featured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-foreground/95 text-background text-[10px] font-semibold uppercase tracking-wider">
              <Star className="h-3 w-3 fill-current" />
              Featured
            </span>
          )}
          {business.season_status && (
            <span className="px-2.5 py-1 rounded-full bg-background/35 backdrop-blur-md border border-foreground/10 text-[10px] font-medium uppercase tracking-wider text-foreground/85">
              {business.season_status}
            </span>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="absolute bottom-0 inset-x-0 p-4 flex items-end justify-between gap-3">
        <div className="min-w-0 flex flex-col gap-2">
          {business.tag && (
            <span className="self-start px-2 py-0.5 rounded-full bg-background/30 backdrop-blur-md border border-foreground/10 text-[10px] font-medium tracking-wide text-foreground/80">
              {business.tag}
            </span>
          )}
          {expanded && (
            <button
              onClick={(e) => e.stopPropagation()}
              className="self-start inline-flex items-center gap-0.5 text-[11px] text-foreground/70 hover:text-foreground transition"
            >
              View details <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Call ${business.name}`}
              className="h-9 w-9 grid place-items-center rounded-full bg-background/40 backdrop-blur-md border border-foreground/15 text-foreground active:scale-95 transition"
            >
              <Phone className="h-4 w-4" />
            </a>
          )}
          {business.whatsapp && (
            <a
              href={buildWhatsAppLink(business.whatsapp, business.name)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={`WhatsApp ${business.name}`}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-[13px] active:scale-95 transition"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2.25} />
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
};