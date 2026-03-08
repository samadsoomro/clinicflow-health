import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

interface DoctorsContent {
  title: string;
  subtitle: string;
  featured_ids?: string[];
}

interface DoctorsEditorProps {
  content: DoctorsContent;
  onChange: (content: DoctorsContent) => void;
  clinicId: string;
}

interface DoctorRow {
  id: string;
  name: string;
  specialization: string;
  image_url: string | null;
  status: string | null;
}

export const DoctorsEditor = ({ content, onChange, clinicId }: DoctorsEditorProps) => {
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("doctors")
        .select("id, name, specialization, image_url, status")
        .eq("clinic_id", clinicId)
        .eq("status", "active")
        .order("name");
      setDoctors((data as DoctorRow[]) || []);
    };
    fetch();
  }, [clinicId]);

  const featuredIds = content.featured_ids || [];

  const toggleDoctor = (id: string) => {
    const updated = featuredIds.includes(id)
      ? featuredIds.filter((fid) => fid !== id)
      : [...featuredIds, id];
    onChange({ ...content, featured_ids: updated });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Section Title</Label>
          <Input value={content.title} onChange={(e) => onChange({ ...content, title: e.target.value })} placeholder="Meet Our Doctors" />
        </div>
        <div className="space-y-2">
          <Label>Subtitle</Label>
          <Input value={content.subtitle} onChange={(e) => onChange({ ...content, subtitle: e.target.value })} placeholder="Our expert team" />
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Show on Homepage</Label>
        <p className="text-xs text-muted-foreground mb-3">Check the doctors you want to feature on the homepage. Unchecked doctors won't appear.</p>
        <div className="space-y-2">
          {doctors.map((d) => (
            <label key={d.id} className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer hover:bg-secondary/50 transition-colors">
              <Checkbox
                checked={featuredIds.includes(d.id)}
                onCheckedChange={() => toggleDoctor(d.id)}
              />
              <div className="flex items-center gap-3">
                {d.image_url ? (
                  <img src={d.image_url} alt={d.name} className="h-9 w-9 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary text-xs font-bold">
                    {d.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.specialization}</p>
                </div>
              </div>
            </label>
          ))}
          {doctors.length === 0 && (
            <p className="py-4 text-center text-muted-foreground text-sm">No active doctors found. Add doctors from the Doctors page first.</p>
          )}
        </div>
      </div>
    </div>
  );
};
