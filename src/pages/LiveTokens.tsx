import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getClinicId } from "@/hooks/useClinic";

const LiveTokens = () => {
  const clinicId = getClinicId();
  const [doctors, setDoctors] = useState<any[]>([]);
  const today = new Date().toISOString().split("T")[0];

  const fetchData = async () => {
    // Get doctors for this clinic
    const { data: docData } = await supabase
      .from("doctors")
      .select("id, name, specialization, status")
      .eq("clinic_id", clinicId);

    // Get today's tokens
    const { data: tokenData } = await supabase
      .from("tokens")
      .select("*")
      .eq("clinic_id", clinicId)
      .gte("created_at", today + "T00:00:00")
      .lte("created_at", today + "T23:59:59");

    const docs = (docData as any[]) || [];
    const tokens = (tokenData as any[]) || [];

    const merged = docs.map((doc) => {
      const docTokens = tokens.filter((t) => t.doctor_id === doc.id);
      const liveToken = docTokens.find((t) => t.status === "live");
      const currentToken = liveToken
        ? liveToken.token_number
        : docTokens.length > 0
        ? Math.max(...docTokens.map((t: any) => t.token_number))
        : 0;
      return {
        ...doc,
        currentToken,
        hasLive: !!liveToken,
      };
    });
    setDoctors(merged);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("public-live-tokens")
      .on("postgres_changes", { event: "*", schema: "public", table: "tokens" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clinicId]);

  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
            <Activity className="h-4 w-4 animate-pulse-token" />
            Live Updates
          </div>
          <h1 className="mb-3 font-display text-3xl font-bold text-foreground md:text-4xl">Current Token Numbers</h1>
          <p className="text-muted-foreground">Check which token is currently being served by each doctor.</p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
          {doctors.map((doctor, i) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group flex items-center gap-5 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:shadow-card"
            >
              <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl font-display text-2xl font-bold ${
                doctor.status === "active" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {doctor.status === "active" && doctor.currentToken > 0 ? doctor.currentToken : "—"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-foreground truncate">{doctor.name}</h3>
                <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                <div className="mt-2 flex items-center gap-3">
                  <Badge variant={doctor.status === "active" ? "default" : "secondary"} className="text-xs">
                    {doctor.status === "active" ? (doctor.hasLive ? "Serving" : "Active") : "Closed"}
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveTokens;
