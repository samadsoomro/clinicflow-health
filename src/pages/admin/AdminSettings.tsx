import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Palette, Activity, Upload, Loader2, QrCode, Scale, Map, RotateCcw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useClinicId } from "@/hooks/useClinic";
import { useClinicContext } from "@/hooks/useClinicContext";
import { toast } from "sonner";
import { compressImage } from "@/lib/imageUtils";

const AdminSettings = () => {
  const { clinicId } = useClinicId();
  const { refreshClinic, clearClinicCache } = useClinicContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [liveTokensEnabled, setLiveTokensEnabled] = useState(true);
  const [onlineTokensEnabled, setOnlineTokensEnabled] = useState(false);
  const [form, setForm] = useState({

    clinicName: "",
    shortName: "",
    subdomain: "",
    logoUrl: "",
    qrBaseUrl: "",
    themeColor: "#218a6b",
    secondaryThemeColor: "#162a30",
    termsConditions: "",
    mapsEmbedUrl: "",
  });

  useEffect(() => {
    const fetchClinic = async () => {
      const { data } = await supabase
        .from("clinics")
        .select("clinic_name, short_name, subdomain, logo_url, qr_base_url, theme_color, secondary_theme_color, terms_conditions, maps_embed_url, live_tokens_enabled, online_tokens_enabled")
        .eq("id", clinicId)
        .single();

      if (data) {
        setForm({
          clinicName: data.clinic_name || "",
          shortName: (data as any).short_name || "",
          subdomain: data.subdomain || "",
          logoUrl: data.logo_url || "",
          qrBaseUrl: data.qr_base_url || "",
          themeColor: data.theme_color || "#0ea5e9",
          secondaryThemeColor: (data as any).secondary_theme_color || "#1e293b",
          termsConditions: data.terms_conditions || "",
          mapsEmbedUrl: (data as any).maps_embed_url || "",
        });
        setLiveTokensEnabled(data.live_tokens_enabled ?? true);
        setOnlineTokensEnabled(data.online_tokens_enabled ?? false);
      }
      setLoading(false);
    };

    };
    fetchClinic();
  }, [clinicId]);

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);

    // OPT 1: Delete the old logo file from storage before uploading new one
    if (form.logoUrl) {
      const oldPath = form.logoUrl.split('/clinic-assets/')[1];
      if (oldPath) {
        await supabase.storage.from('clinic-assets').remove([oldPath]);
      }
    }

    // OPT 5: Compress image before upload
    const compressed = await compressImage(file);

    const ext = "jpg";
    const path = `${clinicId}/logo/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("clinic-assets").upload(path, compressed, { upsert: true });
    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploadingLogo(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("clinic-assets").getPublicUrl(path);
    const newUrl = urlData.publicUrl;
    const { error: updateErr } = await supabase
      .from("clinics")
      .update({ logo_url: newUrl } as any)
      .eq("id", clinicId);
    if (updateErr) {
      toast.error("Failed to save logo: " + updateErr.message);
    } else {
      setForm((prev) => ({ ...prev, logoUrl: newUrl }));
      clearClinicCache();
      await refreshClinic();
      toast.success("Logo uploaded and saved!");
    }
    setUploadingLogo(false);
  };

  const isValidMapsUrl = (url: string) => !url || url.startsWith("https://www.google.com/maps/embed");

  const handleSave = async () => {
    if (!isValidMapsUrl(form.mapsEmbedUrl)) {
      toast.error("Please enter a valid Google Maps embed URL starting with https://www.google.com/maps/embed");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("clinics")
      .update({
        clinic_name: form.clinicName,
        short_name: form.shortName,
        subdomain: form.subdomain,
        logo_url: form.logoUrl,
        qr_base_url: form.qrBaseUrl,
        theme_color: form.themeColor,
        secondary_theme_color: form.secondaryThemeColor,
        terms_conditions: form.termsConditions,
        maps_embed_url: form.mapsEmbedUrl,
        live_tokens_enabled: liveTokensEnabled,
      } as any)
      .eq("id", clinicId);


    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      // Apply colors immediately so public site updates without a page refresh
      document.documentElement.style.setProperty('--theme-color', form.themeColor);
      document.documentElement.style.setProperty('--secondary-theme-color', form.secondaryThemeColor);
      clearClinicCache();
      await refreshClinic();
      toast.success("Clinic settings saved!");
    }
    setSaving(false);
  };

  const handleResetDefault = async () => {
    const defaultTheme = '#218a6b';
    const defaultSecondary = '#162a30';

    // Update local state so the color pickers show reset values instantly
    setForm((prev) => ({
      ...prev,
      themeColor: defaultTheme,
      secondaryThemeColor: defaultSecondary,
    }));

    // Save to DB
    const { error } = await supabase
      .from('clinics')
      .update({
        theme_color: defaultTheme,
        secondary_theme_color: defaultSecondary,
      } as any)
      .eq('id', clinicId);

    if (error) {
      toast.error('Failed to reset theme: ' + error.message);
      return;
    }

    // Apply to page immediately
    document.documentElement.style.setProperty('--theme-color', defaultTheme);
    document.documentElement.style.setProperty('--secondary-theme-color', defaultSecondary);
    clearClinicCache();
    await refreshClinic();
    toast.success('Theme colors reset to defaults!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!clinicId) return <div className="p-8 text-center text-muted-foreground italic">No clinic found. Please contact support.</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Clinic Settings</h2>
        <p className="text-sm text-muted-foreground">Configure your clinic identity, branding, and legal information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Section 1 — Clinic Identity */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-display font-semibold text-foreground">Clinic Identity</h3>

          <div className="space-y-2">
            <Label>Clinic Name</Label>
            <Input value={form.clinicName} onChange={(e) => setForm({ ...form, clinicName: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Clinic Short Name / Logo Label</Label>
            <Input
              value={form.shortName}
              onChange={(e) => setForm({ ...form, shortName: e.target.value.slice(0, 10) })}
              placeholder="e.g. ZHC"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">Max 10 characters. Appears beside your logo in the navbar.</p>
          </div>

          <div className="space-y-2">
            <Label>Subdomain</Label>
            <div className="flex items-center gap-2">
              <Input value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value })} />
              <span className="text-sm text-muted-foreground whitespace-nowrap">.clinic.health</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Clinic Logo</Label>
            <div className="flex items-center gap-3">
              {form.logoUrl && (
                <img src={form.logoUrl} alt="Logo" className="h-12 w-12 rounded-lg border border-border object-cover" />
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
                {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingLogo ? "Uploading..." : "Upload Logo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingLogo}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Used in Navbar, Footer, Live Token TV Display, and Patient Cards.</p>
          </div>

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

        {/* Section 2 — QR Configuration */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="flex items-center gap-2 font-display font-semibold text-foreground">
            <QrCode className="h-4 w-4" /> QR Configuration
          </h3>
          <div className="space-y-2">
            <Label>QR Base URL</Label>
            <Input
              value={form.qrBaseUrl}
              onChange={(e) => setForm({ ...form, qrBaseUrl: e.target.value })}
              placeholder="https://zahida.clinic.health"
            />
            <p className="text-xs text-muted-foreground">
              Base URL used to generate QR codes for patient cards, appointment check-in, and patient profile links.
            </p>
          </div>
          {form.qrBaseUrl && (
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Example generated link:</p>
              <code className="text-xs text-foreground">{form.qrBaseUrl}/patient/123</code>
            </div>
          )}
        </div>

        {/* Section 3 — Website Theme */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display font-semibold text-foreground">
              <Palette className="h-4 w-4" /> Website Theme
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDefault}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset Default
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Controls website appearance: navbar, buttons, links, and homepage accents. Does not affect patient card design.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Primary Theme Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.themeColor}
                  onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-border"
                />
                <Input value={form.themeColor} onChange={(e) => setForm({ ...form, themeColor: e.target.value })} className="flex-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secondary Theme Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.secondaryThemeColor}
                  onChange={(e) => setForm({ ...form, secondaryThemeColor: e.target.value })}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-border"
                />
                <Input value={form.secondaryThemeColor} onChange={(e) => setForm({ ...form, secondaryThemeColor: e.target.value })} className="flex-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4 — Google Maps */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="flex items-center gap-2 font-display font-semibold text-foreground">
            <Map className="h-4 w-4" /> Google Maps Embed
          </h3>
          <div className="space-y-2">
            <Label>Google Maps Embed URL</Label>
            <Input
              value={form.mapsEmbedUrl}
              onChange={(e) => setForm({ ...form, mapsEmbedUrl: e.target.value })}
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
            {form.mapsEmbedUrl && !form.mapsEmbedUrl.startsWith("https://www.google.com/maps/embed") && (
              <p className="text-xs text-destructive font-medium">
                Please paste a valid Google Maps embed URL. It should start with https://www.google.com/maps/embed
              </p>
            )}
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium">How to get this URL:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Open Google Maps</li>
                <li>Search your clinic location</li>
                <li>Click Share</li>
                <li>Click "Embed a map"</li>
                <li>Copy only the URL inside <code className="bg-muted px-1 rounded">src="..."</code> and paste it here</li>
              </ol>
            </div>
          </div>
          {form.mapsEmbedUrl && (
            <div className="overflow-hidden rounded-lg border border-border">
              <iframe src={form.mapsEmbedUrl} width="100%" height="200" style={{ border: 0 }} allowFullScreen loading="lazy" title="Map Preview" />
            </div>
          )}
        </div>

        {/* Section 5 — Legal */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <h3 className="flex items-center gap-2 font-display font-semibold text-foreground">
            <Scale className="h-4 w-4" /> Legal
          </h3>
          <div className="space-y-2">
            <Label>Terms & Conditions</Label>
            <Textarea
              value={form.termsConditions}
              onChange={(e) => setForm({ ...form, termsConditions: e.target.value })}
              rows={6}
              placeholder="Enter your clinic's terms and conditions..."
            />
            <p className="text-xs text-muted-foreground">
              Appears on patient registration pages, patient card pages, and footer links.
            </p>
          </div>
        </div>

        {/* Section 6 — Website Controls */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <h3 className="flex items-center gap-2 font-display font-semibold text-foreground">
            <Settings className="h-4 w-4" /> Website Controls
          </h3>
          <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/30">
            <div>
              <h3 className="font-semibold text-sm">Live Tokens Menu</h3>
              <p className="text-xs text-muted-foreground">Show or hide the Live Tokens menu on the public website</p>
            </div>
            <input
              type="checkbox"
              checked={liveTokensEnabled}
              onChange={async (e) => {
                const checked = e.target.checked;
                setLiveTokensEnabled(checked);
                const { error } = await supabase.from('clinics').update({ live_tokens_enabled: checked }).eq('id', clinicId);
                if (error) {
                  toast.error("Failed to update: " + error.message);
                  setLiveTokensEnabled(!checked);
                } else {
                  toast.success(checked ? 'Live Tokens menu enabled' : 'Live Tokens menu disabled');
                  await refreshClinic();
                }
              }}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/30">
            <div>
              <h3 className="font-semibold text-sm">Online Tokens Feature</h3>
              <p className="text-xs text-muted-foreground">Enable or disable the online token system for your clinic</p>
            </div>
            <input
              type="checkbox"
              checked={onlineTokensEnabled}
              onChange={async (e) => {
                const checked = e.target.checked;
                setOnlineTokensEnabled(checked);
                const { error } = await supabase.from('clinics').update({ online_tokens_enabled: checked }).eq('id', clinicId);
                if (error) {
                  toast.error("Failed to update: " + error.message);
                  setOnlineTokensEnabled(!checked);
                } else {
                  toast.success('Online tokens feature ' + (checked ? 'enabled' : 'disabled'));
                  await refreshClinic();
                }
              }}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
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
