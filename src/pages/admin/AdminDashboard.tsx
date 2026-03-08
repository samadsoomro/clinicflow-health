import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Activity, LayoutDashboard, Users, Stethoscope, Clock,
  Bell, Settings, MapPin, LogOut, Menu, X, CreditCard, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useClinicId } from "@/hooks/useClinic";
import { supabase } from "@/integrations/supabase/client";

const sidebarLinks = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard },
  { label: "Doctors", path: "/admin/doctors", icon: Stethoscope },
  { label: "Tokens", path: "/admin/tokens", icon: Clock },
  { label: "Patients", path: "/admin/patients", icon: Users },
  { label: "Notifications", path: "/admin/notifications", icon: Bell },
  { label: "Patient Cards", path: "/admin/cards", icon: CreditCard },
  { label: "Location", path: "/admin/location", icon: MapPin },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

const AdminDashboard = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, profile } = useAuth();
  const { clinicId } = useClinicId();
  const [clinicName, setClinicName] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("clinics").select("clinic_name").eq("id", clinicId).single();
      if (data) setClinicName(data.clinic_name);
    };
    if (clinicId) fetch();
  }, [clinicId]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex-col gradient-hero transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} flex`}>
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary/20">
            <Activity className="h-4 w-4 text-sidebar-primary" />
          </div>
          <span className="font-display text-lg font-bold text-sidebar-foreground">Admin Panel</span>
          {clinicName && (
            <span className="ml-auto mr-2 text-[10px] font-medium text-sidebar-foreground/50 hidden lg:inline truncate max-w-[100px]" title={clinicName}>
              {clinicName}
            </span>
          )}
          <Button variant="ghost" size="icon" className="ml-auto text-sidebar-foreground lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link key={link.path} to={link.path} onClick={() => setSidebarOpen(false)}>
                <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}>
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3 space-y-1">
          <Link to="/">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
              <LogOut className="h-4 w-4" />
              Back to Website
            </div>
          </Link>
          <button onClick={signOut} className="w-full">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
              <LogOut className="h-4 w-4" />
              Sign Out
            </div>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-xl px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="font-display font-semibold text-foreground">
            {sidebarLinks.find((l) => l.path === location.pathname)?.label || "Admin"}
          </h2>
          <div className="ml-auto flex items-center gap-3">
            {clinicName && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">{clinicName}</span>
              </div>
            )}
            {profile && <span className="text-sm text-muted-foreground hidden sm:inline">{profile.full_name}</span>}
            <ThemeToggle />
          </div>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
