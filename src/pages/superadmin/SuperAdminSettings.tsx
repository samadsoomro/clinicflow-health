import { motion } from "framer-motion";
import { Settings } from "lucide-react";

const SuperAdminSettings = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div>
      <h2 className="font-display text-2xl font-bold text-foreground">Platform Settings</h2>
      <p className="text-sm text-muted-foreground">Global platform configuration</p>
    </div>
    <div className="rounded-2xl border border-border bg-card p-8 shadow-soft text-center">
      <Settings className="mx-auto h-12 w-12 text-muted-foreground/40" />
      <p className="mt-4 text-muted-foreground">Platform-wide settings will be available here.</p>
    </div>
  </motion.div>
);

export default SuperAdminSettings;
