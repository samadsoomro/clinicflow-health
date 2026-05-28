import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { usePublicClinicId } from "@/hooks/useClinic";

interface TokenRow {
  id: string;
  token_number: number;
  patient_name: string;
  doctor_id: string;
  status: string;
  isOnline?: boolean;
}

import { useClinicContext } from "@/hooks/useClinicContext";
import ClinicLink from "@/components/ClinicLink";
import { Button } from "@/components/ui/button";

const LiveTokens = () => {
  const clinicId = usePublicClinicId();
  const { clinic } = useClinicContext();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [allTokens, setAllTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  const fetchData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const { data: docData } = await supabase
        .from("doctors")
        .select("id, name, specialization, status")
        .eq("clinic_id", clinicId);

      const { data: tokenData } = await supabase
        .from("tokens")
        .select("id, token_number, patient_name, doctor_id, status")
        .eq("clinic_id", clinicId)
        .gte("created_at", today + "T00:00:00")
        .lte("created_at", today + "T23:59:59")
        .order("token_number", { ascending: true });

      const { data: onlineTokenData } = await supabase
        .from("online_tokens")
        .select("id, token_number, patient_name, doctor_id, status")
        .eq("clinic_id", clinicId)
        .eq("token_date", today)
        .order("token_number", { ascending: true });

      setDoctors((docData as any[]) || []);
      
      const combinedTokens = [
        ...(tokenData || []).map(t => ({ ...t, isOnline: false })),
        ...(onlineTokenData || []).map(t => ({ ...t, isOnline: true }))
      ].sort((a, b) => a.token_number - b.token_number);

      setAllTokens(combinedTokens as TokenRow[]);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);

    const walkinChannel = supabase
      .channel("live-tokens-walkin-" + clinicId)
      .on("postgres_changes", { event: "*", schema: "public", table: "tokens", filter: `clinic_id=eq.${clinicId}` }, () => fetchData())
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        } else {
          if (!pollingRef.current) {
            pollingRef.current = setInterval(() => fetchData(), 5000);
          }
        }
      });

    const onlineChannel = supabase
      .channel("live-tokens-online-" + clinicId)
      .on("postgres_changes", { event: "*", schema: "public", table: "online_tokens", filter: `clinic_id=eq.${clinicId}` }, () => fetchData())
      .subscribe();

    // Start polling as backup initially
    pollingRef.current = setInterval(() => fetchData(), 5000);

    return () => {
      supabase.removeChannel(walkinChannel);
      supabase.removeChannel(onlineChannel);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [clinicId]);

  useEffect(() => {
    if (clinic?.live_tokens_enabled === false) {
      navigate("/");
    }
  }, [clinic?.live_tokens_enabled, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (clinic?.live_tokens_enabled === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="mb-6 h-20 w-20 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <Activity className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Tokens Module Disabled</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          Live token tracking is currently disabled by the clinic. Please contact the clinic directly for information about your appointment.
        </p>
        <ClinicLink to="/">
          <Button variant="hero" size="lg">Go Back Home</Button>
        </ClinicLink>
      </div>
    );
  }

  const getGridCols = (count: number) => {
    if (count <= 1) return "";
    if (count === 2) return "md:grid-cols-2";
    if (count === 3) return "md:grid-cols-3";
    return "md:grid-cols-2";
  };

  // Queue logic per doctor
  const getQueueState = (doctorId: string) => {
    const doctorTokens = allTokens.filter((t) => t.doctor_id === doctorId);
    const servingToken = doctorTokens.find((t) => t.status === "serving") || null;
    const waitingTokens = doctorTokens.filter((t) => t.status === "waiting");
    const unavailableTokens = doctorTokens.filter((t) => t.status === "unavailable");

    // Next waiting = first waiting token (they're already ordered by token_number)
    const nextWaiting = waitingTokens.length > 0 ? waitingTokens[0] : null;

    const hasAnyActive = servingToken || nextWaiting;

    return { servingToken, nextWaiting, unavailableTokens, hasAnyActive };
  };

  return (
    <div className="relative min-h-[90vh] overflow-hidden bg-background">
      {/* Decorative Background Glow Orbs for LCD Screen visual depth */}
      <div className="absolute inset-0 opacity-30 z-0 mix-blend-screen pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }} 
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} 
          className="absolute right-[-10%] top-[5%] h-[40rem] w-[40rem] rounded-full bg-primary/20 blur-[130px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.25, 1], opacity: [0.1, 0.25, 0.1] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }} 
          className="absolute bottom-[5%] left-[-10%] h-[35rem] w-[35rem] rounded-full bg-emerald-500/20 blur-[110px]" 
        />
      </div>

      <section className="relative z-10 py-16 md:py-24 w-full">
        <div className="container px-4 max-w-[95%]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mb-14 text-center flex flex-col items-center"
          >
            {/* Styled to perfectly match the Announcement pill glow from the Notifications page */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)] backdrop-blur-md hover:bg-primary/20 transition-all duration-300">
              <Activity className="h-4 w-4 animate-pulse text-primary" />
              Live Updates
            </div>
            <h1 className="mb-3 font-display text-4xl font-extrabold text-foreground md:text-5xl lg:text-6xl tracking-tight leading-none">Current Token Numbers</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">Check which token is currently being served by each doctor in real-time.</p>
          </motion.div>

          <div className={`mx-auto grid gap-8 lg:gap-12 w-full ${getGridCols(doctors.length)}`}>
            {doctors.map((doctor, i) => {
              const { servingToken, nextWaiting, unavailableTokens, hasAnyActive } = getQueueState(doctor.id);

              return (
                <motion.div
                  key={doctor.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`group flex flex-col rounded-[2.5rem] border-4 bg-card/90 backdrop-blur-xl p-8 lg:p-12 xl:p-16 shadow-2xl transition-all duration-300 hover:scale-[1.01] ${
                    servingToken ? "border-green-500 shadow-green-500/10" : "border-border shadow-soft"
                  } ${doctors.length === 1 ? "max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto w-full" : "w-full"}`}
                >
                  {/* Doctor Info */}
                  <div className="mb-8 text-center border-b border-border/60 pb-6">
                    <h3 className="font-display text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-foreground tracking-tight leading-tight">{doctor.name}</h3>
                    <p className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-primary mt-2">{doctor.specialization}</p>
                  </div>

                  {!hasAnyActive && unavailableTokens.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 lg:py-20">
                      <div className="mb-4 flex h-24 w-24 lg:h-36 lg:w-36 items-center justify-center rounded-3xl bg-muted shadow-inner">
                        <span className="font-display text-5xl lg:text-7xl font-extrabold text-muted-foreground/30">—</span>
                      </div>
                      <p className="text-sm lg:text-lg font-semibold text-muted-foreground">No tokens issued today</p>
                    </div>
                  )}

                  {!hasAnyActive && unavailableTokens.length > 0 && (
                    <div className="flex flex-col items-center justify-center py-12 lg:py-20">
                      <p className="text-sm lg:text-lg font-semibold text-muted-foreground">No active tokens. Queue is clear.</p>
                    </div>
                  )}

                  {/* Serving Token — Green Box (Large display for clinical monitors) */}
                  {servingToken && (
                    <div className="mb-6 rounded-[2rem] border-3 border-green-500 bg-green-50/70 dark:bg-green-950/20 p-6 lg:p-8 text-center shadow-md">
                      <Badge className="mb-4 bg-green-600 hover:bg-green-700 text-white text-xs lg:text-sm lg:px-4 lg:py-1.5 font-bold uppercase tracking-wider">NOW SERVING</Badge>
                      <div className="flex justify-center my-4">
                        <div className="flex h-28 w-28 md:h-32 md:w-32 lg:h-44 lg:w-44 xl:h-52 xl:w-52 items-center justify-center rounded-[2rem] bg-green-600 text-white shadow-xl animate-pulse-slow">
                          <span className="font-display text-5xl md:text-6xl lg:text-8xl xl:text-[9rem] font-black tracking-tighter leading-none">{servingToken.token_number}</span>
                        </div>
                      </div>
                      {servingToken.patient_name ? (
                        <p className="mt-4 text-lg md:text-xl lg:text-2xl xl:text-3xl font-black text-foreground uppercase tracking-wide leading-snug">
                          {servingToken.patient_name}
                          {servingToken.isOnline && <span className="text-blue-600 text-sm lg:text-lg font-bold ml-2 block sm:inline">(Online Token)</span>}
                        </p>
                      ) : null}
                    </div>
                  )}

                  {/* Next Waiting Token */}
                  {nextWaiting && servingToken && (
                    <div className="mb-6 rounded-[2rem] border-3 border-amber-400 bg-amber-50/70 dark:bg-amber-950/20 p-6 lg:p-8 text-center shadow-md">
                      <Badge className="mb-4 bg-amber-500 hover:bg-amber-600 text-white text-xs lg:text-sm lg:px-4 lg:py-1.5 font-bold uppercase tracking-wider">GET READY — YOUR TURN IS NEXT</Badge>
                      <div className="flex justify-center my-3">
                        <div className="flex h-24 w-24 md:h-28 md:w-28 lg:h-36 lg:w-36 xl:h-40 xl:w-40 items-center justify-center rounded-[1.5rem] bg-amber-500 text-white shadow-lg">
                          <span className="font-display text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-none">{nextWaiting.token_number}</span>
                        </div>
                      </div>
                      {nextWaiting.patient_name ? (
                        <p className="mt-3 text-base md:text-lg lg:text-xl xl:text-2xl font-black text-foreground uppercase tracking-wide leading-snug">
                          {nextWaiting.patient_name}
                          {nextWaiting.isOnline && <span className="text-blue-500 text-xs lg:text-sm font-semibold ml-2 block sm:inline">(Online Token)</span>}
                        </p>
                      ) : null}
                    </div>
                  )}

                  {/* First waiting when nothing is serving — Orange Box (Large display) */}
                  {nextWaiting && !servingToken && (
                    <div className="mb-6 rounded-[2rem] border-3 border-orange-400 bg-orange-50/70 dark:bg-orange-950/20 p-6 lg:p-8 text-center shadow-md">
                      <Badge className="mb-4 bg-orange-500 hover:bg-orange-600 text-white text-xs lg:text-sm lg:px-4 lg:py-1.5 font-bold uppercase tracking-wider">WAITING</Badge>
                      <div className="flex justify-center my-4">
                        <div className="flex h-28 w-28 md:h-32 md:w-32 lg:h-44 lg:w-44 xl:h-52 xl:w-52 items-center justify-center rounded-[2rem] bg-orange-500 text-white shadow-xl animate-pulse-slow">
                          <span className="font-display text-5xl md:text-6xl lg:text-8xl xl:text-[9rem] font-black tracking-tighter leading-none">{nextWaiting.token_number}</span>
                        </div>
                      </div>
                      {nextWaiting.patient_name ? (
                        <p className="mt-4 text-lg md:text-xl lg:text-2xl xl:text-3xl font-black text-foreground uppercase tracking-wide leading-snug">
                          {nextWaiting.patient_name}
                          {nextWaiting.isOnline && <span className="text-blue-500 text-sm lg:text-lg font-bold ml-2 block sm:inline">(Online Token)</span>}
                        </p>
                      ) : null}
                    </div>
                  )}

                  {/* Unavailable Tokens — dimmed red records */}
                  {unavailableTokens.length > 0 && (
                    <div className="mt-4 border-t border-border/60 pt-4">
                      <div className="space-y-2.5">
                        {unavailableTokens.map((ut) => (
                          <div key={`${ut.isOnline ? 'online' : 'walkin'}-${ut.id}`} className="flex items-center justify-between rounded-2xl bg-destructive/5 border border-destructive/20 px-5 py-3.5">
                            <div className="flex items-center gap-3.5">
                              <span className="font-display text-lg lg:text-xl font-black text-muted-foreground">#{ut.token_number}</span>
                              {ut.patient_name && (
                                <span className="text-sm lg:text-base text-muted-foreground line-through flex items-center font-semibold">
                                  {ut.patient_name}
                                  {ut.isOnline && <span className="text-[10px] ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Online</span>}
                                </span>
                              )}
                            </div>
                            <Badge variant="destructive" className="text-xs lg:text-sm px-3 py-1 font-bold uppercase">Unavailable</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {doctors.length === 0 && (
            <div className="mx-auto max-w-md text-center py-16">
              <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-display text-xl font-semibold text-muted-foreground">No doctors available at this time.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LiveTokens;
