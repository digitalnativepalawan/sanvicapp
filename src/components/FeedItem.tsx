import { useState } from "react";
import { Phone, MessageCircle } from "lucide-react";
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
}

const buildWhatsAppLink = (raw: string, name: string) => {
  const num = raw.replace(/[^\d]/g, "");
  const msg = encodeURIComponent(`Hi ${name}! I found you on San Vicente Live.`);
  return `https://wa.me/${num}?text=${msg}`;
};

export const FeedItem = ({ business, priority }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const img = business.cover_image || pickStockImage(business.category, business.id);

  return (
    <article
      onClick={() => setExpanded((v) => !v)}
      className={`relative w-full overflow-hidden cursor-pointer transition-all duration-500 ease-out ${
        expanded ? "h-[88vh]" : "h-[72vh]"
      }`}
    >
      <img
        src={img}
        alt={`${business.name} — ${business.tag ?? business.category} in San Vicente`}
        loading={priority ? "eager" : "lazy"}
        width={1080}
        height={1080}
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out ${
          expanded ? "scale-105" : "scale-100"
        }`}
      />

      {/* Cinematic gradient */}
      <div className="absolute inset-0 feed-overlay pointer-events-none" />

      {/* Top row */}
      <div className="absolute top-0 inset-x-0 p-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground drop-shadow-lg leading-tight">
            {business.name}
          </h2>
          {business.zone && (
            <p className="text-xs uppercase tracking-[0.18em] text-foreground/70 mt-1">
              {business.zone} · {business.category}
            </p>
          )}
        </div>
        {business.season_status && (
          <span className="shrink-0 px-3 py-1 rounded-full bg-background/40 backdrop-blur-md border border-foreground/15 text-[11px] font-semibold uppercase tracking-wider text-foreground">
            {business.season_status}
          </span>
        )}
      </div>

      {/* Bottom row */}
      <div className="absolute bottom-0 inset-x-0 p-5 flex items-end justify-between gap-3">
        {business.tag && (
          <span className="px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold tracking-wide shadow-lg">
            {business.tag}
          </span>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Call ${business.name}`}
              className="h-11 w-11 grid place-items-center rounded-full bg-background/40 backdrop-blur-md border border-foreground/20 text-foreground active:scale-95 transition"
            >
              <Phone className="h-5 w-5" />
            </a>
          )}
          {business.whatsapp && (
            <a
              href={buildWhatsAppLink(business.whatsapp, business.name)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={`WhatsApp ${business.name}`}
              className="h-11 px-5 grid place-items-center rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-[var(--shadow-glow)] active:scale-95 transition flex-row gap-2"
              style={{ display: "inline-flex" }}
            >
              <MessageCircle className="h-5 w-5" />
              <span>Message</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
};