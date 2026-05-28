import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { generatePatientCardPDF } from '@/lib/patientCardPdf';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, ArrowLeft, Download, Shield } from "lucide-react";

export default function PatientCard() {
  const [patient, setPatient] = useState<any>(null);
  const [clinic, setClinic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Step 1: get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          setError('You are not logged in. Please login to view your patient card.');
          setLoading(false);
          return;
        }

        const userId = session.user.id;

        // Step 2: fetch patient record
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (patientError) {
          setError('Error loading patient data: ' + patientError.message);
          setLoading(false);
          return;
        }

        if (!patientData) {
          setError('No patient record found for your account. Please register as a patient first.');
          setLoading(false);
          return;
        }

        // Step 3: fetch clinic using patient's own clinic_id
        const { data: clinicData, error: clinicError } = await supabase
          .from('clinics')
          .select('*')
          .eq('id', patientData.clinic_id)
          .maybeSingle();

        if (clinicError) {
          setError('Error loading clinic data: ' + clinicError.message);
          setLoading(false);
          return;
        }

        if (!clinicData) {
          setError('Clinic not found.');
          setLoading(false);
          return;
        }

        // Step 4: set both — this triggers the card render
        setPatient(patientData);
        setClinic(clinicData);
      } catch (err: any) {
        setError('Unexpected error: ' + (err?.message || 'Unknown'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-lg text-muted-foreground font-semibold">Loading your patient card...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-destructive/5 py-12 px-4">
        <div className="text-center p-8 max-w-md w-full bg-card border border-destructive/20 rounded-3xl shadow-xl">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-destructive font-bold text-lg mb-6 leading-relaxed">{error}</p>
          <Link to="/login" className="inline-block bg-primary text-primary-foreground font-bold px-8 py-3 rounded-xl transition-all shadow-md hover:shadow-primary/25 hover:-translate-y-0.5">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Safety fallback
  if (!patient || !clinic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Patient data unavailable.</p>
      </div>
    );
  }

  // Use clinic's saved colors, fallback to defaults
  const bgColor = clinic.card_background_color || '#1e293b';
  const accentColor = clinic.theme_color || '#0ea5e9';
  const clinicInitials = clinic.short_name || clinic.clinic_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase();

  return (
    <div className="relative min-h-[100vh] overflow-hidden bg-background py-16 px-4">
      {/* Decorative Background Glow Orbs */}
      <div className="absolute inset-0 opacity-35 z-0 mix-blend-screen pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} 
          className="absolute right-[-10%] top-[5%] h-[35rem] w-[35rem] rounded-full bg-primary/20 blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.25, 1], opacity: [0.1, 0.25, 0.1] }} 
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }} 
          className="absolute bottom-[10%] left-[-10%] h-[30rem] w-[30rem] rounded-full bg-accent/20 blur-[100px]" 
        />
      </div>

      <div className="relative z-10 max-w-[480px] mx-auto space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-semibold text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)] backdrop-blur-md">
            <Shield className="h-4 w-4 text-primary animate-pulse" />
            Patient Portal
          </div>
          <h1 className="font-display text-3xl font-extrabold text-foreground tracking-tight">Your Health ID Card</h1>
        </motion.div>

        {/* CARD CONTAINER */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="rounded-[2.5rem] overflow-hidden border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:scale-[1.01] hover:shadow-primary/5 hover:border-primary/20"
        >
          {/* Top section — dark background using clinic colors */}
          <div 
            className="p-8 text-white relative overflow-hidden" 
            style={{ 
              backgroundColor: bgColor,
              backgroundImage: `linear-gradient(135deg, ${bgColor} 0%, color-mix(in srgb, ${bgColor} 80%, black) 100%)` 
            }}
          >
            <div className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-4">
                {clinic.logo_url ? (
                  <img src={clinic.logo_url} alt="logo" className="h-14 w-14 rounded-2xl object-cover shadow-md border-2 border-white/10" loading="lazy" />
                ) : (
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-md" style={{ backgroundColor: accentColor }}>
                    {clinicInitials}
                  </div>
                )}
                <div>
                  <div className="font-display font-extrabold text-xl tracking-tight leading-none">{clinicInitials}</div>
                  <div className="text-xs text-white/70 font-medium tracking-wide mt-1 uppercase">Health Identity Card</div>
                </div>
              </div>

              {clinic.qr_base_url && (
                <div className="p-1.5 bg-white rounded-xl shadow-md border border-white/20 hover:scale-105 transition-transform duration-300">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(clinic.qr_base_url)}`}
                    alt="QR Code"
                    className="h-16 w-16"
                    loading="lazy"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-4 mt-8 pt-6 border-t border-white/10">
              <div>
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Patient Name</span>
                <span className="font-display font-bold text-lg block mt-0.5">{patient.full_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Patient ID</span>
                <span className="font-display font-extrabold text-lg block mt-0.5" style={{ color: accentColor }}>
                  {patient.patient_id || patient.formatted_patient_id || patient.id}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Age</span>
                <span className="font-semibold text-base block mt-0.5">{patient.age}</span>
              </div>
              <div>
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Gender</span>
                <span className="font-semibold text-base block mt-0.5 capitalize">{patient.gender}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Registered Date</span>
                <span className="font-semibold text-base block mt-0.5">
                  {new Date(patient.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom section — white/light background containing terms & contact */}
          <div className="bg-card p-8 space-y-6 border-t border-border/60">
            {clinic.terms_conditions && (
              <div className="space-y-2">
                <h4 className="font-display font-extrabold text-sm text-foreground tracking-tight">Terms & Conditions</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{clinic.terms_conditions}</p>
              </div>
            )}

            <div className="space-y-3 pt-5 border-t border-border/50 text-slate-700 dark:text-slate-300 font-semibold text-sm">
              {clinic.address && (
                <div className="flex items-start gap-3 group">
                  <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="leading-relaxed font-medium text-slate-600 dark:text-slate-400">{clinic.address}</span>
                </div>
              )}
              {clinic.contact_phone && (
                <div className="flex items-center gap-3 group">
                  <Phone className="h-4 w-4 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-slate-600 dark:text-slate-400">{clinic.contact_phone}</span>
                </div>
              )}
              {clinic.contact_email && (
                <div className="flex items-center gap-3 group border-t border-dashed border-border/40 pt-2">
                  <Mail className="h-4 w-4 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-slate-600 dark:text-slate-400 break-all">{clinic.contact_email}</span>
                </div>
              )}
              {clinic.working_hours && (
                <div className="flex items-start gap-3 group">
                  <Clock className="h-4 w-4 mt-0.5 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-slate-600 dark:text-slate-400">{clinic.working_hours}</span>
                </div>
              )}
            </div>

            <div className="text-center pt-4 border-t border-border/45 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.25em]">
              Validated Digital Health Record
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-4 text-center"
        >
          <button
            onClick={() => generatePatientCardPDF(patient, clinic)}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-teal-600/25 hover:-translate-y-0.5 flex items-center justify-center gap-3 text-base"
          >
            <Download className="h-5 w-5" /> Download Patient Card PDF
          </button>

          <Link 
            to="/" 
            className="inline-flex items-center gap-2 mt-4 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors text-sm font-bold"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
