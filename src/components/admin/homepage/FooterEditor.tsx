import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FooterContent {
  description: string;
  phone: string;
  email: string;
  address: string;
  copyright: string;
  logo_override: string;
  social_facebook: string;
  social_instagram: string;
  social_whatsapp: string;
  social_linkedin: string;
}

interface FooterEditorProps {
  content: FooterContent;
  onChange: (content: FooterContent) => void;
  clinicId: string;
}

export const FooterEditor = ({ content, onChange, clinicId }: FooterEditorProps) => {
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${clinicId}/footer/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("clinic-assets").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload failed: " + error.message);
    } else {
      const { data: urlData } = supabase.storage.from("clinic-assets").getPublicUrl(path);
      onChange({ ...content, logo_override: urlData.publicUrl });
      toast.success("Footer logo uploaded!");
    }
    setUploading(false);
  };

  const update = (key: keyof FooterContent, value: string) => {
    onChange({ ...content, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* General */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">General</h4>
        <div className="space-y-2">
          <Label>Footer Description</Label>
          <Textarea value={content.description || ""} onChange={(e) => update("description", e.target.value)} placeholder="Modern health management platform..." rows={3} />
        </div>
        <div className="space-y-2">
          <Label>Copyright Text</Label>
          <Input value={content.copyright || ""} onChange={(e) => update("copyright", e.target.value)} placeholder="© 2026 Clinic Name. All rights reserved." />
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Contact Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={content.phone || ""} onChange={(e) => update("phone", e.target.value)} placeholder="+1 (555) 123-4567" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={content.email || ""} onChange={(e) => update("email", e.target.value)} placeholder="info@clinic.com" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Address</Label>
          <Input value={content.address || ""} onChange={(e) => update("address", e.target.value)} placeholder="123 Health St, City" />
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Social Links</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Facebook</Label>
            <Input value={content.social_facebook || ""} onChange={(e) => update("social_facebook", e.target.value)} placeholder="https://facebook.com/..." />
          </div>
          <div className="space-y-2">
            <Label>Instagram</Label>
            <Input value={content.social_instagram || ""} onChange={(e) => update("social_instagram", e.target.value)} placeholder="https://instagram.com/..." />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input value={content.social_whatsapp || ""} onChange={(e) => update("social_whatsapp", e.target.value)} placeholder="https://wa.me/..." />
          </div>
          <div className="space-y-2">
            <Label>LinkedIn</Label>
            <Input value={content.social_linkedin || ""} onChange={(e) => update("social_linkedin", e.target.value)} placeholder="https://linkedin.com/..." />
          </div>
        </div>
      </div>

      {/* Footer Logo Override */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Footer Logo (Optional Override)</h4>
        <p className="text-xs text-muted-foreground">If not set, the main clinic logo from Settings will be used.</p>
        {content.logo_override && (
          <div className="flex items-center gap-3">
            <img src={content.logo_override} alt="Footer logo" className="h-10 rounded-lg border border-border" />
            <Button variant="ghost" size="sm" onClick={() => update("logo_override", "")}>Remove</Button>
          </div>
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading..." : "Upload Logo"}
          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
        </label>
      </div>
    </div>
  );
};
