import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, Menu, X, LogOut } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useClinicContext } from "@/hooks/useClinicContext";
import ClinicLink from "@/components/ClinicLink";
import { cn } from "@/lib/utils";

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
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, isSuperAdmin, isClinicAdmin, signOut } = useAuth();
  const { clinic } = useClinicContext();

  const isAdmin = isSuperAdmin || isClinicAdmin();
  const displayName = profile?.full_name || user?.email || null;

  const shortName = (clinic as any)?.short_name || "";
  const logoUrl = clinic?.logo_url;
  const clinicName = clinic?.clinic_name || "ClinicToken";

  // Stable callbacks that survive re-renders
  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  // In-render location change detection — more reliable than useEffect
  const prevLocationRef = useRef(location.pathname + location.search);
  if (prevLocationRef.current !== location.pathname + location.search) {
    prevLocationRef.current = location.pathname + location.search;
    if (isOpen) setIsOpen(false);
  }

  const handleLogout = async () => {
    await signOut();
    closeMenu();
    toast({ title: "Logged out", description: "You have been signed out." });

    const params = new URLSearchParams(location.search);
    const clinicParam = params.get('clinic');
    navigate(clinicParam ? `/?clinic=${clinicParam}` : "/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <ClinicLink to="/" className="flex items-center gap-2" onClick={closeMenu}>
          {shortName && (
            <span className="font-display text-sm font-bold text-primary">{shortName}</span>
          )}
          {logoUrl ? (
            <img src={logoUrl} alt={clinicName} className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: 'var(--theme-color)' }}
            >
              <Activity className="h-5 w-5 text-white" />
            </div>
          )}
          <span className="font-display text-lg md:text-xl font-bold text-foreground truncate max-w-[140px] md:max-w-none">
            {clinicName}
          </span>
        </ClinicLink>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
            return (
              <ClinicLink key={link.path} to={link.path}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "font-medium",
                    isActive ? "text-orange-500 font-bold" : "text-foreground/70"
                   )}
                >
                  {link.label}
                </Button>
              </ClinicLink>
            );
          })}
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <ThemeToggle />
          {user ? (
            <>
              {isAdmin && (
                <ClinicLink to="/admin">
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </ClinicLink>
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
              <ClinicLink to="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </ClinicLink>
              <ClinicLink to="/register">
                <Button variant="hero" size="sm">Register</Button>
              </ClinicLink>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMenu}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-card md:hidden"
          >
            <div className="container flex flex-col gap-2 py-4">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                return (
                  <ClinicLink key={link.path} to={link.path} onClick={closeMenu}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive ? "text-orange-500 font-bold" : "text-foreground/70"
                      )}
                    >
                      {link.label}
                    </Button>
                  </ClinicLink>
                );
              })}
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                {user ? (
                  <>
                    {displayName && (
                      <p className="text-sm font-medium text-foreground px-2 py-1">Signed in as {displayName}</p>
                    )}
                    <div className="flex gap-2">
                      {isAdmin && (
                        <ClinicLink to="/admin" className="flex-1" onClick={closeMenu}>
                          <Button variant="outline" className="w-full">Dashboard</Button>
                        </ClinicLink>
                      )}
                      <Button variant="destructive" className="flex-1" onClick={handleLogout}>
                        <LogOut className="mr-1 h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <ClinicLink to="/login" className="flex-1" onClick={closeMenu}>
                      <Button variant="outline" className="w-full">Log in</Button>
                    </ClinicLink>
                    <ClinicLink to="/register" className="flex-1" onClick={closeMenu}>
                      <Button variant="hero" className="w-full">Register</Button>
                    </ClinicLink>
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
