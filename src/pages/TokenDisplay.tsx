import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Maximize, Minimize } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { usePublicClinicId } from "@/hooks/useClinic";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

interface TokenData {
  id: string;
  token_number: number;
  patient_name: string;
  doctor_id: string;
  status: string;
}

const TokenDisplay = () => {
  const clinicId = usePublicClinicId();
  const [clinic, setClinic] = useState<any>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [allTokens, setAllTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const prevTokensRef = useRef<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const playSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };
      playTone(880, 0, 0.3);
      playTone(1100, 0.15, 0.4);
      playTone(1320, 0.35, 0.5);
    } catch {}
  }, []);

  const fetchAll = useCallback(async () => {
    const [clinicRes, docRes, tokenRes] = await Promise.all([
      supabase.from("clinics").select("clinic_name, logo_url, short_name, theme_color").eq("id", clinicId).single(),
      supabase.from("doctors").select("id, name, specialization").eq("clinic_id", clinicId).eq("status", "active").order("name"),
      supabase.from("tokens").select("id, token_number, patient_name, doctor_id, status")
        .eq("clinic_id", clinicId)
        .gte("created_at", today + "T00:00:00").lte("created_at", today + "T23:59:59")
        .order("token_number", { ascending: true }),
    ]);

    setClinic(clinicRes.data);
    setDoctors((docRes.data as Doctor[]) || []);
    const tokens = (tokenRes.data as TokenData[]) || [];
    setAllTokens(tokens);

    const servingTokens = tokens.filter(t => t.status === "serving");
    const newKey = servingTokens.map(t => `${t.doctor_id}:${t.token_number}`).sort().join(",");
    if (prevTokensRef.current && newKey !== prevTokensRef.current && newKey) {
      playSound();
    }
    prevTokensRef.current = newKey;
    setLoading(false);
  }, [clinicId, today, playSound]);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel("tv-token-display")
      .on("postgres_changes", { event: "*", schema: "public", table: "tokens", filter: `clinic_id=eq.${clinicId}` }, () => fetchAll())
      .subscribe();
    const interval = setInterval(fetchAll, 10000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchAll]);

  const getServingTokens = (doctorId: string) =>
    allTokens.filter((t) => t.doctor_id === doctorId && t.status === "serving");
  const getWaitingTokens = (doctorId: string) =>
    allTokens.filter((t) => t.doctor_id === doctorId && t.status === "waiting");
  const getUnavailableTokens = (doctorId: string) =>
    allTokens.filter((t) => t.doctor_id === doctorId && t.status === "unavailable");
  const hasAnyActiveTokens = (doctorId: string) =>
    allTokens.some((t) => t.doctor_id === doctorId && t.status !== "completed");

  const getGridClass = (count: number) => {
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 lg:grid-cols-2";
    if (count === 3) return "grid-cols-1 lg:grid-cols-3";
    if (count === 4) return "grid-cols-1 lg:grid-cols-2";
    if (count <= 6) return "grid-cols-1 lg:grid-cols-3";
    return "grid-cols-1 lg:grid-cols-4";
  };

  const shortName = clinic?.short_name || "";
  const clinicName = clinic?.clinic_name || "";
  const logoUrl = clinic?.logo_url;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-screen flex-col bg-background select-none overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6 sm:py-4 lg:px-10">
        <div className="flex items-center gap-3 min-w-0">
          {shortName && (
            <span className="font-display text-base font-bold text-primary sm:text-lg lg:text-xl truncate">{shortName}</span>
          )}
          {logoUrl ? (
            <img src={logoUrl} alt={clinicName} className="h-8 w-8 rounded-lg object-cover sm:h-10 sm:w-10 lg:h-12 lg:w-12 flex-shrink-0" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary sm:h-10 sm:w-10 lg:h-12 lg:w-12 flex-shrink-0">
              <Activity className="h-4 w-4 text-primary-foreground sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            </div>
          )}
          <span className="font-display text-lg font-bold text-foreground sm:text-xl lg:text-2xl truncate">{clinicName}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-primary/10 px-2.5 py-1.5 sm:px-4 sm:py-2">
            <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-primary" />
            </span>
            <span className="font-display text-xs font-bold uppercase tracking-widest text-primary sm:text-sm lg:text-base">
              Live
            </span>
          </div>
          <button
            onClick={toggleFullscreen}
            className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-border bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4 sm:h-5 sm:w-5" /> : <Maximize className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>
        </div>
      </header>

      {/* Doctor Panels */}
      <div className={`flex-1 grid gap-4 p-4 lg:gap-6 lg:p-6 overflow-y-auto ${getGridClass(doctors.length)}`}>
        {doctors.length > 0 ? (
          doctors.map((doc) => {
            const servingTokens = getServingTokens(doc.id);
            const waitingTokens = getWaitingTokens(doc.id);
            const unavailableTokens = getUnavailableTokens(doc.id);
            const hasTokens = hasAnyActiveTokens(doc.id);

            return (
              <div
                key={doc.id}
                className={`flex flex-col rounded-3xl border-2 p-4 sm:p-6 transition-all ${
                  servingTokens.length > 0 ? "border-green-500 bg-green-50/30 dark:bg-green-950/10" : "border-border bg-card shadow-soft"
                }`}
              >
                <div className="mb-4 text-center">
                  <p className="font-display text-lg font-bold text-foreground sm:text-xl lg:text-2xl xl:text-3xl">{doc.name}</p>
                  <p className="text-sm text-muted-foreground lg:text-base">{doc.specialization}</p>
                </div>

                {!hasTokens && (
                  <div className="flex flex-col items-center py-8">
                    <div className="mb-3 flex h-28 w-28 items-center justify-center rounded-2xl bg-muted lg:h-36 lg:w-36">
                      <span className="font-display text-5xl font-bold text-muted-foreground/40 lg:text-7xl">—</span>
                    </div>
                    <p className="text-base text-muted-foreground">No tokens issued yet</p>
                  </div>
                )}

                {/* Serving */}
                <AnimatePresence>
                  {servingTokens.map((token) => (
                    <motion.div
                      key={token.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="mb-4 rounded-2xl border-2 border-green-500 bg-green-50 dark:bg-green-950/20 p-4 text-center"
                    >
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400">NOW SERVING</p>
                      <div className="flex justify-center">
                        <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg lg:h-40 lg:w-40 xl:h-48 xl:w-48">
                          <span className="font-display text-5xl font-extrabold sm:text-6xl lg:text-8xl xl:text-9xl">{token.token_number}</span>
                        </div>
                      </div>
                      {token.patient_name && (
                        <p className="mt-3 font-display text-lg font-semibold text-foreground lg:text-2xl">{token.patient_name}</p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Waiting */}
                {waitingTokens.map((token) => (
                  <div key={token.id} className="mb-3 rounded-2xl border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-3 text-center">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">WAITING</p>
                    <div className="flex justify-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-yellow-500 text-white shadow-lg lg:h-28 lg:w-28">
                        <span className="font-display text-4xl font-extrabold lg:text-6xl">{token.token_number}</span>
                      </div>
                    </div>
                    {token.patient_name ? (
                      <p className="mt-2 text-base font-semibold text-foreground">{token.patient_name}</p>
                    ) : (
                      <p className="mt-2 text-base font-semibold text-muted-foreground">—</p>
                    )}
                  </div>
                ))}

                {/* Unavailable */}
                {unavailableTokens.length > 0 && (
                  <div className="mt-2 border-t border-border pt-3">
                    <div className="space-y-1.5">
                      {unavailableTokens.map((ut) => (
                        <div key={ut.id} className="flex items-center justify-between rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-display text-sm font-bold text-muted-foreground">#{ut.token_number}</span>
                            {ut.patient_name && <span className="text-xs text-muted-foreground line-through">{ut.patient_name}</span>}
                          </div>
                          <Badge variant="destructive" className="text-[10px] px-2 py-0">Unavailable</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full flex items-center justify-center">
            <div className="text-center">
              <div className="mb-6 inline-flex h-36 w-36 items-center justify-center rounded-3xl bg-muted lg:h-48 lg:w-48">
                <span className="font-display text-7xl font-bold text-muted-foreground/40 lg:text-9xl">—</span>
              </div>
              <p className="font-display text-2xl font-semibold text-muted-foreground lg:text-3xl">
                Please wait. Token will be announced shortly.
              </p>
            </div>
          </div>
        )}
      </div>

      {doctors.length > 0 && allTokens.filter(t => t.status === "serving" || t.status === "waiting").length === 0 && (
        <div className="border-t border-border bg-muted/50 px-6 py-4 text-center">
          <p className="font-display text-lg font-medium text-muted-foreground animate-pulse">
            Please wait. Token will be announced shortly.
          </p>
        </div>
      )}
    </div>
  );
};

export default TokenDisplay;
