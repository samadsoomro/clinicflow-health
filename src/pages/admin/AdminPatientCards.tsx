import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Eye, Palette, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockPatients } from "@/data/mockData";
import { toast } from "sonner";

const AdminPatientCards = () => {
  const [previewPatientId, setPreviewPatientId] = useState(mockPatients[0]?.id || "");
  const previewPatient = mockPatients.find((p) => p.id === previewPatientId);

  const [layout, setLayout] = useState({
    clinicName: "ClinicToken Demo Clinic",
    tagline: "Health Identity Card",
    backgroundColor: "#0d3d2e",
    accentColor: "#4ade80",
    termsConditions: "1. This card must be presented at every visit.\n2. Patient ID is non-transferable.\n3. Clinic reserves the right to update terms.\n4. Appointments are subject to doctor availability.\n5. Emergency services available 24/7 at emergency contact.",
    address: "123 Healthcare Avenue, Medical District, Karachi 75500",
    phone: "+92 300 1234567",
    email: "support@clinictoken.health",
    workingHours: "Mon–Sat: 9:00 AM – 9:00 PM",
    emergencyContact: "+92 300 9999999",
    showQr: true,
  });

  const handleSave = () => {
    toast.success("Card layout saved successfully!");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Patient Card Layout</h2>
        <p className="text-sm text-muted-foreground">Design and customize the patient card template. Patients download their own cards from the public page.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Layout Editor */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="flex items-center gap-2 font-display font-semibold text-foreground">
              <Palette className="h-4 w-4" /> Card Design
            </h3>
            <div className="space-y-2">
              <Label>Clinic Name on Card</Label>
              <Input value={layout.clinicName} onChange={(e) => setLayout({ ...layout, clinicName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input value={layout.tagline} onChange={(e) => setLayout({ ...layout, tagline: e.target.value })} />
            </div>
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
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="font-display font-semibold text-foreground">Contact & Terms</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={layout.phone} onChange={(e) => setLayout({ ...layout, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={layout.email} onChange={(e) => setLayout({ ...layout, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={layout.address} onChange={(e) => setLayout({ ...layout, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Working Hours</Label>
                <Input value={layout.workingHours} onChange={(e) => setLayout({ ...layout, workingHours: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Emergency Contact</Label>
                <Input value={layout.emergencyContact} onChange={(e) => setLayout({ ...layout, emergencyContact: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Terms & Conditions</Label>
              <Textarea value={layout.termsConditions} onChange={(e) => setLayout({ ...layout, termsConditions: e.target.value })} rows={5} />
            </div>
          </div>

          <Button variant="hero" onClick={handleSave} className="w-full">
            <Save className="mr-2 h-4 w-4" /> Save Card Layout
          </Button>
        </div>

        {/* Live Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Eye className="h-4 w-4" /> Live Preview
            </p>
            <div className="w-48">
              <Select value={previewPatientId} onValueChange={setPreviewPatientId}>
                <SelectTrigger><SelectValue placeholder="Preview patient" /></SelectTrigger>
                <SelectContent>
                  {mockPatients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.formattedPatientId} — {p.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {previewPatient && (
            <div className="sticky top-20">
              {/* Card Front */}
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
                      <p className="font-display font-semibold">{previewPatient.fullName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider opacity-50">Patient ID</p>
                      <p className="font-display text-xl font-bold" style={{ color: layout.accentColor }}>{previewPatient.formattedPatientId}</p>
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
                      <p className="font-medium">{previewPatient.createdAt}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Back */}
              <div className="rounded-b-2xl border border-t-0 border-border bg-card p-6">
                <h4 className="mb-2 font-display text-sm font-semibold text-foreground">Terms & Conditions</h4>
                <div className="mb-4 space-y-1">
                  {layout.termsConditions.split("\n").map((line, i) => (
                    <p key={i} className="text-[11px] leading-relaxed text-muted-foreground">{line}</p>
                  ))}
                </div>
                <div className="space-y-1 border-t border-border pt-3">
                  <p className="text-[11px] text-muted-foreground">📍 {layout.address}</p>
                  <p className="text-[11px] text-muted-foreground">📞 {layout.phone} | ✉️ {layout.email}</p>
                  <p className="text-[11px] text-muted-foreground">🕐 {layout.workingHours}</p>
                  <p className="text-[11px] text-muted-foreground">🚨 Emergency: {layout.emergencyContact}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPatientCards;
