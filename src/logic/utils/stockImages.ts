import eat1 from "@/assets/eat-1.jpg";
import eat2 from "@/assets/eat-2.jpg";
import eat3 from "@/assets/eat-3.jpg";
import exp1 from "@/assets/exp-1.jpg";
import exp2 from "@/assets/exp-2.jpg";
import exp3 from "@/assets/exp-3.jpg";
import stay1 from "@/assets/stay-1.jpg";
import stay2 from "@/assets/stay-2.jpg";
import stay3 from "@/assets/stay-3.jpg";
import travel1 from "@/assets/travel-1.jpg";
import travel2 from "@/assets/travel-2.jpg";
import travel3 from "@/assets/travel-3.jpg";

// Stock image pools per category. Easily replaceable later by swapping these arrays.
export const STOCK_POOLS: Record<string, string[]> = {
  Eat: [eat1, eat2, eat3],
  Experience: [exp1, exp2, exp3],
  Stay: [stay1, stay2, stay3],
  Travel: [travel1, travel2, travel3],
};

const FALLBACK_POOL = [eat1, exp1, stay1, travel1];

/**
 * Deterministically picks a stock image from the category pool using a stable id.
 * This rotates images across items but keeps the same item showing the same image.
 */
export function pickStockImage(category: string | null | undefined, id: string): string {
  const pool = (category && STOCK_POOLS[category]) || FALLBACK_POOL;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length];
}