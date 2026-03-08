import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface CertificationsContent {
  title: string;
  subtitle: string;
}

interface CertificationsEditorProps {
  content: CertificationsContent;
  onChange: (content: CertificationsContent) => void;
  clinicId: string;
}

interface CertRow {
  id: string;
  title: string;
  image_url: string;
}

export const CertificationsEditor = ({ content, onChange, clinicId }: CertificationsEditorProps) => {
  const [certs, setCerts] = useState<CertRow[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("certifications")
        .select("id, title, image_url")
        .eq("clinic_id", clinicId)
        .order("sort_order");
      setCerts((data as CertRow[]) || []);
    };
    fetch();
  }, [clinicId]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Section Title</Label>
          <Input value={content.title} onChange={(e) => onChange({ ...content, title: e.target.value })} placeholder="Our Certifications" />
        </div>
        <div className="space-y-2">
          <Label>Subtitle</Label>
          <Input value={content.subtitle} onChange={(e) => onChange({ ...content, subtitle: e.target.value })} placeholder="Recognized excellence" />
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Current Certifications</Label>
        <p className="text-xs text-muted-foreground mb-3">
          Certifications are managed from the Settings → Branding section. They will automatically appear on the homepage.
        </p>
        {certs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {certs.map((c) => (
              <div key={c.id} className="rounded-xl border border-border p-2 text-center">
                <div className="aspect-[3/4] overflow-hidden rounded-lg mb-2">
                  <img src={c.image_url} alt={c.title} className="h-full w-full object-cover" />
                </div>
                <p className="text-xs font-medium truncate">{c.title}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-muted-foreground text-sm">No certifications uploaded yet.</p>
        )}
      </div>
    </div>
  );
};
