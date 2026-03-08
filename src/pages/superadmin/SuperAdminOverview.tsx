import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Users, Stethoscope, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SuperAdminOverview = () => {
  const [stats, setStats] = useState({ clinics: 0, patients: 0, doctors: 0, tokens: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [c, p, d, t] = await Promise.all([
        supabase.from("clinics").select("id", { count: "exact", head: true }),
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase.from("doctors").select("id", { count: "exact", head: true }),
        supabase.from("tokens").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        clinics: c.count || 0,
        patients: p.count || 0,
        doctors: d.count || 0,
        tokens: t.count || 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Total Clinics", value: stats.clinics, icon: Building2 },
    { label: "Total Patients", value: stats.patients, icon: Users },
    { label: "Total Doctors", value: stats.doctors, icon: Stethoscope },
    { label: "Total Tokens", value: stats.tokens, icon: Clock },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat, i) => (
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
    </div>
  );
};

export default SuperAdminOverview;
