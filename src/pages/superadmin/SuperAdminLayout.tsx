import { useState } from "react";
import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, Settings, LogOut, Menu, X, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

const sidebarLinks = [
  { label: "Overview", path: "/superadmin", icon: LayoutDashboard },
  { label: "Clinics", path: "/superadmin/clinics", icon: Building2 },
  { label: "Admins", path: "/superadmin/admins", icon: Users },
  { label: "Settings", path: "/superadmin/settings", icon: Settings },
];

const SuperAdminLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, isSuperAdmin, signOut, profile } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex-col bg-foreground transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} flex`}>
        <div className="flex h-16 items-center gap-2 border-b border-foreground/10 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <span className="font-display text-lg font-bold text-background">Super Admin</span>
          <Button variant="ghost" size="icon" className="ml-auto text-background lg:hidden" onClick={() => setSidebarOpen(false)}>
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
                    ? "bg-primary/20 text-primary"
                    : "text-background/70 hover:bg-background/10 hover:text-background"
                }`}>
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-foreground/10 p-3 space-y-1">
          <Link to="/">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-background/70 hover:bg-background/10 hover:text-background transition-colors">
              <LogOut className="h-4 w-4" />
              Back to Website
            </div>
          </Link>
          <button onClick={signOut} className="w-full">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-background/70 hover:bg-background/10 hover:text-background transition-colors">
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
            {sidebarLinks.find((l) => l.path === location.pathname)?.label || "Super Admin"}
          </h2>
          <div className="ml-auto flex items-center gap-2">
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

export default SuperAdminLayout;
