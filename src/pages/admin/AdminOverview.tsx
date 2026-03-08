import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Stethoscope, Clock, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClinicId } from "@/hooks/useClinic";

const AdminOverview = () => {
  const { clinicId } = useClinicId();
  const [stats, setStats] = useState({ patients: 0, doctors: 0, tokens: 0, notifications: 0 });
  const [recentTokens, setRecentTokens] = useState<any[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const fetchAll = async () => {
      const [p, d, t, n, recent] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId),
        supabase.from("doctors").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId),
        supabase.from("tokens").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId).gte("created_at", today + "T00:00:00"),
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId).eq("is_active", true),
        supabase.from("tokens").select("token_number, patient_name, status, created_at, doctors:doctor_id(name)").eq("clinic_id", clinicId).order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({ patients: p.count || 0, doctors: d.count || 0, tokens: t.count || 0, notifications: n.count || 0 });
      setRecentTokens((recent.data as any[]) || []);
    };
    fetchAll();
  }, [clinicId]);

  const statCards = [
    { label: "Total Patients", value: stats.patients.toLocaleString(), icon: Users },
    { label: "Active Doctors", value: stats.doctors.toString(), icon: Stethoscope },
    { label: "Tokens Today", value: stats.tokens.toString(), icon: Clock },
    { label: "Active Alerts", value: stats.notifications.toString(), icon: Bell },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 font-display text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Recent Activity</h3>
        <div className="space-y-3">
          {recentTokens.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">No recent activity</p>
          ) : (
            recentTokens.map((t, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 text-sm text-foreground">
                <div className={`h-2 w-2 rounded-full ${t.status === "live" ? "bg-primary" : "bg-muted-foreground"}`} />
                Token #{t.token_number} — {t.patient_name} for {(t as any).doctors?.name || "—"} ({t.status})
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
