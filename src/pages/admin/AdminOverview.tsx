import { motion } from "framer-motion";
import { Users, Stethoscope, Clock, Bell } from "lucide-react";

const statCards = [
  { label: "Total Patients", value: "1,247", icon: Users, change: "+12 today" },
  { label: "Active Doctors", value: "8", icon: Stethoscope, change: "2 on leave" },
  { label: "Tokens Issued", value: "86", icon: Clock, change: "+23 this hour" },
  { label: "Active Alerts", value: "3", icon: Bell, change: "1 urgent" },
];

const AdminOverview = () => (
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
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <stat.icon className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-foreground">{stat.value}</p>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <span className="text-xs text-primary">{stat.change}</span>
          </div>
        </motion.div>
      ))}
    </div>

    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h3 className="mb-4 font-display text-lg font-semibold text-foreground">Recent Activity</h3>
      <div className="space-y-3">
        {["Token #87 issued to Ahmad for Dr. Sarah", "New patient registration: Fatima Khan (F-132)", "Notification posted: Emergency Closure", "Dr. Khalid marked as on leave"].map((activity, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 text-sm text-foreground">
            <div className="h-2 w-2 rounded-full bg-primary" />
            {activity}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default AdminOverview;
