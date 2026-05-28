import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, AlertTriangle, Pin, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePublicClinicId } from "@/hooks/useClinic";
import { Badge } from "@/components/ui/badge";

const Notifications = () => {
  const clinicId = usePublicClinicId();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, title, message, priority, is_pinned, created_at")
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .order("is_pinned", { ascending: false })
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
    <div className="relative min-h-[85vh] overflow-hidden bg-background">
      {/* Decorative Background Glow Orbs */}
      <div className="absolute inset-0 opacity-30 z-0 mix-blend-screen pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} 
          className="absolute right-[-10%] top-[5%] h-[35rem] w-[35rem] rounded-full bg-primary/20 blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.25, 1], opacity: [0.1, 0.25, 0.1] }} 
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }} 
          className="absolute bottom-[10%] left-[-10%] h-[30rem] w-[30rem] rounded-full bg-accent/20 blur-[100px]" 
        />
      </div>

      <section className="relative z-10 py-16 md:py-24">
        <div className="container max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-semibold text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)] backdrop-blur-md hover:bg-primary/20 transition-all duration-300 cursor-pointer">
              <Bell className="h-4 w-4 animate-pulse text-primary" />
              Announcements
            </div>
            <h1 className="mb-4 font-display text-4xl font-extrabold text-foreground md:text-5xl drop-shadow-sm tracking-tight">
              Latest Notifications
            </h1>
            <p className="text-lg text-slate-700 dark:text-slate-300 max-w-md mx-auto font-medium">
              Stay updated with the latest clinic announcements and working hours.
            </p>
          </motion.div>

          <div className="mx-auto max-w-3xl space-y-6">
            {notifications.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 rounded-3xl border border-dashed border-border/80 bg-card/50 backdrop-blur-md text-muted-foreground font-medium flex flex-col items-center gap-3"
              >
                <div className="p-4 rounded-full bg-secondary/50 text-muted-foreground/60">
                  <Bell className="h-8 w-8" />
                </div>
                <span>No announcements available at this time.</span>
              </motion.div>
            )}
            {notifications.map((n, i) => {
              const isUrgent = n.priority === "urgent";
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  className={`relative overflow-hidden rounded-3xl border p-6 md:p-8 shadow-md hover:shadow-2xl transition-all duration-300 bg-card/95 backdrop-blur-xl ${
                    isUrgent 
                      ? "border-destructive/30 bg-destructive/[0.02] hover:border-destructive/40" 
                      : "border-border/80 hover:border-primary/30"
                  }`}
                >
                  {/* Left Color-coded Accent Bar */}
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${isUrgent ? "bg-destructive" : "bg-primary"}`} />

                  <div className="flex items-start gap-5">
                    <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                      isUrgent 
                        ? "bg-destructive/10 text-destructive animate-pulse" 
                        : "bg-primary/10 text-primary"
                    }`}>
                      {isUrgent ? <AlertTriangle className="h-6 w-6" /> : <Bell className="h-6 w-6" />}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-display text-xl font-bold text-foreground tracking-tight">{n.title}</h3>
                        {n.is_pinned && (
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 text-[11px] font-semibold py-0.5 px-2.5">
                            <Pin className="w-3 h-3 rotate-45" /> Pinned
                          </Badge>
                        )}
                        {isUrgent && (
                          <Badge variant="destructive" className="text-[11px] font-bold py-0.5 px-2.5">
                            Urgent
                          </Badge>
                        )}
                      </div>

                      <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed font-normal">{n.message}</p>

                      <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{n.created_at ? new Date(n.created_at).toLocaleDateString(undefined, { dateStyle: 'long' }) : ""}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Notifications;
