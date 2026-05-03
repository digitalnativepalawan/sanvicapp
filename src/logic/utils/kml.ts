import JSZip from "jszip";

export interface ParsedPlacemark {
  name: string;
  description: string | null;
  category: string;
  latitude: number;
  longitude: number;
  images: string[];
  cover_image: string | null;
}

const KEYWORDS: Array<[RegExp, string]> = [
  [/restaurant|cafe|coffee|bar\b|grill|eatery|bistro|kitchen|food|bakery|pizz|burger|resto|diner/i, "Eat"],
  [/hotel|resort|inn\b|hostel|guest\s*house|guesthouse|homestay|cottage|villa|lodge|pension|suites|tourist inn|huts/i, "Stay"],
  [/tour|tours|activit|diving|dive|island hopping|snorkel|kayak|trek|hike|excursion|experience|spa|massage/i, "Experience"],
  [/transfer|van\b|boat|ferry|tricycle|shuttle|transport|travel|airport|terminal/i, "Travel"],
];

export const detectCategory = (name: string, description?: string | null): string => {
  const text = `${name} ${description ?? ""}`;
  for (const [re, cat] of KEYWORDS) if (re.test(text)) return cat;
  return "Stay";
};

const text = (el: Element | null) => el?.textContent?.trim() ?? "";

const extractImages = (placemark: Element, descHtml: string): string[] => {
  const urls = new Set<string>();
  // gx_media_links data field
  placemark.querySelectorAll("ExtendedData > Data").forEach((d) => {
    const name = d.getAttribute("name");
    if (name === "gx_media_links") {
      const v = text(d.querySelector("value"));
      v.split(/\s+/).filter((u) => /^https?:\/\//.test(u)).forEach((u) => urls.add(u));
    }
  });
  // <img src="..."> in description
  const imgRe = /<img[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(descHtml))) urls.add(m[1]);
  return Array.from(urls);
};

export const parseKml = (xml: string): ParsedPlacemark[] => {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const placemarks = Array.from(doc.getElementsByTagName("Placemark"));
  const out: ParsedPlacemark[] = [];
  for (const p of placemarks) {
    const name = text(p.querySelector(":scope > name"));
    const coordsRaw = text(p.querySelector("Point > coordinates"));
    if (!name || !coordsRaw) continue;
    const [lonS, latS] = coordsRaw.split(",");
    const lat = parseFloat(latS);
    const lon = parseFloat(lonS);
    if (!isFinite(lat) || !isFinite(lon)) continue;

    const descHtml = text(p.querySelector(":scope > description"));
    let plain: string | null = null;
    p.querySelectorAll("ExtendedData > Data").forEach((d) => {
      if (d.getAttribute("name") === "description") {
        plain = text(d.querySelector("value"));
      }
    });
    if (!plain && descHtml) {
      plain = descHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 600);
    }
    const images = extractImages(p, descHtml);
    out.push({
      name,
      description: plain,
      category: detectCategory(name, plain),
      latitude: lat,
      longitude: lon,
      images,
      cover_image: images[0] ?? null,
    });
  }
  return out;
};

export const readKmlOrKmz = async (file: File): Promise<string> => {
  const isKmz = /\.kmz$/i.test(file.name) || file.type === "application/vnd.google-earth.kmz";
  if (!isKmz) return await file.text();
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const kmlFile = Object.values(zip.files).find((f) => /\.kml$/i.test(f.name) && !f.dir);
  if (!kmlFile) throw new Error("No .kml file found in archive");
  return await kmlFile.async("string");
};