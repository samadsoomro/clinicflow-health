import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Download, LogIn, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { mockPatients } from "@/data/mockData";
import { generatePatientCardPDF } from "@/lib/patientCardPdf";
import { toast } from "sonner";

const PatientCard = () => {
  const isLoggedIn = localStorage.getItem("clinictoken_role") === "patient";
  const patientId = localStorage.getItem("clinictoken_patient_id");
  const patient = mockPatients.find((p) => p.id === patientId);

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
    if (!patient) return;
    try {
      const pdfBytes = await generatePatientCardPDF(patient, clinicInfo);
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `patient-card-${patient.formattedPatientId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Your patient card has been downloaded!");
    } catch (err) {
      toast.error("Failed to generate PDF");
      console.error(err);
    }
  };

  // Not logged in
  if (!isLoggedIn) {
    return (
      <section className="py-20 md:py-28">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-lg text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary">
              <CreditCard className="h-10 w-10 text-primary" />
            </div>
            <h1 className="mb-4 font-display text-3xl font-bold text-foreground">
              Patient Card
            </h1>
            <p className="mb-8 text-muted-foreground">
              Download your personal health identity card with your registration details, patient ID, and QR code. Please log in first to access your card.
            </p>
            <Link to="/login">
              <Button variant="hero" size="lg" className="px-8">
                <LogIn className="mr-2 h-5 w-5" /> Log In to Continue
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    );
  }

  // Logged in but no patient found
  if (!patient) {
    return (
      <section className="py-20 md:py-28">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-lg text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary">
              <CreditCard className="h-10 w-10 text-primary" />
            </div>
            <h1 className="mb-4 font-display text-3xl font-bold text-foreground">
              Patient Card
            </h1>
            <p className="mb-8 text-muted-foreground">
              Your patient profile was not found. Please contact the clinic to register.
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  // Logged in with patient data — show card preview + download
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Your Patient Card</h1>
            <p className="text-muted-foreground">Preview and download your health identity card</p>
          </div>

          {/* Card Preview */}
          <p className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
            <Eye className="h-4 w-4" /> Card Preview
          </p>

          {/* Card Front */}
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
                  <p className="font-display font-semibold">{patient.fullName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/50">Patient ID</p>
                  <p className="font-display text-xl font-bold">{patient.formattedPatientId}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/50">Age</p>
                  <p className="font-medium">{patient.age}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/50">Gender</p>
                  <p className="font-medium capitalize">{patient.gender}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/50">Registered</p>
                  <p className="font-medium">{patient.createdAt}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card Back */}
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
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button variant="hero" size="lg" onClick={handleDownload}>
              <Download className="mr-2 h-5 w-5" /> Download My Card (PDF)
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PatientCard;
