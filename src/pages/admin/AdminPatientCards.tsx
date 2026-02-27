import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { mockPatients } from "@/data/mockData";
import { generatePatientCardPDF } from "@/lib/patientCardPdf";
import { toast } from "sonner";

const AdminPatientCards = () => {
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const selectedPatient = mockPatients.find((p) => p.id === selectedPatientId);

  const clinicInfo = {
    name: "ClinicToken Demo Clinic",
    address: "123 Healthcare Avenue, Medical District, Karachi 75500",
    phone: "+92 300 1234567",
    email: "support@clinictoken.health",
    workingHours: "Mon–Sat: 9:00 AM – 9:00 PM",
    emergencyContact: "+92 300 9999999",
    termsConditions: "1. This card must be presented at every visit.\n2. Patient ID is non-transferable.\n3. Clinic reserves the right to update terms.\n4. Appointments are subject to doctor availability.\n5. Emergency services available 24/7 at emergency contact.",
    qrBaseUrl: "https://clinictoken.health",
  };

  const handleDownload = async () => {
    if (!selectedPatient) {
      toast.error("Please select a patient");
      return;
    }
    try {
      const pdfBytes = await generatePatientCardPDF(selectedPatient, clinicInfo);
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `patient-card-${selectedPatient.formattedPatientId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Patient card downloaded!");
    } catch (err) {
      toast.error("Failed to generate PDF");
      console.error(err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Patient Cards</h2>
        <p className="text-sm text-muted-foreground">Generate and download patient identity cards</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2 sm:w-80">
          <Label>Select Patient</Label>
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger><SelectValue placeholder="Choose a patient" /></SelectTrigger>
            <SelectContent>
              {mockPatients.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.formattedPatientId} — {p.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="hero" onClick={handleDownload} disabled={!selectedPatient}>
          <Download className="mr-2 h-4 w-4" /> Download PDF
        </Button>
      </div>

      {/* Card Preview */}
      {selectedPatient && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Eye className="h-4 w-4" /> Card Preview
          </p>

          {/* Card Front - Top Half */}
          <div className="rounded-t-2xl border border-border gradient-hero p-6 text-primary-foreground">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/10 backdrop-blur-sm">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold">{clinicInfo.name}</h3>
                <p className="text-xs text-primary-foreground/60">Health Identity Card</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/50">Patient Name</p>
                  <p className="font-display font-semibold">{selectedPatient.fullName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/50">Patient ID</p>
                  <p className="font-display text-xl font-bold">{selectedPatient.formattedPatientId}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/50">Age</p>
                  <p className="font-medium">{selectedPatient.age}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/50">Gender</p>
                  <p className="font-medium capitalize">{selectedPatient.gender}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/50">Registered</p>
                  <p className="font-medium">{selectedPatient.createdAt}</p>
                </div>
              </div>
              <div className="mt-2 flex justify-center rounded-lg bg-primary-foreground/10 p-3">
                <div className="text-center text-xs text-primary-foreground/70">
                  QR Code Area<br />
                  <span className="text-[10px]">{clinicInfo.qrBaseUrl}/patient/{selectedPatient.formattedPatientId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Back - Bottom Half */}
          <div className="rounded-b-2xl border border-t-0 border-border bg-card p-6">
            <h4 className="mb-2 font-display text-sm font-semibold text-foreground">Terms & Conditions</h4>
            <div className="mb-4 space-y-1">
              {clinicInfo.termsConditions.split("\n").map((line, i) => (
                <p key={i} className="text-[11px] leading-relaxed text-muted-foreground">{line}</p>
              ))}
            </div>
            <div className="space-y-1 border-t border-border pt-3">
              <p className="text-[11px] text-muted-foreground">📍 {clinicInfo.address}</p>
              <p className="text-[11px] text-muted-foreground">📞 {clinicInfo.phone} | ✉️ {clinicInfo.email}</p>
              <p className="text-[11px] text-muted-foreground">🕐 {clinicInfo.workingHours}</p>
              <p className="text-[11px] text-muted-foreground">🚨 Emergency: {clinicInfo.emergencyContact}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AdminPatientCards;
