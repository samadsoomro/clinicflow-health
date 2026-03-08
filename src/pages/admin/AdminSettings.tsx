import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Palette, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useClinicId } from "@/hooks/useClinic";
import { toast } from "sonner";

const AdminSettings = () => {
  const { clinicId } = useClinicId();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    clinicName: "",
    shortName: "",
    subdomain: "",
    themeColor: "#0d7a5f",
    logoUrl: "",
    termsConditions: "",
    cardBackgroundColor: "#1e293b",
    qrBaseUrl: "",
    heroTitle: "",
    heroSubtitle: "",
    seoTitle: "",
    seoDescription: "",
  });

  useEffect(() => {
    const fetchClinic = async () => {
      const { data } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", clinicId)
        .single();
      if (data) {
        setForm({
          clinicName: data.clinic_name || "",
          shortName: (data as any).short_name || "",
          subdomain: data.subdomain || "",
          themeColor: data.theme_color || "#0d7a5f",
          logoUrl: data.logo_url || "",
          termsConditions: data.terms_conditions || "",
          cardBackgroundColor: data.card_background_color || "#1e293b",
          qrBaseUrl: data.qr_base_url || "",
          heroTitle: data.hero_title || "",
          heroSubtitle: data.hero_subtitle || "",
          seoTitle: data.seo_title || "",
          seoDescription: data.seo_description || "",
        });
      }
      setLoading(false);
    };
    fetchClinic();
  }, [clinicId]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("clinics")
      .update({
        clinic_name: form.clinicName,
        short_name: form.shortName,
        subdomain: form.subdomain,
        theme_color: form.themeColor,
        logo_url: form.logoUrl,
        terms_conditions: form.termsConditions,
        card_background_color: form.cardBackgroundColor,
        qr_base_url: form.qrBaseUrl,
        hero_title: form.heroTitle,
        hero_subtitle: form.heroSubtitle,
        seo_title: form.seoTitle,
        seo_description: form.seoDescription,
      } as any)
      .eq("id", clinicId);

    if (error) toast.error("Failed to save: " + error.message);
    else toast.success("Clinic settings saved!");
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
        <h2 className="font-display text-2xl font-bold text-foreground">Clinic Settings</h2>
        <p className="text-sm text-muted-foreground">Customize your clinic profile, branding, and SEO</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-display font-semibold text-foreground">General</h3>
          <div className="space-y-2">
            <Label>Clinic Name</Label>
            <Input value={form.clinicName} onChange={(e) => setForm({ ...form, clinicName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Clinic Short Name / Logo Label</Label>
            <Input value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value.slice(0, 10) })} placeholder="e.g. ZHC" maxLength={10} />
            <p className="text-xs text-muted-foreground">Max 10 characters. Appears beside your logo in the navbar. Leave empty to hide.</p>
          </div>
          <div className="space-y-2">
            <Label>Subdomain</Label>
            <div className="flex items-center gap-2">
              <Input value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value })} />
              <span className="text-sm text-muted-foreground whitespace-nowrap">.clinic.health</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>QR Base URL</Label>
            <Input value={form.qrBaseUrl} onChange={(e) => setForm({ ...form, qrBaseUrl: e.target.value })} />
          </div>

          {/* Live Preview */}
          {(form.shortName || form.logoUrl) && (
            <div className="space-y-2">
              <Label>Navbar Preview</Label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-3">
                {form.shortName && (
                  <span className="font-display text-sm font-bold text-primary">{form.shortName}</span>
                )}
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="h-8 w-8 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                )}
                <span className="font-display text-sm font-semibold text-foreground">{form.clinicName || "Clinic Name"}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="flex items-center gap-2 font-display font-semibold text-foreground">
            <Palette className="h-4 w-4" /> Appearance & Card
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Theme Color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.themeColor} onChange={(e) => setForm({ ...form, themeColor: e.target.value })} className="h-10 w-10 cursor-pointer rounded-lg border border-border" />
                <Input value={form.themeColor} onChange={(e) => setForm({ ...form, themeColor: e.target.value })} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Card Background</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.cardBackgroundColor} onChange={(e) => setForm({ ...form, cardBackgroundColor: e.target.value })} className="h-10 w-10 cursor-pointer rounded-lg border border-border" />
                <Input value={form.cardBackgroundColor} onChange={(e) => setForm({ ...form, cardBackgroundColor: e.target.value })} className="flex-1" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Terms & Conditions</Label>
            <Textarea value={form.termsConditions} onChange={(e) => setForm({ ...form, termsConditions: e.target.value })} rows={4} />
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-display font-semibold text-foreground">SEO & Meta</h3>
          <div className="space-y-2">
            <Label>SEO Title</Label>
            <Input value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} placeholder="Clinic Name - Healthcare" />
          </div>
          <div className="space-y-2">
            <Label>SEO Description</Label>
            <Textarea value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} rows={2} placeholder="Description for search engines" />
          </div>
        </div>
      </div>

      <Button variant="hero" onClick={handleSave} disabled={saving}>
        <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Settings"}
      </Button>
    </motion.div>
  );
};

export default AdminSettings;
