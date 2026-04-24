import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload, X, Plus, Loader2 } from "lucide-react";
import type { Business } from "./FeedItem";

interface Props {
  business: Business | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: (b: Business) => void;
}

const CATS = ["Eat", "Stay", "Experience", "Travel"];

export const EditBusinessModal = ({ business, open, onOpenChange, onSaved }: Props) => {
  const [form, setForm] = useState<Business | null>(business);
  const [images, setImages] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(business);
    setImages(business?.images ?? (business?.cover_image ? [business.cover_image] : []));
    setNewUrl("");
  }, [business]);

  if (!form) return null;

  const set = <K extends keyof Business>(k: K, v: Business[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const addUrl = () => {
    const u = newUrl.trim();
    if (!u) return;
    setImages((arr) => [...arr, u]);
    setNewUrl("");
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
      category: form.category,
      zone: form.zone,
      tag: form.tag,
      whatsapp: form.whatsapp,
      phone: form.phone,
      cover_image: cover,
      images,
    };
    const { data, error } = await supabase
      .from("businesses")
      .update(payload)
      .eq("id", form.id)
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Saved" });
    onSaved(data as Business);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit listing</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>

          <Field label="Category">
            <div className="flex flex-wrap gap-1.5">
              {CATS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("category", c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    form.category === c ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>

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

          <Field label="Images (first is cover)">
            <div className="space-y-2">
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((url, i) => (
                    <div key={url + i} className="relative aspect-square rounded-md overflow-hidden bg-secondary">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-foreground/90 text-background text-[9px] font-bold uppercase">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setImages((arr) => arr.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 h-5 w-5 grid place-items-center rounded-full bg-background/80"
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

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
    {children}
  </div>
);