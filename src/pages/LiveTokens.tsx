import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { usePublicClinicId } from "@/hooks/useClinic";

const LiveTokens = () => {
  const clinicId = usePublicClinicId();
  const [doctors, setDoctors] = useState<any[]>([]);
  const today = new Date().toISOString().split("T")[0];

  const fetchData = async () => {
    const { data: docData } = await supabase
      .from("doctors")
      .select("id, name, specialization, status")
      .eq("clinic_id", clinicId);

    const { data: tokenData } = await supabase
      .from("tokens")
      .select("*")
      .eq("clinic_id", clinicId)
      .gte("created_at", today + "T00:00:00")
      .lte("created_at", today + "T23:59:59")
      .order("token_number", { ascending: false });

    const docs = (docData as any[]) || [];
    const tokens = (tokenData as any[]) || [];

    const merged = docs.map((doc) => {
      const docTokens = tokens.filter((t) => t.doctor_id === doc.id);
      // Get the most recent token for this doctor (first in desc order)
      const latestToken = docTokens.length > 0 ? docTokens[0] : null;
      return {
        ...doc,
        currentToken: latestToken?.token_number || 0,
        currentStatus: latestToken?.status || null,
        patientName: latestToken?.patient_name || "",
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

  const getGridCols = (count: number) => {
    if (count <= 1) return "";
    if (count === 2) return "md:grid-cols-2";
    if (count === 3) return "md:grid-cols-3";
    return "md:grid-cols-2";
  };

  const getTokenStyles = (status: string | null) => {
    switch (status) {
      case "serving":
        return { bg: "bg-green-600 text-white shadow-lg", label: "Now Serving", badgeVariant: "default" as const, badgeClass: "bg-green-600 hover:bg-green-700" };
      case "waiting":
        return { bg: "bg-yellow-500 text-white shadow-lg", label: "Waiting", badgeVariant: "secondary" as const, badgeClass: "bg-yellow-500 text-white hover:bg-yellow-600" };
      case "unavailable":
        return { bg: "bg-muted text-muted-foreground", label: "Patient Unavailable", badgeVariant: "destructive" as const, badgeClass: "" };
      default:
        return { bg: "bg-muted text-muted-foreground", label: "Completed", badgeVariant: "outline" as const, badgeClass: "" };
    }
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
            const styles = getTokenStyles(doctor.currentStatus);
            return (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`group flex flex-col items-center rounded-3xl border-2 bg-card p-8 md:p-10 shadow-soft transition-all hover:shadow-card ${
                  doctor.currentStatus === "live" ? "border-green-500 bg-green-50/50 dark:bg-green-950/20" :
                  doctor.currentStatus === "unavailable" ? "border-destructive/40 bg-destructive/5" :
                  doctor.currentStatus === "waiting" ? "border-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/20" : "border-border"
                } ${doctors.length === 1 ? "max-w-xl mx-auto" : ""}`}
              >
                {/* Token Number */}
                <div className={`mb-6 flex h-28 w-28 md:h-36 md:w-36 items-center justify-center rounded-2xl ${
                  doctor.status === "active" && doctor.currentToken > 0
                    ? styles.bg
                    : "bg-muted text-muted-foreground"
                }`}>
                  <span className="font-display text-6xl md:text-7xl font-extrabold">
                    {doctor.status === "active" && doctor.currentToken > 0 ? doctor.currentToken : "—"}
                  </span>
                </div>

                {/* Patient name for unavailable */}
                {doctor.currentStatus === "unavailable" && doctor.patientName && (
                  <p className="mb-2 text-sm text-muted-foreground line-through">{doctor.patientName}</p>
                )}

                {/* Doctor Info */}
                <h3 className="mb-1 font-display text-xl md:text-2xl font-bold text-foreground text-center">{doctor.name}</h3>
                <p className="mb-3 text-base md:text-lg text-muted-foreground text-center">{doctor.specialization}</p>
                <Badge
                  variant={doctor.status === "active" && doctor.currentToken > 0 ? styles.badgeVariant : "secondary"}
                  className={`text-sm px-4 py-1 ${doctor.status === "active" && doctor.currentToken > 0 ? styles.badgeClass : ""}`}
                >
                  {doctor.status === "active"
                    ? (doctor.currentToken > 0 ? styles.label : "Active")
                    : "Closed"}
                </Badge>
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
