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
  second_branch_address?: string;
  second_branch_working_hours?: string;
}

interface ContactPreviewProps {
  content: ContactContent;
  onChange: (content: ContactContent) => void;
  clinicId: string;
}

export const ContactPreview = ({ content, onChange, clinicId }: ContactPreviewProps) => {
  const [clinic, setClinic] = useState<any>(null);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("clinics")
        .select("address, contact_phone, contact_email, working_hours, emergency_contact, maps_embed_url, second_branch_address, second_branch_working_hours")
        .eq("id", clinicId)
        .single();
      setClinic(data);
    };
    fetch();
  }, [clinicId]);

  // Pre-fill empty content fields from clinic data once loaded
  useEffect(() => {
    if (!clinic || prefilled) return;
    const needsFill = !content.phone && !content.email && !content.address && !content.working_hours && !content.maps_embed_url && !content.second_branch_address && !content.second_branch_working_hours;
    if (needsFill) {
      onChange({
        ...content,
        title: content.title || "Contact Us",
        subtitle: content.subtitle || "Get in touch with our team",
        address: content.address || clinic.address || "",
        phone: content.phone || clinic.contact_phone || "",
        email: content.email || clinic.contact_email || "",
        working_hours: content.working_hours || clinic.working_hours || "",
        second_branch_address: content.second_branch_address || clinic.second_branch_address || "",
        second_branch_working_hours: content.second_branch_working_hours || clinic.second_branch_working_hours || "",
        maps_embed_url: content.maps_embed_url || clinic.maps_embed_url || "",
      });
    }
    setPrefilled(true);
  }, [clinic]);

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
        <div className="space-y-2">
          <Label>Second Branch Address (Optional)</Label>
          <Input
            value={content.second_branch_address || ""}
            onChange={(e) => onChange({ ...content, second_branch_address: e.target.value })}
            placeholder={clinic?.second_branch_address || "Enter second branch address (leave empty if none)"}
          />
        </div>
        <div className="space-y-2">
          <Label>Second Branch Working Hours (Optional)</Label>
          <Input
            value={content.second_branch_working_hours || ""}
            onChange={(e) => onChange({ ...content, second_branch_working_hours: e.target.value })}
            placeholder={clinic?.second_branch_working_hours || "e.g. Mon-Sat 10AM-5PM (leave empty if none)"}
          />
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Current Defaults (from Settings)</Label>
        {clinic ? (
          <div className="space-y-2 rounded-xl border border-border p-4 text-sm text-muted-foreground">
            <p>📍 {clinic.address || "No address set"}</p>
            {clinic.second_branch_address && <p>📍 {clinic.second_branch_address}</p>}
            <p>📞 {clinic.contact_phone || "No phone set"}</p>
            <p>✉️ {clinic.contact_email || "No email set"}</p>
            <p>🕐 {clinic.working_hours || "No hours set"}</p>
            {clinic.second_branch_working_hours && <p>🕐 {clinic.second_branch_working_hours}</p>}
            <p>🚨 {clinic.emergency_contact || "No emergency contact set"}</p>
          </div>
        ) : (
          <p className="py-4 text-center text-muted-foreground text-sm">Loading...</p>
        )}
      </div>
    </div>
  );
};
