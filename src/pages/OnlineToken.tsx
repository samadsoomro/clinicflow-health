import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, User, Phone, Download, CheckCircle, AlertCircle, Loader2, Globe, ChevronDown, Bell, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClinicContext } from "@/hooks/useClinicContext";
import { supabase } from "@/integrations/supabase/client";
import ClinicLink from "@/components/ClinicLink";
import { toast } from "sonner";
import { generateOnlineTokenPDF } from "@/lib/onlineTokenPdf";
import { subscribeToPushNotifications } from "@/hooks/usePushNotifications";

const OnlineToken = () => {
  const { clinic, clinicId } = useClinicContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeDoctors, setActiveDoctors] = useState<any[]>([]);
  const [onlineIssuanceEnabled, setOnlineIssuanceEnabled] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [todayCount, setTodayCount] = useState(0);
  
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isForOther, setIsForOther] = useState(false);
  const [otherName, setOtherName] = useState('');
  const [otherGender, setOtherGender] = useState<'male' | 'female'>('male');
  const [otherIsChild, setOtherIsChild] = useState(false);
  
  const [issuedToken, setIssuedToken] = useState<any>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  
  const [session, setSession] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [formattedPatientId, setFormattedPatientId] = useState("");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  const today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setIsLoggedIn(!!currentSession?.user);
    };
    checkSession();
  }, []);

  useEffect(() => {
    if ('Notification' in window && session?.user) {
      setNotifPermission(Notification.permission);
    }
  }, [session?.user]);


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
          online_token_popup_second_lang_enabled,
          online_token_under_dev,
          online_token_under_dev_english,
          online_token_under_dev_urdu,
          short_name
        `)
        .eq('id', clinicId)
        .single();
        
      if (clinicData) {
        setOnlineIssuanceEnabled(clinicData.online_tokens_issuance_enabled || false);
        
        // 2. Check daily limit
        setDailyLimit(clinicData.online_tokens_daily_limit || 10);
      }

      // 3. Fetch active doctors
      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('id, name, specialization')
        .eq('clinic_id', clinicId)
        .eq('status', 'active')
        .order('name', { ascending: true });
      
      // Deduplicate by id just in case
      const uniqueDoctors = Array.from(
        new Map(doctorsData?.map(d => [d.id, d]) ?? []).values()
      );
      
      setActiveDoctors(uniqueDoctors || []);
      
      setLoading(false);
    };

    fetchData();
  }, [clinicId, today]);

  useEffect(() => {
    if (clinic?.online_tokens_enabled === false) {
      navigate("/");
    }
  }, [clinic?.online_tokens_enabled, navigate]);

  const fetchTodayCount = async () => {
    if (!clinicId) return;
    const { count } = await supabase
      .from('online_tokens')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('token_date', today);
    setTodayCount(count ?? 0);
  };

  useEffect(() => {
    if (!clinicId) return;

    // Initial fetch
    fetchTodayCount();

    // Realtime subscription — fires on every INSERT to online_tokens
    const channel = supabase
      .channel(`online-tokens-count-${clinicId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'online_tokens',
          filter: `clinic_id=eq.${clinicId}`,
        },
        () => {
          fetchTodayCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'online_tokens',
          filter: `clinic_id=eq.${clinicId}`,
        },
        () => {
          fetchTodayCount();
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinicId, today]);

  const [hasTokenToday, setHasTokenToday] = useState(false);

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

      // Check if patient already has an online token today
      const { data: existingTokens, error } = await supabase
        .from('online_tokens')
        .select('*')
        .eq('patient_id', session.user.id)
        .eq('clinic_id', clinicId)
        .eq('token_date', today)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingTokens && existingTokens.length > 0) {
        setHasTokenToday(true);
        const token = existingTokens[0];
        
        // Fetch doctor info separately since FK might be missing
        const { data: doctorData } = await supabase
          .from('doctors')
          .select('*')
          .eq('id', token.doctor_id)
          .single();
          
        setIssuedToken({ ...token, doctors: doctorData });
      } else {
        setHasTokenToday(false);
      }
    };
    
    fetchPatientData();
  }, [session?.user?.id, clinicId, today]);


  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clinic?.online_token_under_dev) {
      toast.error(clinic?.online_token_under_dev_english || 'This feature is currently under development. Please visit us physically for token issuance.');
      return;
    }
    if (!selectedDoctor || !name) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    
    try {
      // Re-fetch count right before submitting — prevents race condition
      const { count: latestCount } = await supabase
        .from('online_tokens')
        .select('id', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .eq('token_date', today);

      // Check limit with latest real count
      if ((latestCount ?? 0) >= dailyLimit) {
        toast.error("Today's online token limit has been reached. Please visit the clinic physically.");
        setTodayCount(latestCount ?? 0); // update UI immediately
        setSubmitting(false);
        return;
      }

      // Check if push subscription exists — warn if not
      const { data: subExists } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();
      
      if (!subExists) {
        // Try to auto-subscribe silently
        await subscribeToPushNotifications(session.user.id, clinicId);
      }

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
        patient_name: isForOther ? otherName.trim() : name,
        patient_phone: phone || null,
        patient_id: session.user.id,
        formatted_patient_id: isForOther ? null : (formattedPatientId || null),
        token_date: today,
        status: 'waiting',
        is_for_other: isForOther,
        other_person_name: isForOther ? otherName.trim() : null,
        other_person_gender: isForOther ? otherGender : null,
        other_is_child: isForOther ? otherIsChild : false,
      }).select().single();

      if (error) {
        toast.error("Failed to issue token: " + error.message);
      } else if (newToken) {
        // Manually attach doctor info since relationship might be missing in schema cache
        const doctorData = activeDoctors.find(d => d.id === selectedDoctor);
        const tokenWithDoctor = { ...newToken, doctors: doctorData };
        
        setIssuedToken(tokenWithDoctor);
        setHasTokenToday(true); // Update state so the form hides!
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
      await generateOnlineTokenPDF(
        issuedToken, 
        clinic,
        clinic?.short_name || clinic?.clinic_name?.slice(0, 5) || 'CLN'
      );
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

          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30 w-full max-w-sm mx-auto text-left">
            <h3 className="font-semibold text-purple-800 dark:text-purple-300 text-sm mb-3">Daily Online Token Limit</h3>
            {/* Daily limit display — updates in real-time */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Today's Reserved:</span>
              <span className={`font-bold ${
                todayCount >= dailyLimit
                  ? 'text-red-500'
                  : todayCount >= dailyLimit * 0.8
                  ? 'text-orange-500'
                  : 'text-green-600'
              }`}>
                {todayCount} / {dailyLimit}
                {todayCount >= dailyLimit && ' — Full'}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  todayCount >= dailyLimit ? 'bg-red-500' :
                  todayCount >= dailyLimit * 0.8 ? 'bg-orange-400' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min((todayCount / (dailyLimit || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {clinic?.online_token_under_dev && (
          <div className="bg-orange-500 text-white rounded-xl p-4 mb-5 flex items-start gap-3 shadow-md text-left">
            <span className="text-2xl flex-shrink-0">🚧</span>
            <div>
              <p className="font-bold text-sm">Under Development</p>
              <p className="text-sm opacity-90 mt-0.5">
                {clinic?.online_token_under_dev_english ||
                  'This feature is currently under development. Please visit us physically for token issuance.'}
              </p>
              {clinic?.online_token_under_dev_urdu && (
                <p className="text-sm opacity-90 mt-1 pt-1 border-t border-orange-400"
                  dir="rtl" style={{ fontFamily: 'serif' }}>
                  {clinic.online_token_under_dev_urdu}
                </p>
              )}
            </div>
          </div>
        )}

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

        {isLoggedIn && hasTokenToday && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center space-y-3 mt-4">
            <CheckCircle className="h-8 w-8 text-blue-500 mx-auto" />
            <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100">Token Already Issued</h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
              You have already received an online token for today. You can only get one online token per day. Please check your token receipt.
            </p>
            <Button 
               onClick={() => setShowTokenModal(true)}
               variant="outline"
               className="w-full text-xs border-blue-300 text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900/50"
            >
               View Your Past Online Token
            </Button>
          </div>
        )}

        {isLoggedIn && !hasTokenToday && (todayCount >= dailyLimit) && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center space-y-3 mt-4">
            <Ticket className="h-8 w-8 text-red-500 mx-auto" />
            <h3 className="font-bold text-lg text-red-900 dark:text-red-100">Token Limit Reached</h3>
            <p className="text-sm text-red-800 dark:text-red-200">
              Today's daily online token limit is {todayCount} by {dailyLimit} limit. You are now not able to get a token today. Please visit physically our hospital or clinic.
            </p>
          </div>
        )}

        {isLoggedIn && !hasTokenToday && (todayCount < dailyLimit) && (
          <form onSubmit={handleRequestToken} className="space-y-5">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-5 mt-4">
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

            {/* Notification enrollment prompt */}
            {isLoggedIn && notifPermission !== 'granted' && (
              <div className="mb-5 bg-orange-50 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Bell size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                      Enable notifications for token alerts
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-300 mt-0.5">
                      Get notified on your phone when your token number is near — so you know when to leave for the clinic.
                    </p>
                    {notifPermission === 'denied' ? (
                      <p className="text-xs text-red-500 mt-2">
                        ⚠️ Notifications are blocked. Go to Chrome → Settings → Site Settings → Notifications → allow this site.
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          const { data: { session: s } } = await supabase.auth.getSession();
                          if (!s?.user) return;
                          const ok = await subscribeToPushNotifications(s.user.id, clinicId);
                          if (ok) {
                            setNotifPermission('granted');
                            toast.success('Notifications enabled! You will be alerted when your token is near.');
                          } else {
                            setNotifPermission(Notification.permission as NotificationPermission);
                          }
                        }}
                        className="mt-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        🔔 Enable Token Alerts
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Doctor <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  required
                  className="w-full appearance-none bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-400 focus:border-blue-500 rounded-xl px-4 py-3 pr-10 text-sm font-medium transition-colors cursor-pointer"
                >
                  <option value="">👨‍⚕️ Choose a Doctor...</option>
                  {activeDoctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.specialization?.trim()}
                    </option>
                  ))}
                </select>
                {/* Dropdown arrow icon */}
                <div className="absolute right-3 top-[42px] pointer-events-none text-gray-400">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Patient Name</Label>
                {!isForOther ? (
                  // Own name — read only (existing behavior)
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-sm border border-gray-100 dark:border-gray-600">
                    <span className="text-gray-400 text-xs block mb-1">Patient Name</span>
                    <span className="font-semibold text-foreground">{name || 'Loading...'}</span>
                    {formattedPatientId && (
                      <span className="ml-2 text-xs text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">({formattedPatientId})</span>
                    )}
                  </div>
                ) : (
                  // Other person fields
                  <div className="border-2 border-purple-200 dark:border-purple-700 rounded-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-purple-500 px-4 py-3 flex items-center gap-2">
                      <UserPlus size={16} className="text-white" />
                      <p className="text-white text-sm font-semibold">Other Person's Details</p>
                    </div>

                    <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
                      <p className="text-xs text-gray-400">
                        Your account's daily token limit will be used. Token will be issued in this person's name.
                      </p>

                      {/* Full Name */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={otherName}
                          onChange={(e) => setOtherName(e.target.value)}
                          placeholder="Enter their full name"
                          className="w-full border-2 border-gray-200 dark:border-gray-600 focus:border-purple-400 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-700 outline-none transition-colors"
                        />
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                          Gender
                        </label>
                        <div className="flex gap-3">
                          {[
                            { value: 'male', label: 'Male', icon: <User size={14} /> },
                            { value: 'female', label: 'Female', icon: <User size={14} /> },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setOtherGender(opt.value as 'male' | 'female')}
                              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                                otherGender === opt.value
                                  ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-400 text-purple-700 dark:text-purple-300'
                                  : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-purple-200'
                              }`}
                            >
                              {opt.icon}
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Child toggle */}
                      <button
                        type="button"
                        onClick={() => setOtherIsChild(!otherIsChild)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                          otherIsChild
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
                            : 'border-gray-200 dark:border-gray-600 hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                            otherIsChild ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'
                          }`}>
                            👶
                          </div>
                          <span className={`text-sm font-medium ${
                            otherIsChild ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500'
                          }`}>
                            This person is a child
                          </span>
                        </div>
                        <div className={`w-9 h-5 rounded-full transition-colors relative ${
                          otherIsChild ? 'bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'
                        }`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            otherIsChild ? 'translate-x-4' : 'translate-x-0.5'
                          }`} />
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* "For another person" toggle — replace plain checkbox with styled card */}
              <button
                type="button"
                onClick={() => {
                  setIsForOther(!isForOther);
                  if (isForOther) {
                    setOtherName('');
                    setOtherGender('male');
                    setOtherIsChild(false);
                  }
                }}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  isForOther
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-400 dark:border-purple-500'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    isForOther ? 'bg-purple-100 dark:bg-purple-800' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    <Users size={18} className={isForOther ? 'text-purple-600 dark:text-purple-300' : 'text-gray-400'} />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${isForOther ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-300'}`}>
                      Get token for another person
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Family member, child, or someone else
                    </p>
                  </div>
                </div>
                {/* Toggle pill */}
                <div className={`w-11 h-6 rounded-full transition-colors relative ${
                  isForOther ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    isForOther ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </div>
              </button>
            </div>

            <Button 
              type={clinic?.online_token_under_dev ? "button" : "submit"}
              onClick={clinic?.online_token_under_dev ? () => toast.error(clinic?.online_token_under_dev_english || 'This feature is currently under development. Please visit us physically for token issuance.') : undefined}
              className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 rounded-xl mt-4 shadow-lg shadow-purple-200 dark:shadow-none transition-all ${
                clinic?.online_token_under_dev ? 'opacity-60 cursor-not-allowed hover:bg-purple-600' : ''
              }`}
              disabled={!clinic?.online_token_under_dev && (submitting || !selectedDoctor || !name || (isForOther && !otherName.trim()))}
            >
              {clinic?.online_token_under_dev ? '🚧 Coming Soon' : submitting ? (
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
                  <p className="text-sm font-medium text-white/90">{issuedToken.doctors?.name || selectedDoctorData?.name}</p>
                  <p className="text-xs text-white/70">{clinic?.clinic_name}</p>
                  <p className="text-[10px] text-white/50">{new Date().toLocaleDateString()} — {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="mt-6 border-t border-white/20 pt-4 bg-orange-500/20 rounded-b-xl -mx-8 -mb-8 p-4">
                  <p className="text-[10px] font-bold text-orange-100 uppercase tracking-tighter">
                    Present this slip at reception
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
                  
                  {/* Notification reminder inside modal */}
                  
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
