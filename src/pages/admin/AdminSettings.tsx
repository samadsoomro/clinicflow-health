import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AdminSettings = () => {
  const [form, setForm] = useState({
    clinicName: "ClinicToken Demo Clinic",
    subdomain: "democlinic",
    themeColor: "#0d7a5f",
    logoUrl: "",
    termsConditions: "1. This card must be presented at every visit.\n2. Patient ID is non-transferable.\n3. Clinic reserves the right to update terms.\n4. Appointments are subject to doctor availability.\n5. Emergency services available 24/7 at emergency contact.",
    cardBackgroundColor: "#0d3d2e",
    qrBaseUrl: "https://clinictoken.health",
  });

  const handleSave = () => {
    toast.success("Clinic settings saved!");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Clinic Settings</h2>
        <p className="text-sm text-muted-foreground">Customize your clinic profile and appearance</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-display font-semibold text-foreground">General</h3>
          <div className="space-y-2">
            <Label>Clinic Name</Label>
            <Input value={form.clinicName} onChange={(e) => setForm({ ...form, clinicName: e.target.value })} />
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
            <Textarea value={form.termsConditions} onChange={(e) => setForm({ ...form, termsConditions: e.target.value })} rows={6} />
          </div>
        </div>
      </div>

      <Button variant="hero" onClick={handleSave}>
        <Save className="mr-2 h-4 w-4" /> Save Settings
      </Button>
    </motion.div>
  );
};

export default AdminSettings;
