import { useState, useEffect, useRef } from "react";
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
}

const LiveTokens = () => {
  const clinicId = usePublicClinicId();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [allTokens, setAllTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const today = new Date().toISOString().split("T")[0];

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

      setDoctors((docData as any[]) || []);
      setAllTokens((tokenData as TokenRow[]) || []);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);

    const channel = supabase
      .channel("live-tokens-" + clinicId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tokens",
          filter: `clinic_id=eq.${clinicId}`,
        },
        () => fetchData()
      )
      .subscribe((status) => {
        // If subscription is active, clear polling
        if (status === "SUBSCRIBED") {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        } else {
          // Fallback polling if realtime drops
          if (!pollingRef.current) {
            pollingRef.current = setInterval(() => fetchData(), 5000);
          }
        }
      });

    // Start polling as backup initially
    pollingRef.current = setInterval(() => fetchData(), 5000);

    return () => {
      supabase.removeChannel(channel);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [clinicId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
    <section className="py-16 md:py-24">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
            <Activity className="h-4 w-4 animate-pulse-token" />
            Live Updates
          </div>
          <h1 className="mb-3 font-display text-4xl font-extrabold text-foreground md:text-5xl">Current Token Numbers</h1>
          <p className="text-lg text-muted-foreground">Check which token is currently being served by each doctor.</p>
        </motion.div>

        <div className={`mx-auto grid max-w-5xl gap-6 ${getGridCols(doctors.length)}`}>
          {doctors.map((doctor, i) => {
            const { servingToken, nextWaiting, unavailableTokens, hasAnyActive } = getQueueState(doctor.id);

            return (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`group flex flex-col rounded-3xl border-2 bg-card p-6 md:p-8 shadow-soft transition-all hover:shadow-card ${
                  servingToken ? "border-green-500" : "border-border"
                } ${doctors.length === 1 ? "max-w-xl mx-auto" : ""}`}
              >
                {/* Doctor Info */}
                <div className="mb-5 text-center">
                  <h3 className="font-display text-xl md:text-2xl font-bold text-foreground">{doctor.name}</h3>
                  <p className="text-base md:text-lg text-muted-foreground">{doctor.specialization}</p>
                </div>

                {!hasAnyActive && unavailableTokens.length === 0 && (
                  <div className="flex flex-col items-center py-6">
                    <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-2xl bg-muted">
                      <span className="font-display text-5xl font-extrabold text-muted-foreground/40">—</span>
                    </div>
                    <p className="text-sm text-muted-foreground">No tokens issued yet</p>
                  </div>
                )}

                {!hasAnyActive && unavailableTokens.length > 0 && (
                  <div className="flex flex-col items-center py-6">
                    <p className="text-sm text-muted-foreground">No active tokens. Queue is clear.</p>
                  </div>
                )}

                {/* Serving Token — Green Box */}
                {servingToken && (
                  <div className="mb-4 rounded-2xl border-2 border-green-500 bg-green-50 dark:bg-green-950/20 p-4 text-center">
                    <Badge className="mb-2 bg-green-600 hover:bg-green-700 text-white text-xs">NOW SERVING</Badge>
                    <div className="flex justify-center">
                      <div className="flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg">
                        <span className="font-display text-5xl sm:text-7xl font-extrabold">{servingToken.token_number}</span>
                      </div>
                    </div>
                    {servingToken.patient_name ? (
                      <p className="mt-2 text-lg font-semibold text-foreground">{servingToken.patient_name}</p>
                    ) : null}
                  </div>
                )}

                {/* Next Waiting Token */}
                {nextWaiting && servingToken && (
                  <div className="mb-4 rounded-2xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-4 text-center">
                    <Badge className="mb-2 bg-amber-500 hover:bg-amber-600 text-white text-xs">GET READY — YOUR TURN IS COMING</Badge>
                    <div className="flex justify-center">
                      <div className="flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg">
                        <span className="font-display text-4xl sm:text-5xl font-extrabold">{nextWaiting.token_number}</span>
                      </div>
                    </div>
                    {nextWaiting.patient_name ? (
                      <p className="mt-2 text-base font-semibold text-foreground">{nextWaiting.patient_name}</p>
                    ) : null}
                  </div>
                )}

                {/* First waiting when nothing is serving — Orange Box */}
                {nextWaiting && !servingToken && (
                  <div className="mb-4 rounded-2xl border-2 border-orange-400 bg-orange-50 dark:bg-orange-950/20 p-4 text-center">
                    <Badge className="mb-2 bg-orange-500 hover:bg-orange-600 text-white text-xs">WAITING</Badge>
                    <div className="flex justify-center">
                      <div className="flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg">
                        <span className="font-display text-5xl sm:text-7xl font-extrabold">{nextWaiting.token_number}</span>
                      </div>
                    </div>
                    {nextWaiting.patient_name ? (
                      <p className="mt-2 text-lg font-semibold text-foreground">{nextWaiting.patient_name}</p>
                    ) : null}
                  </div>
                )}

                {/* Unavailable Tokens — dimmed red records */}
                {unavailableTokens.length > 0 && (
                  <div className="mt-2 border-t border-border pt-3">
                    <div className="space-y-2">
                      {unavailableTokens.map((ut) => (
                        <div key={ut.id} className="flex items-center justify-between rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-2">
                          <div className="flex items-center gap-3">
                            <span className="font-display text-lg font-bold text-muted-foreground">#{ut.token_number}</span>
                            {ut.patient_name && <span className="text-sm text-muted-foreground line-through">{ut.patient_name}</span>}
                          </div>
                          <Badge variant="destructive" className="text-xs">Unavailable</Badge>
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
  );
};

export default LiveTokens;
