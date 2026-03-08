import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const fetchCerts = async () => {
    const { data } = await supabase
      .from("certifications")
      .select("id, title, image_url")
      .eq("clinic_id", clinicId)
      .order("sort_order");
    setCerts((data as CertRow[]) || []);
  };

  useEffect(() => { fetchCerts(); }, [clinicId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const path = `${clinicId}/certifications/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("clinic-assets").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("clinic-assets").getPublicUrl(path);
    const { error: insertErr } = await supabase.from("certifications").insert({
      clinic_id: clinicId,
      title: newTitle || "Certificate",
      image_url: urlData.publicUrl,
      sort_order: certs.length,
    });

    if (insertErr) {
      toast.error("Failed to save: " + insertErr.message);
    } else {
      toast.success("Certificate uploaded!");
      setNewTitle("");
      fetchCerts();
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("certifications").delete().eq("id", id);
    if (error) toast.error("Delete failed");
    else {
      toast.success("Certificate removed");
      fetchCerts();
    }
  };

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

      {/* Upload new certificate */}
      <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
        <h4 className="text-sm font-semibold text-foreground">Upload Certificate</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Certificate name" />
          </div>
          <div className="space-y-2">
            <Label>Image</Label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading..." : "Choose File"}
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        </div>
      </div>

      {/* Existing certificates */}
      <div>
        <Label className="mb-2 block">Current Certifications</Label>
        {certs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {certs.map((c) => (
              <div key={c.id} className="group relative rounded-xl border border-border p-2 text-center">
                <div className="aspect-[3/4] overflow-hidden rounded-lg mb-2">
                  <img src={c.image_url} alt={c.title} className="h-full w-full object-cover" />
                </div>
                <p className="text-xs font-medium truncate">{c.title}</p>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="absolute top-1 right-1 rounded-full bg-destructive/90 p-1 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-muted-foreground text-sm">No certifications uploaded yet. Use the form above to add one.</p>
        )}
      </div>
    </div>
  );
};
