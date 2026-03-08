import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Maximize, Minimize } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePublicClinicId } from "@/hooks/useClinic";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

interface LiveToken {
  id: string;
  token_number: number;
  patient_name: string;
  doctor_id: string;
}

const TokenDisplay = () => {
  const clinicId = usePublicClinicId();
  const [clinic, setClinic] = useState<any>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [liveTokens, setLiveTokens] = useState<LiveToken[]>([]);
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
      // Play a pleasant two-tone chime
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
      supabase.from("tokens").select("id, token_number, patient_name, doctor_id")
        .eq("clinic_id", clinicId).eq("status", "live")
        .gte("created_at", today + "T00:00:00").lte("created_at", today + "T23:59:59"),
    ]);

    setClinic(clinicRes.data);
    setDoctors((docRes.data as Doctor[]) || []);

    const newTokens = (tokenRes.data as LiveToken[]) || [];
    const newKey = newTokens.map(t => `${t.doctor_id}:${t.token_number}`).sort().join(",");

    if (prevTokensRef.current && newKey !== prevTokensRef.current && newKey) {
      playSound();
    }
    prevTokensRef.current = newKey;
    setLiveTokens(newTokens);
    setLoading(false);
  }, [clinicId, today, playSound]);

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel("tv-token-display")
      .on("postgres_changes", { event: "*", schema: "public", table: "tokens" }, () => {
        fetchAll();
      })
      .subscribe();

    // Backup refresh every 10 seconds
    const interval = setInterval(fetchAll, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchAll]);

  const getTokenForDoctor = (doctorId: string) =>
    liveTokens.find((t) => t.doctor_id === doctorId);

  const getGridClass = (count: number) => {
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count === 3) return "grid-cols-3";
    if (count === 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-3";
    return "grid-cols-4";
  };

  const getGridRows = (count: number) => {
    if (count <= 3) return "grid-rows-1";
    if (count <= 6) return "grid-rows-2";
    return "grid-rows-3";
  };

  const shortName = (clinic as any)?.short_name || "";
  const clinicName = clinic?.clinic_name || "";
  const logoUrl = clinic?.logo_url;
  const hasAnyLive = liveTokens.length > 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background select-none">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4 lg:px-10">
        <div className="flex items-center gap-3">
          {shortName && (
            <span className="font-display text-lg font-bold text-primary lg:text-xl">{shortName}</span>
          )}
          {logoUrl ? (
            <img src={logoUrl} alt={clinicName} className="h-10 w-10 rounded-lg object-cover lg:h-12 lg:w-12" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary lg:h-12 lg:w-12">
              <Activity className="h-5 w-5 text-primary-foreground lg:h-6 lg:w-6" />
            </div>
          )}
          <span className="font-display text-xl font-bold text-foreground lg:text-2xl">{clinicName}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
            </span>
            <span className="font-display text-sm font-bold uppercase tracking-widest text-primary lg:text-base">
              Now Serving
            </span>
          </div>
        </div>
      </header>

      {/* Doctor Panels */}
      <div className={`flex-1 grid gap-4 p-4 lg:gap-6 lg:p-6 ${getGridClass(doctors.length)} ${getGridRows(doctors.length)}`}>
        {doctors.length > 0 ? (
          doctors.map((doc) => {
            const token = getTokenForDoctor(doc.id);
            return (
              <div
                key={doc.id}
                className={`flex flex-col items-center justify-center rounded-3xl border-2 p-6 transition-all ${
                  token
                    ? "border-primary bg-primary/5 shadow-elevated"
                    : "border-border bg-card shadow-soft"
                }`}
              >
                {/* Doctor Name */}
                <p className="mb-2 font-display text-xl font-bold text-foreground lg:text-2xl xl:text-3xl">
                  {doc.name}
                </p>
                <p className="mb-6 text-sm text-muted-foreground lg:text-base">{doc.specialization}</p>

                <AnimatePresence mode="wait">
                  {token ? (
                    <motion.div
                      key={token.id}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className="flex flex-col items-center"
                    >
                      <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-2xl bg-primary shadow-lg lg:h-44 lg:w-44 xl:h-56 xl:w-56">
                        <span className="font-display text-6xl font-extrabold text-primary-foreground lg:text-8xl xl:text-9xl">
                          {token.token_number}
                        </span>
                      </div>
                      <p className="font-display text-lg font-semibold text-foreground lg:text-2xl xl:text-3xl">
                        {token.patient_name}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center"
                    >
                      <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-2xl bg-muted lg:h-44 lg:w-44 xl:h-56 xl:w-56">
                        <span className="font-display text-6xl font-bold text-muted-foreground/40 lg:text-8xl xl:text-9xl">
                          —
                        </span>
                      </div>
                      <p className="text-base text-muted-foreground lg:text-lg">Waiting...</p>
                    </motion.div>
                  )}
                </AnimatePresence>
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

      {/* Waiting message overlay when no tokens active */}
      {doctors.length > 0 && !hasAnyLive && (
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
