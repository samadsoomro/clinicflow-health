import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface ContactContent {
  title: string;
  subtitle: string;
  phone: string;
  email: string;
  address: string;
  working_hours: string;
  maps_embed_url: string;
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
    <div className="space-y-6">
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

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Override Contact Details</h4>
        <p className="text-xs text-muted-foreground">Leave empty to use values from clinic Settings automatically.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={content.phone || ""} onChange={(e) => onChange({ ...content, phone: e.target.value })} placeholder={clinic?.contact_phone || "From settings"} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={content.email || ""} onChange={(e) => onChange({ ...content, email: e.target.value })} placeholder={clinic?.contact_email || "From settings"} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Address</Label>
          <Input value={content.address || ""} onChange={(e) => onChange({ ...content, address: e.target.value })} placeholder={clinic?.address || "From settings"} />
        </div>
        <div className="space-y-2">
          <Label>Working Hours</Label>
          <Input value={content.working_hours || ""} onChange={(e) => onChange({ ...content, working_hours: e.target.value })} placeholder={clinic?.working_hours || "From settings"} />
        </div>
        <div className="space-y-2">
          <Label>Google Maps Embed URL</Label>
          <Input value={content.maps_embed_url || ""} onChange={(e) => onChange({ ...content, maps_embed_url: e.target.value })} placeholder="https://www.google.com/maps/embed?pb=..." />
          <p className="text-xs text-muted-foreground">Paste the embed URL from Google Maps to show a map on the homepage.</p>
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Current Defaults (from Settings)</Label>
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
