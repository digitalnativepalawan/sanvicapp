import { Phone, MessageCircle, Star, Pencil } from "lucide-react";
import { pickStockImage } from "@/lib/stockImages";
import { useAdmin } from "@/lib/admin";

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
  images?: string[] | null;
  latitude?: number | null;
  longitude?: number | null;
  featured?: boolean;
  visible?: boolean; // Added visible property
  description?: string | null;
  amenities?: string[] | null;
  services?: string[] | null;
  categories?: string[] | null;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
}

interface Props {
  business: Business;
  priority?: boolean;
  featured?: boolean;
  onOpen?: (b: Business) => void;
  onEdit?: (b: Business) => void;
}

const buildWhatsAppLink = (raw: string, name: string) => {
  const num = raw.replace(/[^\d]/g, "");
  const msg = encodeURIComponent(`Hi ${name}! I found you on San Vicente Live.`);
  return `https://wa.me/${num}?text=${msg}`;
};


export const FeedItem = ({ business, priority, featured, onOpen, onEdit }: Props) => {
  const admin = useAdmin();
  const img =
    (business.images && business.images[0]) ||
    business.cover_image ||
    pickStockImage(business.category, business.id);
  const baseH = featured ? "h-[78vh]" : "h-[58vh]";
  const tagLower = (business.tag || "").toLowerCase();
  const price = /budget|cheap/.test(tagLower) ? "₱" : /popular|featured|premium/.test(tagLower) ? "₱₱₱" : "₱₱";

  return (
    <article
      onClick={() => onOpen?.(business)}
      className={`relative w-full overflow-hidden cursor-pointer active:scale-[0.995] transition-transform duration-300 ${baseH}`}
    >
      <img
        src={img}
        alt={`${business.name} — ${business.tag ?? business.category} in San Vicente`}
        loading={priority ? "eager" : "lazy"}
        width={1080}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out"
      />
      <div className={`absolute inset-0 pointer-events-none ${featured ? "feed-overlay-strong" : "feed-overlay"}`} />
      
      {admin && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(business);
          }}
          aria-label="Edit listing"
          className="absolute top-3 right-3 z-10 h-9 w-9 grid place-items-center rounded-full bg-background/70 backdrop-blur-md border border-foreground/20 text-foreground active:scale-95 transition"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}

      <div className="absolute top-0 inset-x-0 p-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground drop-shadow-lg leading-tight">
            {business.name}
          </h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/70 mt-1">
            {business.zone ? `${business.zone} · ` : ""}{business.category}
          </p>
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

      <div className="absolute bottom-0 inset-x-0 p-4 flex items-end justify-between gap-3">
        <div className="min-w-0 flex flex-wrap items-center gap-1.5">
          {business.tag && (
            <span className="px-2 py-0.5 rounded-full bg-background/30 backdrop-blur-md border border-foreground/10 text-[10px] font-medium tracking-wide text-foreground/85">
              {business.tag}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-background/30 backdrop-blur-md border border-foreground/10 text-[10px] font-medium tracking-wide text-foreground/85">
            {price}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Call ${business.name}`}
              className="h-11 w-11 grid place-items-center rounded-full bg-background/60 backdrop-blur-md border border-foreground/20 text-foreground hover:bg-background/80 active:scale-95 transition shadow-lg"
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
              className="inline-flex items-center gap-1.5 h-11 px-4 rounded-full bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition shadow-lg shadow-primary/25"
            >
              <MessageCircle className="h-5 w-5" strokeWidth={2.25} />
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
};
