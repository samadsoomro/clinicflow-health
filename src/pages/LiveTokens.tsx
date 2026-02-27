import { motion } from "framer-motion";
import { Clock, User, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const mockDoctors = [
  { id: 1, name: "Dr. Sarah Ahmed", specialization: "General Physician", currentToken: 23, status: "active", lastUpdated: "2 min ago" },
  { id: 2, name: "Dr. Khalid Raza", specialization: "Cardiologist", currentToken: 15, status: "active", lastUpdated: "5 min ago" },
  { id: 3, name: "Dr. Fatima Khan", specialization: "Pediatrician", currentToken: 8, status: "active", lastUpdated: "1 min ago" },
  { id: 4, name: "Dr. Ali Hassan", specialization: "Dermatologist", currentToken: 0, status: "inactive", lastUpdated: "Closed" },
];

const LiveTokens = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
            <Activity className="h-4 w-4 animate-pulse-token" />
            Live Updates
          </div>
          <h1 className="mb-3 font-display text-3xl font-bold text-foreground md:text-4xl">
            Current Token Numbers
          </h1>
          <p className="text-muted-foreground">Check which token is currently being served by each doctor.</p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
          {mockDoctors.map((doctor, i) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group flex items-center gap-5 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:shadow-card"
            >
              <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl font-display text-2xl font-bold ${
                doctor.status === "active"
                  ? "gradient-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}>
                {doctor.status === "active" ? doctor.currentToken : "—"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-foreground truncate">{doctor.name}</h3>
                <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                <div className="mt-2 flex items-center gap-3">
                  <Badge variant={doctor.status === "active" ? "default" : "secondary"} className="text-xs">
                    {doctor.status === "active" ? "Active" : "Closed"}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {doctor.lastUpdated}
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

export default LiveTokens;
