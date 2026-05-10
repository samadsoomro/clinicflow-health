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
            
            {/* Mobile Sidebar - Clean & Simple */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-[110] w-[300px] bg-background shadow-2xl md:hidden flex flex-col p-6"
            >
              {/* Close Button Only */}
              <div className="flex justify-end mb-8">
                <Button variant="ghost" size="icon" onClick={closeMenu} className="h-10 w-10 hover:bg-muted rounded-full">
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Menu Links - Direct Rendering for Visibility */}
              <div className="flex flex-col space-y-2 overflow-y-auto pr-2">
                {navLinks.map((link) => {
                  // Robust check for enabled tokens
                  const isTokensDisabled = link.path === "/tokens" && clinic?.live_tokens_enabled === false;
                  if (isTokensDisabled) return null;

                  const isActive = location.pathname === link.path;
                  
                  return (
                    <ClinicLink 
                      key={link.path} 
                      to={link.path} 
                      onClick={closeMenu}
                      className={cn(
                        "flex items-center px-4 py-4 text-lg font-medium rounded-xl transition-all",
                        isActive 
                          ? "bg-primary/10 text-primary font-bold border-l-4 border-primary" 
                          : "text-foreground/80 hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {link.label}
                    </ClinicLink>
                  );
                })}

                {/* Online Token Link */}
                {clinic?.online_tokens_enabled !== false && (
                  <ClinicLink 
                    to="/online-token" 
                    onClick={closeMenu}
                    className={cn(
                      "flex items-center px-4 py-4 text-lg font-medium rounded-xl transition-all mt-2",
                      location.pathname === "/online-token"
                        ? "bg-purple-500/10 text-purple-600 font-bold border-l-4 border-purple-500"
                        : "text-purple-500/80 hover:bg-purple-50/50"
                    )}
                  >
                    Online Token
                  </ClinicLink>
                )}

                {/* Messages & Account */}
                <div className="mt-6 pt-6 border-t border-border space-y-3">
                  {!isAdmin && (
                    <ClinicLink 
                      to="/messages" 
                      onClick={closeMenu}
                      className="flex items-center justify-between px-4 py-4 text-lg font-medium text-foreground/80 hover:bg-muted rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <MessageCircle className="h-5 w-5" />
                        <span>Messages</span>
                      </div>
                      {user && unreadCount > 0 && (
                        <Badge variant="destructive" className="h-6 w-6 rounded-full flex items-center justify-center p-0">
                          {unreadCount}
                        </Badge>
                      )}
                    </ClinicLink>
                  )}

                  {user ? (
                    <div className="space-y-4 pt-2">
                      {displayName && (
                        <div className="px-4 py-3 bg-muted/50 rounded-xl">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Signed in as</p>
                          <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                        </div>
                      )}
                      
                      {isAdmin && (
                        <ClinicLink to="/admin" onClick={closeMenu} className="flex items-center px-4 py-4 text-lg font-medium text-foreground/80 hover:bg-muted rounded-xl transition-all">
                          Admin Dashboard
                        </ClinicLink>
                      )}

                      <Button 
                        variant="destructive" 
                        className="w-full h-14 text-lg font-bold rounded-xl shadow-lg mt-4"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 pt-4">
                      <ClinicLink to="/login" onClick={closeMenu}>
                        <Button variant="outline" className="w-full h-14 text-lg font-semibold rounded-xl">Log in</Button>
                      </ClinicLink>
                      <ClinicLink to="/register" onClick={closeMenu}>
                        <Button variant="hero" className="w-full h-14 text-lg font-bold rounded-xl shadow-lg">Register</Button>
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
