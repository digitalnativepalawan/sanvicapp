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
}

// ... [Keep your existing FeedItem component code exactly as is] ...
