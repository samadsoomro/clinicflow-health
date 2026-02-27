import { motion } from "framer-motion";
import { Bell, AlertTriangle, Info } from "lucide-react";

const mockNotifications = [
  { id: 1, title: "Emergency Closure", message: "Clinic will remain closed on Friday due to maintenance.", priority: "urgent", date: "Feb 27, 2026" },
  { id: 2, title: "New Doctor Joining", message: "Dr. Ayesha Siddiqui (ENT Specialist) joins starting March 1st.", priority: "normal", date: "Feb 25, 2026" },
  { id: 3, title: "Vaccination Drive", message: "Free flu vaccination camp this Saturday from 9 AM to 2 PM.", priority: "normal", date: "Feb 23, 2026" },
  { id: 4, title: "System Maintenance", message: "Token system will be briefly unavailable tonight 11 PM - 1 AM.", priority: "urgent", date: "Feb 22, 2026" },
];

const Notifications = () => (
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
        {mockNotifications.map((n, i) => (
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
                <span className="mt-2 inline-block text-xs text-muted-foreground">{n.date}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Notifications;
