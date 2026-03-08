import { useState, useEffect } from "react";
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
  const today = new Date().toISOString().split("T")[0];

  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("public-live-tokens")
      .on("postgres_changes", { event: "*", schema: "public", table: "tokens", filter: `clinic_id=eq.${clinicId}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clinicId]);

  const getGridCols = (count: number) => {
    if (count <= 1) return "";
    if (count === 2) return "md:grid-cols-2";
    if (count === 3) return "md:grid-cols-3";
    return "md:grid-cols-2";
  };

  const getServingTokens = (doctorId: string) =>
    allTokens.filter((t) => t.doctor_id === doctorId && t.status === "serving");

  const getWaitingTokens = (doctorId: string) =>
    allTokens.filter((t) => t.doctor_id === doctorId && t.status === "waiting");

  const getUnavailableTokens = (doctorId: string) =>
    allTokens.filter((t) => t.doctor_id === doctorId && t.status === "unavailable");

  const hasAnyActiveTokens = (doctorId: string) =>
    allTokens.some((t) => t.doctor_id === doctorId && t.status !== "completed");

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
            const servingTokens = getServingTokens(doctor.id);
            const waitingTokens = getWaitingTokens(doctor.id);
            const unavailableTokens = getUnavailableTokens(doctor.id);
            const hasTokens = hasAnyActiveTokens(doctor.id);

            return (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`group flex flex-col rounded-3xl border-2 bg-card p-6 md:p-8 shadow-soft transition-all hover:shadow-card ${
                  servingTokens.length > 0 ? "border-green-500" : "border-border"
                } ${doctors.length === 1 ? "max-w-xl mx-auto" : ""}`}
              >
                {/* Doctor Info */}
                <div className="mb-5 text-center">
                  <h3 className="font-display text-xl md:text-2xl font-bold text-foreground">{doctor.name}</h3>
                  <p className="text-base md:text-lg text-muted-foreground">{doctor.specialization}</p>
                </div>

                {!hasTokens && (
                  <div className="flex flex-col items-center py-6">
                    <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-2xl bg-muted">
                      <span className="font-display text-5xl font-extrabold text-muted-foreground/40">—</span>
                    </div>
                    <p className="text-sm text-muted-foreground">No tokens issued yet</p>
                  </div>
                )}

                {/* Serving Tokens */}
                {servingTokens.map((token) => (
                  <div key={token.id} className="mb-4 rounded-2xl border-2 border-green-500 bg-green-50 dark:bg-green-950/20 p-4 text-center">
                    <Badge className="mb-2 bg-green-600 hover:bg-green-700 text-white text-xs">NOW SERVING</Badge>
                    <div className="flex justify-center">
                      <div className="flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg">
                        <span className="font-display text-5xl md:text-6xl font-extrabold">{token.token_number}</span>
                      </div>
                    </div>
                    {token.patient_name ? (
                      <p className="mt-2 text-lg font-semibold text-foreground">{token.patient_name}</p>
                    ) : (
                      <p className="mt-2 text-lg font-semibold text-muted-foreground">—</p>
                    )}
                  </div>
                ))}

                {/* Waiting Tokens */}
                {waitingTokens.map((token) => (
                  <div key={token.id} className="mb-3 rounded-2xl border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-4 text-center">
                    <Badge className="mb-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs">WAITING</Badge>
                    <div className="flex justify-center">
                      <div className="flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-2xl bg-yellow-500 text-white shadow-lg">
                        <span className="font-display text-4xl md:text-5xl font-extrabold">{token.token_number}</span>
                      </div>
                    </div>
                    {token.patient_name ? (
                      <p className="mt-2 text-base font-semibold text-foreground">{token.patient_name}</p>
                    ) : (
                      <p className="mt-2 text-base font-semibold text-muted-foreground">—</p>
                    )}
                  </div>
                ))}

                {/* Unavailable Tokens */}
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
