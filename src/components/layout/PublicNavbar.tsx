import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useClinicContext } from "@/hooks/useClinicContext";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Live Tokens", path: "/tokens" },
  { label: "Notifications", path: "/notifications" },
  { label: "Location", path: "/location" },
  { label: "Contact", path: "/contact" },
  { label: "Patient Card", path: "/patient-card" },
];

const PublicNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, isSuperAdmin, isClinicAdmin, signOut } = useAuth();
  const { clinic } = useClinicContext();

  const isAdmin = isSuperAdmin || isClinicAdmin();
  const displayName = profile?.full_name || user?.email || null;

  const shortName = (clinic as any)?.short_name || "";
  const logoUrl = clinic?.logo_url;
  const clinicName = clinic?.clinic_name || "ClinicToken";

  const handleLogout = async () => {
    await signOut();
    setMobileOpen(false);
    toast({ title: "Logged out", description: "You have been signed out." });
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          {shortName && (
            <span className="font-display text-sm font-bold text-primary">{shortName}</span>
          )}
          {logoUrl ? (
            <img src={logoUrl} alt={clinicName} className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <span className="font-display text-xl font-bold text-foreground">
            {clinicName}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path}>
              <Button
                variant={location.pathname === link.path ? "secondary" : "ghost"}
                size="sm"
                className="font-medium"
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <ThemeToggle />
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
              )}
              {displayName && (
                <span className="text-sm font-medium text-foreground px-2">{displayName}</span>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/register">
                <Button variant="hero" size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-card md:hidden"
          >
            <div className="container flex flex-col gap-2 py-4">
              {navLinks.map((link) => (
                <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)}>
                  <Button
                    variant={location.pathname === link.path ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                {user ? (
                  <>
                    {displayName && (
                      <p className="text-sm font-medium text-foreground px-2 py-1">Signed in as {displayName}</p>
                    )}
                    <div className="flex gap-2">
                      {isAdmin && (
                        <Link to="/admin" className="flex-1" onClick={() => setMobileOpen(false)}>
                          <Button variant="outline" className="w-full">Dashboard</Button>
                        </Link>
                      )}
                      <Button variant="destructive" className="flex-1" onClick={handleLogout}>
                        <LogOut className="mr-1 h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full">Log in</Button>
                    </Link>
                    <Link to="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                      <Button variant="hero" className="w-full">Register</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default PublicNavbar;
