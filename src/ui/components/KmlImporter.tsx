import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/components/ui/dialog";
import { Button } from "@/ui/components/ui/button";
import { Upload, Loader2, MapPin, Check } from "lucide-react";
import { parseKml, readKmlOrKmz, type ParsedPlacemark } from "@/logic/utils/kml";
import { supabase } from "@/logic/integrations/supabase/client";
import { toast } from "@/logic/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onImported: () => void;
}

const CATS = ["Eat", "Stay", "Experience", "Travel"];

export const KmlImporter = ({ open, onOpenChange, onImported }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<ParsedPlacemark[]>([]);
  const [skip, setSkip] = useState<Set<number>>(new Set());

  const reset = () => {
    setItems([]);
    setSkip(new Set());
    if (fileRef.current) fileRef.current.value = "";
  };

  const onFile = async (file: File) => {
    setParsing(true);
    try {
      const xml = await readKmlOrKmz(file);
      const parsed = parseKml(xml);
      setItems(parsed);
      setSkip(new Set());
      if (parsed.length === 0) toast({ title: "No placemarks found", variant: "destructive" });
    } catch (e: any) {
      toast({ title: "Parse failed", description: e.message, variant: "destructive" });
    } finally {
      setParsing(false);
    }
  };

  const setCat = (i: number, c: string) =>
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, category: c } : it)));

  const toggleSkip = (i: number) =>
    setSkip((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  const save = async () => {
    const rows = items
      .filter((_, i) => !skip.has(i))
      .map((it) => ({
        name: it.name,
        category: it.category,
        zone: "Port Barton",
        description: it.description,
        latitude: it.latitude,
        longitude: it.longitude,
        cover_image: it.cover_image,
        images: it.images,
      }));
    if (rows.length === 0) return;
    setSaving(true);
    // chunk to avoid payload limits
    const chunk = 100;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += chunk) {
      const slice = rows.slice(i, i + chunk);
      const { error } = await supabase.from("businesses").insert(slice);
      if (error) {
        setSaving(false);
        toast({ title: "Insert failed", description: error.message, variant: "destructive" });
        return;
      }
      inserted += slice.length;
    }
    setSaving(false);
    toast({ title: `Imported ${inserted} listings` });
    reset();
    onImported();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import from KML / KMZ</DialogTitle>
        </DialogHeader>

        {items.length === 0 ? (
          <div className="py-8 flex flex-col items-center gap-4">
            <input
              ref={fileRef}
              type="file"
              accept=".kml,.kmz,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz"
              hidden
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
            <div className="h-16 w-16 rounded-full bg-secondary grid place-items-center">
              <MapPin className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center px-6">
              Upload a Google My Maps export (.kml or .kmz). Placemarks will be auto-categorized.
            </p>
            <Button onClick={() => fileRef.current?.click()} disabled={parsing}>
              {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Choose file
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>{items.length - skip.size} of {items.length} selected</span>
              <button className="underline" onClick={reset}>Reset</button>
            </div>
            <div className="overflow-y-auto -mx-6 px-6 divide-y divide-border flex-1">
              {items.map((it, i) => {
                const skipped = skip.has(i);
                return (
                  <div key={i} className={`py-3 ${skipped ? "opacity-40" : ""}`}>
                    <div className="flex items-start gap-3">
                      {it.cover_image ? (
                        <img src={it.cover_image} alt="" className="h-12 w-12 rounded object-cover bg-secondary" />
                      ) : (
                        <div className="h-12 w-12 rounded bg-secondary grid place-items-center">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{it.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {it.latitude.toFixed(4)}, {it.longitude.toFixed(4)} · {it.images.length} img
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {CATS.map((c) => (
                            <button
                              key={c}
                              onClick={() => setCat(i, c)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                it.category === c
                                  ? "bg-foreground text-background"
                                  : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSkip(i)}
                        className={`shrink-0 h-6 w-6 rounded-full grid place-items-center border ${
                          skipped ? "border-border" : "border-foreground bg-foreground text-background"
                        }`}
                        aria-label={skipped ? "Include" : "Skip"}
                      >
                        {!skipped && <Check className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 pt-3 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Import {items.length - skip.size}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};