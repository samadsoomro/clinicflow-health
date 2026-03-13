import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Trash2, Plus, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { compressImage } from "@/lib/imageUtils";

interface DoctorsContent {
  title: string;
  subtitle: string;
  featured_ids?: string[];
  max_display?: number;
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
  display_order: number;
}

export const DoctorsEditor = ({ content, onChange, clinicId }: DoctorsEditorProps) => {
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSpecialization, setNewSpecialization] = useState("");

  const fetchDoctors = async () => {
    const { data } = await (supabase as any)
      .from("homepage_doctors")
      .select("id, name, specialization, image_url, display_order")
      .eq("clinic_id", clinicId)
      .order("display_order");
    setDoctors((data as DoctorRow[]) || []);
  };

  useEffect(() => {
    fetchDoctors();
  }, [clinicId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!newName || !newSpecialization) {
      toast.error("Please enter doctor name and specialization first");
      return;
    }

    setUploading(true);

    try {
      let imageUrl = null;

      // OPTIONAL: Compress and upload if file exists
      if (file) {
        const compressed = await compressImage(file, 800, 0.8);
        const filename = `${Date.now()}-${file.name.replace(/\.[^.]+$/, '.jpg')}`;
        const path = `${clinicId}/homepage-doctors/${filename}`;
        
        const { error: uploadErr } = await supabase.storage
          .from("clinic-assets")
          .upload(path, compressed, { upsert: true });

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from("clinic-assets").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const { error: insertErr } = await (supabase as any).from("homepage_doctors").insert({
        clinic_id: clinicId,
        name: newName,
        specialization: newSpecialization,
        image_url: imageUrl,
        display_order: doctors.length,
      });

      if (insertErr) throw insertErr;

      toast.success("Doctor added to homepage!");
      setNewName("");
      setNewSpecialization("");
      fetchDoctors();
    } catch (error: any) {
      toast.error("Failed to add doctor: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any).from("homepage_doctors").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed");
    } else {
      toast.success("Doctor removed from homepage");
      fetchDoctors();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Section Title</Label>
          <Input 
            value={content.title} 
            onChange={(e) => onChange({ ...content, title: e.target.value })} 
            placeholder="Meet Our Doctors" 
          />
        </div>
        <div className="space-y-2">
          <Label>Subtitle</Label>
          <Input 
            value={content.subtitle} 
            onChange={(e) => onChange({ ...content, subtitle: e.target.value })} 
            placeholder="Our expert team" 
          />
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-dashed border-border p-4 bg-secondary/20">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Homepage Doctor
        </h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                placeholder="Dr. John Doe" 
              />
            </div>
            <div className="space-y-2">
              <Label>Specialization</Label>
              <Input 
                value={newSpecialization} 
                onChange={(e) => setNewSpecialization(e.target.value)} 
                placeholder="Cardiologist" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Photo (Optional)</Label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-card px-4 py-4 text-sm font-medium text-muted-foreground hover:bg-secondary/50 hover:border-primary/50 transition-all">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              {uploading ? "Adding Doctor..." : "Upload Photo & Save"}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleUpload} 
                className="hidden" 
                disabled={uploading || !newName || !newSpecialization} 
              />
            </label>
            <p className="text-[10px] text-muted-foreground">Select a file to automatically save the doctor. Fill Name and Specialization first.</p>
          </div>
          {!uploading && newName && newSpecialization && (
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => {
                const fakeEvent = { target: { files: [] } } as any;
                handleUpload(fakeEvent);
              }}
            >
              Save Without Photo
            </Button>
          )}
        </div>
      </div>

      <div>
        <Label className="mb-3 block text-sm font-bold">Homepage Doctors List</Label>
        <div className="grid grid-cols-1 gap-3">
          {doctors.map((d) => (
            <div key={d.id} className="group flex items-center gap-4 rounded-xl border border-border p-3 bg-card hover:bg-secondary/30 transition-colors">
              <div className="relative h-12 w-12 flex-shrink-0">
                {d.image_url ? (
                  <img src={d.image_url} alt={d.name} className="h-full w-full rounded-lg object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-lg bg-secondary text-primary">
                    <User className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-foreground">{d.name}</p>
                <p className="text-xs text-muted-foreground truncate">{d.specialization}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(d.id)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {doctors.length === 0 && (
            <div className="py-8 text-center rounded-xl border border-dashed border-border">
              <p className="text-sm text-muted-foreground">No doctors added for homepage yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
