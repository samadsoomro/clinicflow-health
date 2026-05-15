import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Activity, Menu, X, LogOut, MessageCircle, Bell, BellOff } from "lucide-react";
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
import { subscribeToPushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";



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
  const [notifStatus, setNotifStatus] = useState<'enabled' | 'disabled' | 'denied' | 'unsupported'>('disabled');
  const [isPatientState, setIsPatientState] = useState(false);

  const isAdmin = isSuperAdmin || isClinicAdmin();
  const hasRole = roles.length > 0;
  // Patient is anyone who has the patient role OR has NO roles at all (except admins identified above)
  const isActuallyPatient = !isAdmin && (isPatient || !hasRole);

  const checkNotifStatus = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setNotifStatus('unsupported');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // Check role once to set isPatientState
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle();
    
    if (role) {
      setIsPatientState(false);
      return; 
    }
    setIsPatientState(true);

    const permission = Notification.permission;
    
    if (permission === 'denied') {
      setNotifStatus('denied');
      return;
    }

    if (permission === 'granted') {
      // Check if subscription actually exists in Supabase
      const { data: sub } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (sub?.endpoint) {
        setNotifStatus('enabled');
      } else {
        // Permission granted but no record — try to auto-resubscribe
        setNotifStatus('disabled');
        if (clinic?.id) {
          const ok = await subscribeToPushNotifications(session.user.id, clinic.id);
          if (ok) setNotifStatus('enabled');
        }
      }
    } else {
      setNotifStatus('disabled');
    }
  };

  useEffect(() => {
    checkNotifStatus();
  }, [user?.id, clinic?.id]);

  const handleEnableNotifications = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user || !clinic?.id) return;
    const success = await subscribeToPushNotifications(session.user.id, clinic.id);
    if (success) {
      setNotifStatus('enabled');
      toast.success('Notifications enabled!');
    } else {
      if (Notification.permission === 'denied') {
        setNotifStatus('denied');
        toast.error('Notifications blocked. Go to browser settings → Site Settings → allow notifications for this site.');
      }
    }
  };

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

  const openMenu = () => setIsOpen(true);
  const closeMenu = () => setIsOpen(false);
  const toggleMenu = () => setIsOpen(prev => !prev);

  // Auto-close mobile menu when location changes
  useEffect(() => {
    closeMenu();
  }, [location]);

  // Fallback for browser back/forward buttons
  useEffect(() => {
    window.addEventListener('popstate', closeMenu);
    return () => window.removeEventListener('popstate', closeMenu);
  }, []);

  const handleMobileNav = (path: string) => {
    const params = new URLSearchParams(location.search);
    const clinicParam = params.get('clinic');
    const href = clinicParam ? `${path}${path.includes('?') ? '&' : '?'}clinic=${clinicParam}` : path;
    
    // Use navigate directly for absolute control
    navigate(href);
    closeMenu();
  };

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
          
          {isPatientState && notifStatus !== 'unsupported' && (
            <button
              onClick={notifStatus === 'enabled' ? undefined : handleEnableNotifications}
              title={
                notifStatus === 'enabled' ? 'Notifications enabled ✅' :
                notifStatus === 'denied' ? 'Notifications blocked — tap to see instructions' :
                'Tap to enable token alerts 🔔'
              }
              className="relative p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {notifStatus === 'enabled' ? (
                <Bell size={18} className="text-green-500" />
              ) : notifStatus === 'denied' ? (
                <BellOff size={18} className="text-red-400" />
              ) : (
                <Bell size={18} className="text-gray-400 animate-pulse" />
              )}
              {/* Pulsing dot when not yet enabled */}
              {notifStatus === 'disabled' && (
                <>
                  <span className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full" />
                </>
              )}
            </button>
          )}

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
          
          {isPatientState && notifStatus !== 'unsupported' && (
            <button
              onClick={notifStatus === 'enabled' ? undefined : handleEnableNotifications}
              className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {notifStatus === 'enabled' ? (
                <Bell size={20} className="text-green-500" />
              ) : notifStatus === 'denied' ? (
                <BellOff size={20} className="text-red-400" />
              ) : (
                <Bell size={20} className="text-gray-400 animate-pulse" />
              )}
              {notifStatus === 'disabled' && (
                <>
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping" />
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-card" />
                </>
              )}
            </button>
          )}

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
            className="overflow-hidden border-t border-border bg-card md:hidden shadow-xl"
          >
            <div 
              key={location.pathname}
              className="container flex flex-col gap-2 py-4"
            >
              {navLinks.map((link) => {
                if (link.path === "/tokens" && clinic?.live_tokens_enabled === false) return null;
                
                // Absolute equality for Home to avoid partial matches
                const isActive = link.path === "/" 
                  ? location.pathname === "/" 
                  : location.pathname.startsWith(link.path);

                return (
                  <Button
                    key={link.path}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start h-12 px-4 transition-colors",
                      isActive ? "text-orange-500 font-bold bg-orange-500/10" : "text-foreground/70"
                    )}
                    onClick={() => handleMobileNav(link.path)}
                  >
                    {link.label}
                  </Button>
                );
              })}
              {clinic?.online_tokens_enabled && (
                <Button
                  variant={location.pathname === "/online-token" ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-12 px-4",
                    location.pathname === "/online-token" ? "text-purple-500 font-bold bg-purple-500/10" : "text-foreground/70"
                  )}
                  onClick={() => handleMobileNav("/online-token")}
                >
                  Online Token
                </Button>
              )}

              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                {!isAdmin && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2 h-12 px-4"
                    onClick={() => handleMobileNav("/messages")}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Messages
                    {user && unreadCount > 0 && (
                      <Badge className="ml-auto bg-destructive text-destructive-foreground">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                )}
                {user ? (
                  <div className="space-y-2">
                    {displayName && (
                      <div className="px-4 py-2 bg-muted/50 rounded-lg">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">Signed in as</p>
                        <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {isAdmin && (
                        <Button 
                          variant="outline" 
                          className="flex-1 h-12"
                          onClick={() => handleMobileNav("/admin")}
                        >
                          Dashboard
                        </Button>
                      )}
                      <Button variant="destructive" className="flex-1 h-12" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-12"
                      onClick={() => handleMobileNav("/login")}
                    >
                      Log in
                    </Button>
                    <Button 
                      variant="hero" 
                      className="flex-1 h-12"
                      onClick={() => handleMobileNav("/register")}
                    >
                      Register
                    </Button>
                  </div>
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
