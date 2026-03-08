import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Eye, Palette, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useClinicId } from "@/hooks/useClinic";
import { toast } from "sonner";

interface PatientPreview {
  id: string;
  full_name: string;
  formatted_patient_id: string;
  age: number;
  gender: string;
  created_at: string | null;
}

const AdminPatientCards = () => {
  const { clinicId } = useClinicId();
  const [patients, setPatients] = useState<PatientPreview[]>([]);
  const [previewPatientId, setPreviewPatientId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [layout, setLayout] = useState({
    clinicName: "",
    tagline: "Health Identity Card",
    backgroundColor: "#1e293b",
    accentColor: "#4ade80",
    termsConditions: "",
    address: "",
    phone: "",
    email: "",
    workingHours: "",
    emergencyContact: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: clinic }, { data: pts }] = await Promise.all([
        supabase.from("clinics").select("clinic_name, card_background_color, terms_conditions, address, contact_phone, contact_email, working_hours, emergency_contact, theme_color").eq("id", clinicId).single(),
        supabase.from("patients").select("id, full_name, formatted_patient_id, age, gender, created_at").eq("clinic_id", clinicId).order("created_at", { ascending: false }).limit(20),
      ]);

      if (clinic) {
        setLayout({
          clinicName: clinic.clinic_name || "",
          tagline: "Health Identity Card",
          backgroundColor: clinic.card_background_color || "#1e293b",
          accentColor: clinic.theme_color || "#4ade80",
          termsConditions: clinic.terms_conditions || "",
          address: clinic.address || "",
          phone: clinic.contact_phone || "",
          email: clinic.contact_email || "",
          workingHours: clinic.working_hours || "",
          emergencyContact: clinic.emergency_contact || "",
        });
      }

      setPatients((pts as PatientPreview[]) || []);
      if (pts && pts.length > 0) setPreviewPatientId(pts[0].id);
      setLoading(false);
    };
    fetchData();
  }, [clinicId]);

  const previewPatient = patients.find((p) => p.id === previewPatientId);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("clinics").update({
      card_background_color: layout.backgroundColor,
      theme_color: layout.accentColor,
      terms_conditions: layout.termsConditions,
    }).eq("id", clinicId);

    if (error) toast.error(error.message);
    else toast.success("Card layout saved!");
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Patient Card Layout</h2>
        <p className="text-sm text-muted-foreground">Design and customize the patient card template.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="flex items-center gap-2 font-display font-semibold text-foreground">
              <Palette className="h-4 w-4" /> Card Design
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={layout.backgroundColor} onChange={(e) => setLayout({ ...layout, backgroundColor: e.target.value })} className="h-10 w-10 cursor-pointer rounded-lg border border-border" />
                  <Input value={layout.backgroundColor} onChange={(e) => setLayout({ ...layout, backgroundColor: e.target.value })} className="flex-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Accent Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={layout.accentColor} onChange={(e) => setLayout({ ...layout, accentColor: e.target.value })} className="h-10 w-10 cursor-pointer rounded-lg border border-border" />
                  <Input value={layout.accentColor} onChange={(e) => setLayout({ ...layout, accentColor: e.target.value })} className="flex-1" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Terms & Conditions</Label>
              <Textarea value={layout.termsConditions} onChange={(e) => setLayout({ ...layout, termsConditions: e.target.value })} rows={5} />
            </div>
          </div>

          <Button variant="hero" onClick={handleSave} className="w-full" disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Card Layout"}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Eye className="h-4 w-4" /> Live Preview
            </p>
            {patients.length > 0 && (
              <div className="w-48">
                <Select value={previewPatientId} onValueChange={setPreviewPatientId}>
                  <SelectTrigger><SelectValue placeholder="Preview patient" /></SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.formatted_patient_id} — {p.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {previewPatient ? (
            <div className="sticky top-20">
              <div className="rounded-t-2xl border border-border p-6 text-white" style={{ backgroundColor: layout.backgroundColor }}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">{layout.clinicName}</h3>
                    <p className="text-xs opacity-60">{layout.tagline}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-50">Patient Name</p>
                      <p className="font-display font-semibold">{previewPatient.full_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-50">Patient ID</p>
                      <p className="font-display text-xl font-bold" style={{ color: layout.accentColor }}>{previewPatient.formatted_patient_id}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-50">Age</p>
                      <p className="font-medium">{previewPatient.age}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-50">Gender</p>
                      <p className="font-medium capitalize">{previewPatient.gender}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-50">Registered</p>
                      <p className="font-medium">{previewPatient.created_at ? new Date(previewPatient.created_at).toLocaleDateString() : "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-b-2xl border border-t-0 border-border bg-card p-6">
                <h4 className="mb-2 font-display text-sm font-semibold text-foreground">Terms & Conditions</h4>
                <div className="mb-4 space-y-1">
                  {layout.termsConditions.split("\n").map((line, i) => (
                    <p key={i} className="text-[11px] leading-relaxed text-muted-foreground">{line}</p>
                  ))}
                </div>
                <div className="space-y-1 border-t border-border pt-3">
                  {layout.address && <p className="text-[11px] text-muted-foreground">📍 {layout.address}</p>}
                  {(layout.phone || layout.email) && <p className="text-[11px] text-muted-foreground">📞 {layout.phone} | ✉️ {layout.email}</p>}
                  {layout.workingHours && <p className="text-[11px] text-muted-foreground">🕐 {layout.workingHours}</p>}
                  {layout.emergencyContact && <p className="text-[11px] text-muted-foreground">🚨 Emergency: {layout.emergencyContact}</p>}
                </div>
              </div>
            </div>
          ) : (
            <p className="py-12 text-center text-muted-foreground">No patients to preview. Register a patient first.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPatientCards;
