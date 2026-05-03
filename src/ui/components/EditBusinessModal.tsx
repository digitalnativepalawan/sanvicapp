import { useEffect, useRef, useState } from "react";
import { Drawer, DrawerContent, DrawerOverlay, DrawerPortal } from "@/ui/components/ui/drawer";
import { Input } from "@/ui/components/ui/input";
import { Button } from "@/ui/components/ui/button";
import { Label } from "@/ui/components/ui/label";
import { supabase } from "@/logic/integrations/supabase/client";
import { toast } from "@/logic/hooks/use-toast";
import { Upload, X, Plus, Loader2, Star, ChevronUp, ChevronDown, Eye, EyeOff, Trash2 } from "lucide-react";
import type { Business } from "./FeedItem";

interface Props {
  business: Business | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: (b: Business) => void;
  onDelete: (id: string) => void;
}

const CATS = ["Eat", "Stay", "Experience", "Travel"];

const csv = (arr?: string[] | null) => (arr && arr.length ? arr.join(", ") : "");
const parseCsv = (s: string) =>
  s.split(",").map((x) => x.trim()).filter(Boolean);

export const EditBusinessModal = ({ business, open, onOpenChange, onSaved, onDelete }: Props) => {
  const [form, setForm] = useState<Business | null>(business);
  const [images, setImages] = useState<string[]>([]);
  const [amenitiesText, setAmenitiesText] = useState("");
  const [servicesText, setServicesText] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (business) {
      setForm(business);
      setImages(business.images ?? (business.cover_image ? [business.cover_image] : []));
      setAmenitiesText(csv(business.amenities));
      setServicesText(csv(business.services));
    } else {
      setForm(null);
      setImages([]);
      setAmenitiesText("");
      setServicesText("");
    }
    setNewUrl("");
  }, [business]);

  if (!form) return null;

  const set = <K extends keyof Business>(k: K, v: Business[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const cats: string[] = form.categories?.length
    ? form.categories
    : form.category
    ? [form.category]
    : [];

  const toggleCat = (c: string) => {
    const exists = cats.includes(c);
    const next = exists ? cats.filter((x) => x !== c) : [...cats, c];
    set("categories", next as any);
    if (next.length && !next.includes(form.category)) set("category", next[0]);
    if (!form.category && next.length) set("category", next[0]);
  };

  const addUrl = () => {
    const u = newUrl.trim();
    if (!u) return;
    setImages((arr) => [...arr, u]);
    setNewUrl("");
  };

  const move = (i: number, dir: -1 | 1) => {
    setImages((arr) => {
      const next = [...arr];
      const j = i + dir;
      if (j < 0 || j >= next.length) return arr;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const onDrop = (target: number) => {
    if (dragIdx === null || dragIdx === target) return;
    setImages((arr) => {
      const next = [...arr];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(target, 0, moved);
      return next;
    });
    setDragIdx(null);
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${form.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from("business-images").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) throw error;
        const { data } = supabase.storage.from("business-images").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      setImages((arr) => [...arr, ...uploaded]);
      toast({ title: `Uploaded ${uploaded.length} image(s)` });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    const cover = images[0] || null;
    const payload = {
      name: form.name,
      category: cats[0] || form.category,
      categories: cats,
      zone: form.zone,
      tag: form.tag,
      whatsapp: form.whatsapp,
      phone: form.phone,
      website: form.website || null,
      facebook: form.facebook || null,
      instagram: form.instagram || null,
      amenities: parseCsv(amenitiesText),
      services: parseCsv(servicesText),
      cover_image: cover,
      images,
      featured: !!form.featured,
      visible: form.visible !== false,
      latitude: form.latitude ?? null,
      longitude: form.longitude ?? null,
    };
    
    console.log("Saving payload:", payload); // Debug log
    
    const { data, error } = await supabase
      .from("businesses")
      .update(payload)
      .eq("id", form.id)
      .select()
      .single();
      
    setSaving(false);
    
    if (error) {
      console.error("Save error:", error);
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    
    console.log("Saved successfully:", data);
    toast({ title: "Saved successfully!" });
    onSaved(data as Business);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!form) return;
    const confirmed = window.confirm(`Delete "${form.name}"? This cannot be undone.`);
    if (!confirmed) return;
    
    setSaving(true);
    const { error } = await supabase.from("businesses").delete().eq("id", form.id);
    setSaving(false);
    
    if (error) {
      console.error("Delete error:", error);
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    
    toast({ title: "Deleted successfully!" });
    onDelete(form.id);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerPortal>
        <DrawerOverlay className="bg-background/70 backdrop-blur-sm" />
        <DrawerContent className="max-h-[92vh] border-border/40 bg-background px-0">
          <div className="flex flex-col overflow-hidden">
            <div className="px-5 pt-2 pb-3 border-b border-border/40 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Edit listing</h2>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="p-2 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition disabled:opacity-50"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 pt-4 pb-32 space-y-4">
              {/* Visible Toggle */}
              <button
                type="button"
                onClick={() => set("visible", !form.visible as any)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md border transition ${
                  form.visible !== false 
                    ? "bg-primary/10 border-primary/40 text-primary" 
                    : "border-border text-muted-foreground"
                }`}
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  {form.visible !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {form.visible !== false ? "Visible on website" : "Hidden from website"}
                </span>
                <span className={`h-5 w-9 rounded-full relative transition ${
                  form.visible !== false ? "bg-primary" : "bg-secondary"
                }`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all ${
                    form.visible !== false ? "left-4" : "left-0.5"
                  }`} />
                </span>
              </button>

              <Field label="Name">
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
              </Field>

              <Field label="Categories (multi-select)">
                <div className="flex flex-wrap gap-1.5">
                  {CATS.map((c) => {
                    const on = cats.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCat(c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                          on ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <button
                type="button"
                onClick={() => set("featured", !form.featured as any)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md border ${
                  form.featured ? "bg-accent/15 border-accent/40 text-accent" : "border-border text-muted-foreground"
                }`}
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  <Star className={`h-4 w-4 ${form.featured ? "fill-current" : ""}`} />
                  Featured listing
                </span>
                <span className={`h-5 w-9 rounded-full relative transition ${form.featured ? "bg-accent" : "bg-secondary"}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all ${form.featured ? "left-4" : "left-0.5"}`} />
                </span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Zone">
                  <Input value={form.zone ?? ""} onChange={(e) => set("zone", e.target.value)} />
                </Field>
                <Field label="Tag">
                  <Input value={form.tag ?? ""} onChange={(e) => set("tag", e.target.value)} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="WhatsApp">
                  <Input value={form.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} />
                </Field>
                <Field label="Phone">
                  <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
                </Field>
              </div>

              <Field label="Website">
                <Input
                  placeholder="https://example.com"
                  value={form.website ?? ""}
                  onChange={(e) => set("website", e.target.value as any)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Facebook">
                  <Input
                    placeholder="https://facebook.com/…"
                    value={form.facebook ?? ""}
                    onChange={(e) => set("facebook", e.target.value as any)}
                  />
                </Field>
                <Field label="Instagram">
                  <Input
                    placeholder="https://instagram.com/…"
                    value={form.instagram ?? ""}
                    onChange={(e) => set("instagram", e.target.value as any)}
                  />
                </Field>
              </div>

              <Field label="Amenities (comma separated)">
                <Input
                  placeholder="WiFi, Beachfront, Aircon"
                  value={amenitiesText}
                  onChange={(e) => setAmenitiesText(e.target.value)}
                />
              </Field>
              <Field label="Services (comma separated)">
                <Input
                  placeholder="Island hopping, Transport, Tours"
                  value={servicesText}
                  onChange={(e) => setServicesText(e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude">
                  <Input
                    type="number"
                    step="any"
                    value={form.latitude ?? ""}
                    onChange={(e) => set("latitude", e.target.value === "" ? null : (parseFloat(e.target.value) as any))}
                  />
                </Field>
                <Field label="Longitude">
                  <Input
                    type="number"
                    step="any"
                    value={form.longitude ?? ""}
                    onChange={(e) => set("longitude", e.target.value === "" ? null : (parseFloat(e.target.value) as any))}
                  />
                </Field>
              </div>

              <Field label="Images — drag or use arrows to reorder (first = cover)">
                <div className="space-y-2">
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {images.map((url, i) => (
                        <div
                          key={url + i}
                          draggable
                          onDragStart={() => setDragIdx(i)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => onDrop(i)}
                          className={`relative aspect-square rounded-md overflow-hidden bg-secondary border ${
                            dragIdx === i ? "border-accent" : "border-transparent"
                          }`}
                        >
                          <img src={url} alt="" className="h-full w-full object-cover" draggable={false} />
                          {i === 0 && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-foreground/90 text-background text-[9px] font-bold uppercase">
                              Cover
                            </span>
                          )}
                          <div className="absolute bottom-1 left-1 flex gap-1">
                            <button
                              type="button"
                              onClick={() => move(i, -1)}
                              disabled={i === 0}
                              className="h-5 w-5 grid place-items-center rounded bg-background/80 disabled:opacity-40"
                              aria-label="Move up"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => move(i, 1)}
                              disabled={i === images.length - 1}
                              className="h-5 w-5 grid place-items-center rounded bg-background/80 disabled:opacity-40"
                              aria-label="Move down"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setImages((arr) => arr.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 h-5 w-5 grid place-items-center rounded-full bg-background/80"
                            aria-label="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste image URL"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
                    />
                    <Button type="button" size="icon" variant="secondary" onClick={addUrl}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => onFiles(e.target.files)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload from device
                  </Button>
                </div>
              </Field>
            </div>

            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background via-background to-background/90 px-4 pt-3 pb-5 border-t border-border/40">
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={save} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
    {children}
  </div>
);
