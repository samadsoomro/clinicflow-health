import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, Menu, X, LogOut, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useClinicContext } from "@/hooks/useClinicContext";
import ClinicLink from "@/components/ClinicLink";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";



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
  const { user, profile, isSuperAdmin, isClinicAdmin, isPatient, roles, signOut } = useAuth();
  const { clinic } = useClinicContext();
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdmin = isSuperAdmin || isClinicAdmin();
  const hasRole = roles.length > 0;
  // Patient is anyone who has the patient role OR has NO roles at all (except admins identified above)
  const isActuallyPatient = !isAdmin && (isPatient || !hasRole);

  useEffect(() => {
    if (!user || !isActuallyPatient) {
      if (!user) setUnreadCount(0);
      return;
    }

    const checkMessages = async () => {
      // get message IDs belonging to this patient
      const { data: userMessages } = await (supabase as any)
        .from('contact_messages')
        .select('id')
        .eq('user_id', user.id);
      
      const messageIds = userMessages?.map((m: any) => m.id) ?? [];
      
      if (messageIds.length === 0) {
        setUnreadCount(0);
        return;
      }

      const { count } = await (supabase as any)
        .from('contact_replies')
        .select('id', { count: 'exact' })
        .eq('is_read_by_patient', false)
        .in('message_id', messageIds);
      
      setUnreadCount(count || 0);
    };

    checkMessages();
    const interval = setInterval(checkMessages, 60000);
    return () => clearInterval(interval);
  }, [user, isActuallyPatient]);
  const displayName = profile?.full_name || user?.email || null;

  const shortName = (clinic as any)?.short_name || "";
  const logoUrl = clinic?.logo_url;
  const clinicName = clinic?.clinic_name || "ClinicToken";

  const openMenu = () => {
    setIsOpen(true);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Auto-close mobile menu when location changes
  useEffect(() => {
    closeMenu();
  }, [location]);

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
            <img src={logoUrl} alt={clinicName} className="h-9 w-9 rounded-lg object-cover" loading="eager" />
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
            if (link.path === "/tokens" && clinic?.live_tokens_enabled === false) return null;
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
          {clinic?.online_tokens_enabled && (
            <ClinicLink to="/online-token">
              <Button
                variant={location.pathname === "/online-token" ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "font-medium",
                  location.pathname === "/online-token" ? "text-purple-500 font-bold" : "text-foreground/70"
                )}
              >
                Online Token
              </Button>
            </ClinicLink>
          )}
        </nav>


        <div className="hidden items-center gap-1 md:flex">
          <ThemeToggle />
          {!isAdmin && (
            <ClinicLink to="/messages" className="relative">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MessageCircle className="h-5 w-5" />
                {user && unreadCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 px-1.5 py-0.5 text-[10px] bg-destructive text-destructive-foreground hover:bg-destructive">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </ClinicLink>
          )}
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
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden"
            />
            
            {/* Sidebar from Right */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-[110] w-[280px] bg-card shadow-2xl md:hidden flex flex-col border-l border-border"
            >
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                  {logoUrl ? (
                    <img src={logoUrl} alt={clinicName} className="h-8 w-8 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <span className="font-display font-bold text-foreground truncate max-w-[160px]">{clinicName}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={closeMenu} className="hover:bg-muted">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2">Navigation</p>
                {navLinks.map((link) => {
                  if (link.path === "/tokens" && clinic?.live_tokens_enabled === false) return null;
                  const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                  return (
                    <ClinicLink key={link.path} to={link.path} onClick={closeMenu}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start h-11 px-4",
                          isActive ? "text-orange-500 font-bold bg-orange-500/10" : "text-foreground/70"
                        )}
                      >
                        {link.label}
                      </Button>
                    </ClinicLink>
                  );
                })}
                {clinic?.online_tokens_enabled && (
                  <ClinicLink to="/online-token" onClick={closeMenu}>
                    <Button
                      variant={location.pathname === "/online-token" ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-11 px-4",
                        location.pathname === "/online-token" ? "text-purple-500 font-bold bg-purple-500/10" : "text-foreground/70"
                      )}
                    >
                      Online Token
                    </Button>
                  </ClinicLink>
                )}

                <div className="mt-6 pt-6 border-t border-border flex flex-col gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 px-2">Account</p>
                  {!isAdmin && (
                    <ClinicLink to="/messages" onClick={closeMenu}>
                      <Button variant="ghost" className="w-full justify-start gap-2 h-11 px-4">
                        <MessageCircle className="h-4 w-4" />
                        Messages
                        {user && unreadCount > 0 && (
                          <Badge className="ml-auto bg-destructive text-destructive-foreground">
                            {unreadCount}
                          </Badge>
                        )}
                      </Button>
                    </ClinicLink>
                  )}
                  {user ? (
                    <>
                      {displayName && (
                        <div className="px-4 py-2 mb-2 rounded-lg bg-muted/50">
                          <p className="text-[10px] text-muted-foreground leading-none mb-1">Signed in as</p>
                          <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                        </div>
                      )}
                      {isAdmin && (
                        <ClinicLink to="/admin" onClick={closeMenu}>
                          <Button variant="ghost" className="w-full justify-start h-11 px-4">Dashboard</Button>
                        </ClinicLink>
                      )}
                      <Button variant="destructive" className="w-full justify-start h-11 px-4" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <ClinicLink to="/login" onClick={closeMenu}>
                        <Button variant="outline" className="w-full h-11">Log in</Button>
                      </ClinicLink>
                      <ClinicLink to="/register" onClick={closeMenu}>
                        <Button variant="hero" className="w-full h-11">Register</Button>
                      </ClinicLink>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default PublicNavbar;
