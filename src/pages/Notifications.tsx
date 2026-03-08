import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePublicClinicId } from "@/hooks/useClinic";

const Notifications = () => {
  const clinicId = usePublicClinicId();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, title, message, priority, created_at")
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setNotifications((data as any[]) || []);
      setLoading(false);
    };
    fetch();
  }, [clinicId]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
            <Bell className="h-4 w-4" />
            Announcements
          </div>
          <h1 className="mb-3 font-display text-3xl font-bold text-foreground md:text-4xl">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with the latest clinic announcements.</p>
        </motion.div>

        <div className="mx-auto max-w-2xl space-y-4">
          {notifications.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No notifications at this time.</div>
          )}
          {notifications.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-2xl border p-5 shadow-soft transition-all hover:shadow-card ${
                n.priority === "urgent"
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                  n.priority === "urgent" ? "bg-destructive/10 text-destructive" : "bg-secondary text-primary"
                }`}>
                  {n.priority === "urgent" ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">{n.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                  <span className="mt-2 inline-block text-xs text-muted-foreground">
                    {n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Notifications;
