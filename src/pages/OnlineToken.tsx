import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, User, Phone, Download, CheckCircle, AlertCircle, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClinicContext } from "@/hooks/useClinicContext";
import { supabase } from "@/integrations/supabase/client";
import ClinicLink from "@/components/ClinicLink";
import { toast } from "sonner";
import { generateOnlineTokenPDF } from "@/lib/onlineTokenPdf";

const OnlineToken = () => {
  const { clinic, clinicId } = useClinicContext();
  const [loading, setLoading] = useState(true);
  const [activeDoctors, setActiveDoctors] = useState<any[]>([]);
  const [onlineIssuanceEnabled, setOnlineIssuanceEnabled] = useState(false);
  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [issuedToken, setIssuedToken] = useState<any>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  
  const [session, setSession] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [formattedPatientId, setFormattedPatientId] = useState("");

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setIsLoggedIn(!!currentSession?.user);
    };
    checkSession();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!clinicId) return;
      
      // 1. Fetch clinic settings for online tokens
      const { data: clinicData } = await supabase
        .from('clinics')
        .select(`
          online_tokens_enabled, 
          online_tokens_issuance_enabled, 
          online_tokens_daily_limit,
          online_token_guest_note_english,
          online_token_guest_note_second_lang,
          online_token_guest_note_second_lang_enabled,
          online_token_loggedin_note_english,
          online_token_loggedin_note_second_lang,
          online_token_popup_second_lang_enabled
        `)
        .eq('id', clinicId)
        .single();
        
      if (clinicData) {
        setOnlineIssuanceEnabled(clinicData.online_tokens_issuance_enabled || false);
        
        // 2. Check daily limit
        const { count } = await supabase
          .from('online_tokens')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId)
          .eq('token_date', today);
          
        if ((count || 0) >= (clinicData.online_tokens_daily_limit || 10)) {
          setDailyLimitReached(true);
        }
      }

      // 3. Fetch active doctors
      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('id, name, specialization')
        .eq('clinic_id', clinicId)
        .eq('status', 'active')
        .order('name');
      setActiveDoctors(doctorsData || []);
      
      setLoading(false);
    };

    fetchData();
  }, [clinicId, today]);

  useEffect(() => {
    if (!session?.user?.id || !clinicId) return;
    
    const fetchPatientData = async () => {
      const { data } = await supabase
        .from('patients')
        .select('full_name, phone, formatted_patient_id')
        .eq('user_id', session.user.id)
        .eq('clinic_id', clinicId)
        .single();
      
      if (data) {
        setName(data.full_name);
        setPhone(data.phone || '');
        setFormattedPatientId(data.formatted_patient_id);
      }
    };
    
    fetchPatientData();
  }, [session?.user?.id, clinicId]);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !name) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    
    try {
      // Check if doctor has "start from 1" enabled today
      const { data: doctorSetting } = await supabase
        .from('doctor_token_settings')
        .select('start_from_one')
        .eq('doctor_id', selectedDoctor)
        .eq('clinic_id', clinicId)
        .eq('setting_date', today)
        .maybeSingle();

      let nextTokenNumber;

      if (doctorSetting?.start_from_one) {
        // Count ALL tokens (walk-in + online) for this doctor today
        const { count: walkInCount } = await supabase
          .from('tokens')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId)
          .eq('doctor_id', selectedDoctor)
          .gte('created_at', today + 'T00:00:00')
          .lte('created_at', today + 'T23:59:59');

        const { count: onlineCount } = await supabase
          .from('online_tokens')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinicId)
          .eq('doctor_id', selectedDoctor)
          .eq('token_date', today);

        nextTokenNumber = (walkInCount || 0) + (onlineCount || 0) + 1;
      } else {
        // Global continuity — get max across all walk-in AND online tokens today
        const { data: lastWalkIn } = await supabase
          .from('tokens')
          .select('token_number')
          .eq('clinic_id', clinicId)
          .gte('created_at', today + 'T00:00:00')
          .lte('created_at', today + 'T23:59:59')
          .order('token_number', { ascending: false })
          .limit(1);

        const { data: lastOnline } = await supabase
          .from('online_tokens')
          .select('token_number')
          .eq('clinic_id', clinicId)
          .eq('token_date', today)
          .order('token_number', { ascending: false })
          .limit(1);

        const maxWalkIn = lastWalkIn?.[0]?.token_number || 0;
        const maxOnline = lastOnline?.[0]?.token_number || 0;
        nextTokenNumber = Math.max(maxWalkIn, maxOnline) + 1;
      }

      // Insert online token
      const { data: newToken, error } = await supabase.from('online_tokens').insert({
        clinic_id: clinicId,
        doctor_id: selectedDoctor,
        token_number: nextTokenNumber,
        patient_name: name,
        patient_phone: phone || null,
        patient_id: session.user.id,
        formatted_patient_id: formattedPatientId || null,
        token_date: today,
        status: 'waiting',
      }).select(`*, doctors(name, specialization)`).single();

      if (error) {
        toast.error("Failed to issue token: " + error.message);
      } else {
        setIssuedToken(newToken);
        setShowTokenModal(true);
        toast.success("Online token issued!");
      }
    } catch (err: any) {
      toast.error("An error occurred: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadTokenPDF = async () => {
    if (!issuedToken || !clinic) return;
    try {
      await generateOnlineTokenPDF(issuedToken, clinic);
      toast.success("Token receipt downloaded!");
    } catch (err) {
      toast.error("Failed to generate PDF");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!onlineIssuanceEnabled) {
    return (
      <div className="container py-16 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-amber-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Online Token Unavailable</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Online token system is currently turned off or unavailable. Please visit the clinic physically to get a walk-in token.
          </p>
        </div>
        <ClinicLink to="/">
          <Button variant="outline">Back to Home</Button>
        </ClinicLink>
      </div>
    );
  }

  if (dailyLimitReached) {
    return (
      <div className="container py-16 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <Ticket className="h-8 w-8 text-red-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Token Limit Reached</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Today's online token limit has been reached. No more online tokens can be issued for today. Please visit the clinic physically.
          </p>
        </div>
        <ClinicLink to="/">
          <Button variant="outline">Back to Home</Button>
        </ClinicLink>
      </div>
    );
  }

  const selectedDoctorData = activeDoctors.find(d => d.id === selectedDoctor);

  return (
    <div className="container py-12 md:py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto bg-card border border-border rounded-2xl shadow-elevated p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 mb-4">
            <Globe className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Get Online Token</h1>
          <p className="text-sm text-muted-foreground mt-2">Skip the queue by requesting your token online</p>
        </div>

        {!isLoggedIn && (
          <div className="max-w-md mx-auto mt-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-amber-500 text-xl flex-shrink-0">ℹ️</span>
                <div className="space-y-2 w-full">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {clinic?.online_token_guest_note_english ||
                      'To request an online token, please log in or register as a patient first. This service is available for registered patients only.'}
                  </p>
                  {clinic?.online_token_guest_note_second_lang_enabled && clinic?.online_token_guest_note_second_lang && (
                    <p
                      className="text-sm text-amber-800 dark:text-amber-200 border-t border-amber-200 pt-2"
                      dir="rtl"
                      style={{ fontFamily: 'serif' }}
                    >
                      {clinic.online_token_guest_note_second_lang}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <ClinicLink
                      to="/login"
                      className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Login
                    </ClinicLink>
                    <ClinicLink
                      to="/register"
                      className="text-xs border border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-100 px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Register
                    </ClinicLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoggedIn && (
          <form onSubmit={handleRequestToken} className="space-y-5">
            {isLoggedIn && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-5">
                <div className="flex items-start gap-3">
                  <span className="text-amber-500 text-xl">ℹ️</span>
                  <div>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {clinic?.online_token_loggedin_note_english ||
                        'This token is valid for one patient only. Please check the live tokens menu before arriving at the clinic. Arrive early as your number may pass if you are late.'}
                    </p>
                    {clinic?.online_token_popup_second_lang_enabled && clinic?.online_token_loggedin_note_second_lang && (
                      <p className="text-sm text-amber-800 dark:text-amber-200 mt-2 pt-2 border-t border-amber-200/50" dir="rtl" style={{ fontFamily: 'serif' }}>
                        {clinic.online_token_loggedin_note_second_lang}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="doctor">Select Doctor *</Label>
              <select 
                id="doctor"
                value={selectedDoctor} 
                onChange={(e) => setSelectedDoctor(e.target.value)} 
                required
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select Doctor</option>
                {activeDoctors.map(doc => (
                  <option key={doc.id} value={doc.id}>Dr. {doc.name} — {doc.specialization}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Patient Name</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm border border-gray-100 dark:border-gray-600">
                <span className="text-gray-400 text-xs block mb-1">Patient Name</span>
                <span className="font-semibold text-foreground">{name || 'Loading...'}</span>
                {formattedPatientId && <span className="ml-2 text-xs text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">({formattedPatientId})</span>}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 rounded-xl mt-4 shadow-lg shadow-purple-200 dark:shadow-none transition-all"
              disabled={submitting || !selectedDoctor || !name}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : "Get My Token"}
            </Button>
            
            <p className="text-[10px] text-center text-muted-foreground italic">
              * Indicates required fields
            </p>
          </form>
        )}
      </motion.div>

      {/* Token Receipt Modal */}
      <AnimatePresence>
        {showTokenModal && issuedToken && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
            >
              {/* Token Card — purple/violet */}
              <div 
                id="online-token-card"
                className="bg-gradient-to-br from-purple-600 to-violet-700 text-white p-8 text-center"
              >
                <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] uppercase tracking-widest font-bold mb-4">
                  Online Token
                </div>
                <p className="text-7xl font-black mb-2 leading-none">#{issuedToken.token_number}</p>
                <p className="font-bold text-xl truncate">{issuedToken.patient_name}</p>
                <div className="mt-4 space-y-1">
                  <p className="text-sm font-medium text-white/90">Dr. {selectedDoctorData?.name}</p>
                  <p className="text-xs text-white/70">{clinic?.clinic_name}</p>
                  <p className="text-[10px] text-white/50">{new Date().toLocaleDateString()} — {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="mt-6 border-t border-white/20 pt-4">
                  <p className="text-[10px] font-medium text-white/80 uppercase tracking-tighter">
                    Present this slip at clinical reception
                  </p>
                </div>
              </div>

              {/* Instructions & Actions */}
              <div className="p-6 space-y-4">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                    {clinic?.online_token_popup_english || 
                      'Please download your token slip and bring it to the clinic. Present this token when your number is called. Do not rely on live token count — please arrive early.'}
                  </p>
                  {clinic?.online_token_popup_second_lang_enabled && clinic?.online_token_popup_second_lang && (
                    <p 
                      className="text-sm leading-relaxed text-amber-800 dark:text-amber-200 border-t border-amber-200 dark:border-amber-800 mt-3 pt-3 font-arabic" 
                      dir="rtl"
                      style={{ fontFamily: 'serif' }}
                    >
                      {clinic.online_token_popup_second_lang}
                    </p>
                  )}
                </div>

                <Button 
                  onClick={handleDownloadTokenPDF}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 rounded-xl"
                >
                  <Download className="mr-2 h-4 w-4" /> Download Token Receipt (PDF)
                </Button>

                <Button 
                  onClick={() => setShowTokenModal(false)}
                  variant="ghost"
                  className="w-full text-muted-foreground text-sm"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnlineToken;
