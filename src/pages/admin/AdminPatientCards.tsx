import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Eye, Palette, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useClinicId } from "@/hooks/useClinic";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

const DEFAULT_LAYOUT = {
  tagline: "Health Identity Card",
  backgroundColor: "#1e293b",
  accentColor: "#4ade80",
};

const DEMO_PATIENT = {
  full_name: "Ahmad Raza",
  formatted_patient_id: "M-001",
  age: 30,
  gender: "Male",
  created_at: new Date().toLocaleDateString(),
};

const AdminPatientCards = () => {
  const { clinicId } = useClinicId();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [layout, setLayout] = useState({
    clinicName: "",
    shortName: "",
    tagline: "Health Identity Card",
    backgroundColor: "#1e293b",
    accentColor: "#4ade80",
    termsConditions: "",
    address: "",
    phone: "",
    email: "",
    workingHours: "",
    emergencyContact: "",
    qrBaseUrl: "",
    logoUrl: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: clinicData } = await supabase.from("clinics").select("*").eq("id", clinicId).single();

      if (clinicData) {
        setLayout({
          clinicName: clinicData.clinic_name || "",
          shortName: (clinicData as any).short_name || "",
          tagline: "Health Identity Card",
          backgroundColor: clinicData.card_background_color || "#1e293b",
          accentColor: clinicData.theme_color || "#4ade80",
          termsConditions: clinicData.terms_conditions || "",
          address: clinicData.address || "",
          phone: clinicData.contact_phone || "",
          email: clinicData.contact_email || "",
          workingHours: clinicData.working_hours || "",
          emergencyContact: clinicData.emergency_contact || "",
          qrBaseUrl: clinicData.qr_base_url || window.location.origin,
          logoUrl: clinicData.logo_url || "",
        });
      }

      setLoading(false);
    };
    fetchData();
  }, [clinicId]);

  const displayName = layout.shortName || layout.clinicName;
  const qrUrl = `${layout.qrBaseUrl}/patient/${DEMO_PATIENT.formatted_patient_id}`;

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("clinics").update({
      card_background_color: layout.backgroundColor,
    } as any).eq("id", clinicId);

    if (error) toast.error(error.message);
    else toast.success("Card layout saved!");
    setSaving(false);
  };

  const handleReset = async () => {
    if (!confirm("Reset card layout to defaults? This won't affect patient records.")) return;
    setSaving(true);
    const { error } = await supabase.from("clinics").update({
      card_background_color: DEFAULT_LAYOUT.backgroundColor,
    } as any).eq("id", clinicId);

    if (error) {
      toast.error(error.message);
    } else {
      setLayout((prev) => ({
        ...prev,
        backgroundColor: DEFAULT_LAYOUT.backgroundColor,
        accentColor: DEFAULT_LAYOUT.accentColor,
        tagline: DEFAULT_LAYOUT.tagline,
      }));
      toast.success("Card layout reset to defaults!");
    }
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
        <p className="text-sm text-muted-foreground">Design and customize the patient card template. Terms & Conditions are managed in Settings.</p>
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
            <p className="text-xs text-muted-foreground">
              💡 Terms & Conditions are managed from <strong>Settings → Legal</strong> and will automatically appear on patient cards.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="hero" onClick={handleSave} className="flex-1" disabled={saving}>
              <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Card Layout"}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Eye className="h-4 w-4" /> Demo Preview — This shows how your patient card will look
            </p>
          </div>

          <div className="sticky top-20">
            <div className="rounded-t-2xl border border-border p-6 text-white" style={{ backgroundColor: layout.backgroundColor }}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {layout.logoUrl ? (
                    <img src={layout.logoUrl} alt="Logo" className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                      <CreditCard className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-display text-lg font-bold">{displayName}</h3>
                    <p className="text-xs opacity-60">{layout.tagline}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-white p-1.5">
                  <QRCodeSVG value={qrUrl} size={64} level="M" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-50">Patient Name</p>
                    <p className="font-display font-semibold">{DEMO_PATIENT.full_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-50">Patient ID</p>
                    <p className="font-display text-xl font-bold" style={{ color: layout.accentColor }}>{DEMO_PATIENT.formatted_patient_id}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-50">Age</p>
                    <p className="font-medium">{DEMO_PATIENT.age}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-50">Gender</p>
                    <p className="font-medium capitalize">{DEMO_PATIENT.gender}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-50">Registered</p>
                    <p className="font-medium">{DEMO_PATIENT.created_at}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-b-2xl border border-t-0 border-border bg-card p-6">
              <h4 className="mb-2 font-display text-sm font-semibold text-foreground">Terms & Conditions</h4>
              <div className="mb-4 space-y-1">
                {layout.termsConditions ? layout.termsConditions.split("\n").map((line, i) => (
                  <p key={i} className="text-[11px] leading-relaxed text-muted-foreground">{line}</p>
                )) : (
                  <p className="text-[11px] text-muted-foreground italic">No terms configured. Add them in Settings → Legal.</p>
                )}
              </div>
              <div className="space-y-1 border-t border-border pt-3">
                {layout.address && <p className="text-[11px] text-muted-foreground">📍 {layout.address}</p>}
                {(layout.phone || layout.email) && <p className="text-[11px] text-muted-foreground">📞 {layout.phone} | ✉️ {layout.email}</p>}
                {layout.workingHours && <p className="text-[11px] text-muted-foreground">🕐 {layout.workingHours}</p>}
                {layout.emergencyContact && <p className="text-[11px] text-muted-foreground">🚨 Emergency: {layout.emergencyContact}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPatientCards;
