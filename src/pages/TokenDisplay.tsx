import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getClinicId } from "@/hooks/useClinic";

const TokenDisplay = () => {
  const clinicId = getClinicId();
  const [liveToken, setLiveToken] = useState<any>(null);
  const [clinicName, setClinicName] = useState("");
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const fetchLiveToken = async () => {
    const { data } = await supabase
      .from("tokens")
      .select("*, doctors:doctor_id(name, specialization)")
      .eq("clinic_id", clinicId)
      .eq("status", "live")
      .gte("created_at", today + "T00:00:00")
      .lte("created_at", today + "T23:59:59")
      .limit(1)
      .maybeSingle();
    setLiveToken(data);
    setLoading(false);
  };

  const fetchClinic = async () => {
    const { data } = await supabase
      .from("clinics")
      .select("clinic_name")
      .eq("id", clinicId)
      .maybeSingle();
    if (data) setClinicName((data as any).clinic_name);
  };

  useEffect(() => {
    fetchClinic();
    fetchLiveToken();

    const channel = supabase
      .channel("live-token-display")
      .on("postgres_changes", { event: "*", schema: "public", table: "tokens" }, () => {
        fetchLiveToken();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [clinicId]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      {/* Clinic Name */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
          <Activity className="h-4 w-4 animate-pulse text-primary" />
          <span className="text-sm font-medium text-primary">Live</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
          {clinicName || "Clinic"}
        </h1>
      </motion.div>

      {/* Token Display */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <p className="text-xl text-muted-foreground">Loading...</p>
          </motion.div>
        ) : liveToken ? (
          <motion.div
            key={liveToken.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="text-center"
          >
            <p className="mb-4 text-lg font-medium uppercase tracking-widest text-muted-foreground">
              Now Serving
            </p>
            <div className="mb-8 inline-flex h-40 w-40 items-center justify-center rounded-3xl bg-primary shadow-lg md:h-56 md:w-56">
              <span className="font-display text-7xl font-bold text-primary-foreground md:text-9xl">
                {liveToken.token_number}
              </span>
            </div>
            <div className="space-y-2">
              <p className="font-display text-3xl font-bold text-foreground md:text-4xl">
                {liveToken.patient_name}
              </p>
              <p className="text-xl text-muted-foreground md:text-2xl">
                {liveToken.doctors?.name || ""}
              </p>
              {liveToken.doctors?.specialization && (
                <p className="text-base text-muted-foreground/70">
                  {liveToken.doctors.specialization}
                </p>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="mb-6 inline-flex h-32 w-32 items-center justify-center rounded-3xl bg-muted md:h-44 md:w-44">
              <span className="font-display text-5xl font-bold text-muted-foreground md:text-7xl">—</span>
            </div>
            <p className="font-display text-2xl font-semibold text-muted-foreground md:text-3xl">
              Please wait...
            </p>
            <p className="mt-2 text-base text-muted-foreground/70">
              No token is currently being served
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TokenDisplay;
