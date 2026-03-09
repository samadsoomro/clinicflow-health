import { useEffect, useState } from "react";
import { AlertTriangle, Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useClinicContext } from "@/hooks/useClinicContext";

interface PinnedNotif {
  id: string;
  title: string;
  message: string;
  priority: string | null;
}

const PinnedNotificationsBanner = () => {
  const { clinic } = useClinicContext();
  const clinicId = clinic?.id;
  const [notifs, setNotifs] = useState<PinnedNotif[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!clinicId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, title, message, priority")
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .eq("is_pinned", true)
        .order("created_at", { ascending: false });
      setNotifs((data as PinnedNotif[]) || []);
    };
    fetch();
  }, [clinicId]);

  const visible = notifs.filter((n) => !dismissed.has(n.id));
  if (visible.length === 0) return null;

  return (
    <div className="w-full">
      <AnimatePresence>
        {visible.map((n) => {
          const isUrgent = n.priority === "urgent";
          return (
            <motion.div
              key={n.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`border-b ${
                isUrgent
                  ? "bg-destructive/10 border-destructive/20"
                  : "bg-primary/5 border-primary/10"
              }`}
            >
              <div className="container flex items-center gap-3 py-2.5 px-4">
                <div className={`flex-shrink-0 ${isUrgent ? "text-destructive" : "text-primary"}`}>
                  {isUrgent ? <AlertTriangle className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isUrgent ? "text-destructive" : "text-foreground"}`}>
                    {n.title}
                    <span className={`ml-2 font-normal ${isUrgent ? "text-destructive/70" : "text-muted-foreground"}`}>
                      {n.message}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setDismissed((prev) => new Set(prev).add(n.id))}
                  className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default PinnedNotificationsBanner;
