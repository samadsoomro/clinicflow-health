import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import heroPattern from "@/assets/hero-pattern.jpg";

interface HeroContent {
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  button_link: string;
  background_image: string;
}

interface HeroEditorProps {
  content: HeroContent;
  onChange: (content: HeroContent) => void;
  clinicId: string;
}

export const HeroEditor = ({ content, onChange, clinicId }: HeroEditorProps) => {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${clinicId}/hero/hero-bg.${ext}`;

    const { error } = await supabase.storage.from("clinic-assets").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload failed: " + error.message);
    } else {
      const { data: urlData } = supabase.storage.from("clinic-assets").getPublicUrl(path);
      onChange({ ...content, background_image: urlData.publicUrl });
      toast.success("Hero image uploaded");
    }
    setUploading(false);
  };

  const handleRemoveImage = async () => {
    if (!content.background_image) return;
    // Try to delete from storage
    try {
      const url = new URL(content.background_image);
      const pathMatch = url.pathname.match(/clinic-assets\/(.+)/);
      if (pathMatch) {
        await supabase.storage.from("clinic-assets").remove([pathMatch[1]]);
      }
    } catch {}
    onChange({ ...content, background_image: "" });
    toast.success("Hero image removed");
  };

  const displayImage = content.background_image || heroPattern;
  const hasCustomImage = !!content.background_image;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Hero Title</Label>
        <Input value={content.title} onChange={(e) => onChange({ ...content, title: e.target.value })} placeholder="Welcome to Our Clinic" />
      </div>
      <div className="space-y-2">
        <Label>Subtitle</Label>
        <Input value={content.subtitle} onChange={(e) => onChange({ ...content, subtitle: e.target.value })} placeholder="Your trusted healthcare partner" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={content.description} onChange={(e) => onChange({ ...content, description: e.target.value })} rows={3} placeholder="Brief clinic introduction..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Button Text</Label>
          <Input value={content.button_text} onChange={(e) => onChange({ ...content, button_text: e.target.value })} placeholder="Get Started" />
        </div>
        <div className="space-y-2">
          <Label>Button Link</Label>
          <Input value={content.button_link} onChange={(e) => onChange({ ...content, button_link: e.target.value })} placeholder="/register" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Background Image</Label>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:bg-secondary transition-colors">
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Image"}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
          <div className="relative h-16 w-28 overflow-hidden rounded-lg border border-border">
            <img src={displayImage} alt="Hero bg" className="h-full w-full object-cover" />
            {hasCustomImage && (
              <button
                onClick={handleRemoveImage}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors"
                title="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        {!hasCustomImage && (
          <p className="text-xs text-muted-foreground">Using default healthcare image. Upload a custom image to replace it.</p>
        )}
      </div>
    </div>
  );
};
