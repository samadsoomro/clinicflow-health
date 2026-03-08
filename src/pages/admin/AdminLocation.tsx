import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useClinicId } from "@/hooks/useClinic";
import { toast } from "sonner";

const AdminLocation = () => {
  const { clinicId } = useClinicId();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    address: "",
    latitude: "",
    longitude: "",
    phone: "",
    email: "",
    workingHours: "",
    emergencyContact: "",
  });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("clinics")
        .select("address, latitude, longitude, contact_phone, contact_email, working_hours, emergency_contact")
        .eq("id", clinicId)
        .single();
      if (data) {
        setForm({
          address: data.address || "",
          latitude: data.latitude?.toString() || "",
          longitude: data.longitude?.toString() || "",
          phone: data.contact_phone || "",
          email: data.contact_email || "",
          workingHours: data.working_hours || "",
          emergencyContact: data.emergency_contact || "",
        });
      }
      setLoading(false);
    };
    fetch();
  }, [clinicId]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("clinics").update({
      address: form.address,
      latitude: parseFloat(form.latitude) || 0,
      longitude: parseFloat(form.longitude) || 0,
      contact_phone: form.phone,
      contact_email: form.email,
      working_hours: form.workingHours,
      emergency_contact: form.emergencyContact,
    }).eq("id", clinicId);

    if (error) toast.error("Failed to save: " + error.message);
    else toast.success("Location & contact info saved!");
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
        <h2 className="font-display text-2xl font-bold text-foreground">Location & Contact</h2>
        <p className="text-sm text-muted-foreground">Manage your clinic's location and contact information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-display font-semibold text-foreground">Address & Map</h3>
          <div className="space-y-2">
            <Label>Full Address</Label>
            <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
            </div>
          </div>
          {form.latitude && form.longitude && (
            <div className="overflow-hidden rounded-xl border border-border">
              <iframe
                title="Preview"
                className="h-48 w-full"
                src={`https://www.google.com/maps?q=${form.latitude},${form.longitude}&output=embed`}
                loading="lazy"
              />
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-display font-semibold text-foreground">Contact Information</h3>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Working Hours</Label>
            <Input value={form.workingHours} onChange={(e) => setForm({ ...form, workingHours: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Emergency Contact</Label>
            <Input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
          </div>
        </div>
      </div>

      <Button variant="hero" onClick={handleSave} disabled={saving}>
        <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
      </Button>
    </motion.div>
  );
};

export default AdminLocation;
