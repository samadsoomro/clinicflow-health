import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface ContactContent {
  title: string;
  subtitle: string;
}

interface ContactPreviewProps {
  content: ContactContent;
  onChange: (content: ContactContent) => void;
  clinicId: string;
}

export const ContactPreview = ({ content, onChange, clinicId }: ContactPreviewProps) => {
  const [clinic, setClinic] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("clinics")
        .select("address, contact_phone, contact_email, working_hours, emergency_contact")
        .eq("id", clinicId)
        .single();
      setClinic(data);
    };
    fetch();
  }, [clinicId]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Section Title</Label>
          <Input value={content.title} onChange={(e) => onChange({ ...content, title: e.target.value })} placeholder="Contact Us" />
        </div>
        <div className="space-y-2">
          <Label>Subtitle</Label>
          <Input value={content.subtitle} onChange={(e) => onChange({ ...content, subtitle: e.target.value })} placeholder="Get in touch" />
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Current Contact Info (from Settings)</Label>
        <p className="text-xs text-muted-foreground mb-3">
          Contact details are managed from the Location & Contact page. They'll automatically appear in this homepage section.
        </p>
        {clinic ? (
          <div className="space-y-2 rounded-xl border border-border p-4 text-sm text-muted-foreground">
            <p>📍 {clinic.address || "No address set"}</p>
            <p>📞 {clinic.contact_phone || "No phone set"}</p>
            <p>✉️ {clinic.contact_email || "No email set"}</p>
            <p>🕐 {clinic.working_hours || "No hours set"}</p>
            <p>🚨 {clinic.emergency_contact || "No emergency contact set"}</p>
          </div>
        ) : (
          <p className="py-4 text-center text-muted-foreground text-sm">Loading...</p>
        )}
      </div>
    </div>
  );
};
