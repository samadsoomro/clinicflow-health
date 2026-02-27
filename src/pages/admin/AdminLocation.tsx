import { useState } from "react";
import { motion } from "framer-motion";
import { Save, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AdminLocation = () => {
  const [form, setForm] = useState({
    address: "123 Healthcare Avenue, Medical District, Karachi 75500",
    latitude: "24.8607",
    longitude: "67.0011",
    phone: "+92 300 1234567",
    email: "support@clinictoken.health",
    workingHours: "Mon–Sat: 9:00 AM – 9:00 PM",
    emergencyContact: "+92 300 9999999",
  });

  const handleSave = () => {
    toast.success("Location & contact info saved!");
  };

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
          <div className="overflow-hidden rounded-xl border border-border">
            <iframe
              title="Preview"
              className="h-48 w-full"
              src={`https://www.google.com/maps?q=${form.latitude},${form.longitude}&output=embed`}
              loading="lazy"
            />
          </div>
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

      <Button variant="hero" onClick={handleSave}>
        <Save className="mr-2 h-4 w-4" /> Save Changes
      </Button>
    </motion.div>
  );
};

export default AdminLocation;
