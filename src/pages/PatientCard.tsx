import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Download, LogIn, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { generatePatientCardPDF } from "@/lib/patientCardPdf";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getClinicId } from "@/hooks/useClinic";

const PatientCard = () => {
  const { user, loading: authLoading } = useAuth();
  const [patient, setPatient] = useState<any>(null);
  const [clinic, setClinic] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const clinicId = getClinicId();
    const fetchData = async () => {
      const [patientRes, clinicRes] = await Promise.all([
        supabase.from("patients").select("*").eq("user_id", user.id).eq("clinic_id", clinicId).single(),
        supabase.from("clinics").select("*").eq("id", clinicId).single(),
      ]);
      setPatient(patientRes.data);
      setClinic(clinicRes.data);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <section className="py-20">
        <div className="container flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="py-20 md:py-28">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-lg text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary">
              <CreditCard className="h-10 w-10 text-primary" />
            </div>
            <h1 className="mb-4 font-display text-3xl font-bold text-foreground">Patient Card</h1>
            <p className="mb-8 text-muted-foreground">Please log in to access your patient card.</p>
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

  if (!patient) {
    return (
      <section className="py-20 md:py-28">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-lg text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary">
              <CreditCard className="h-10 w-10 text-primary" />
            </div>
            <h1 className="mb-4 font-display text-3xl font-bold text-foreground">Patient Card</h1>
            <p className="mb-8 text-muted-foreground">Your patient profile was not found. Please contact the clinic.</p>
          </motion.div>
        </div>
      </section>
    );
  }

  const clinicInfo = {
    name: clinic?.clinic_name || "Clinic",
    address: clinic?.address || "",
    phone: clinic?.contact_phone || "",
    email: clinic?.contact_email || "",
    workingHours: clinic?.working_hours || "",
    emergencyContact: clinic?.emergency_contact || "",
    termsConditions: clinic?.terms_conditions || "",
    qrBaseUrl: clinic?.qr_base_url || window.location.origin,
  };

  const patientData = {
    fullName: patient.full_name,
    formattedPatientId: patient.formatted_patient_id,
    age: patient.age,
    gender: patient.gender,
    createdAt: patient.created_at?.split("T")[0] || "",
  };

  const handleDownload = async () => {
    try {
      const pdfBytes = await generatePatientCardPDF(patientData as any, clinicInfo);
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `patient-card-${patient.formatted_patient_id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Your patient card has been downloaded!");
    } catch (err) {
      toast.error("Failed to generate PDF");
      console.error(err);
    }
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Your Patient Card</h1>
            <p className="text-muted-foreground">Preview and download your health identity card</p>
          </div>

          <p className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
            <Eye className="h-4 w-4" /> Card Preview
          </p>

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
                  <p className="font-display font-semibold">{patientData.fullName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/50">Patient ID</p>
                  <p className="font-display text-xl font-bold">{patientData.formattedPatientId}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/50">Age</p>
                  <p className="font-medium">{patientData.age}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/50">Gender</p>
                  <p className="font-medium capitalize">{patientData.gender}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/50">Registered</p>
                  <p className="font-medium">{patientData.createdAt}</p>
                </div>
              </div>
            </div>
          </div>

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
