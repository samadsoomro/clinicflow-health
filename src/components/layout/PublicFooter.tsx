import { useEffect, useState } from "react";
import { Activity, Heart, Cross, Stethoscope, Phone, Mail, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClinicContext } from "@/hooks/useClinicContext";
import ClinicLink from "@/components/ClinicLink";
import { motion } from "framer-motion";

const PublicFooter = () => {
  const { clinic, clinicId } = useClinicContext();
  const [footer, setFooter] = useState<any>(null);

  useEffect(() => {
    const fetchFooter = async () => {
      const { data } = await supabase
        .from("homepage_sections")
        .select("content_json, is_enabled")
        .eq("clinic_id", clinicId)
        .eq("section_name", "footer")
        .maybeSingle();
      if (data?.is_enabled) setFooter(data.content_json);
    };
    fetchFooter();
  }, [clinicId]);

  const f = footer || {};
  const name = clinic?.clinic_name || "ClinicToken";
  const shortName = (clinic as any)?.short_name || "";
  const logo = f.logo_override || clinic?.logo_url;
  const phone = f.phone || clinic?.contact_phone;
  const email = f.email || clinic?.contact_email;

  const socials = [
    { label: "Facebook", url: f.social_facebook },
    { label: "Instagram", url: f.social_instagram },
    { label: "WhatsApp", url: f.social_whatsapp },
    { label: "LinkedIn", url: f.social_linkedin },
  ].filter((s) => s.url);

  return (
    <footer className="relative overflow-hidden border-t border-border bg-card/80 backdrop-blur-xl">
      {/* Animated Health Sign Background Element */}
      <div className="absolute -right-32 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} 
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="text-red-600 dark:text-red-500 h-[30rem] w-[30rem]"
        >
          <Activity className="w-full h-full" strokeWidth={1.2} />
        </motion.div>
      </div>

      <div className="container relative z-10 py-16">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative group cursor-pointer">
                <div className="absolute -inset-2 bg-gradient-to-r from-primary to-accent rounded-full opacity-0 group-hover:opacity-20 blur transition-opacity duration-500"></div>
                {logo ? (
                  <img src={logo} alt={name} className="h-10 w-10 rounded-xl object-cover relative shadow-sm" />
                ) : (
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-md">
                    <Activity className="h-6 w-6 text-primary-foreground animate-pulse" />
                  </div>
                )}
              </div>
              <div>
                {shortName && (
                  <span className="block font-display text-xs font-bold text-primary uppercase tracking-wider mb-0.5">{shortName}</span>
                )}
                <span className="font-display text-xl font-bold text-foreground tracking-tight">{name}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              {f.description || "Modern health management platform designed for clinics and hospitals to deliver exceptional care and streamline operations."}
            </p>
            
            {/* The Animated Health Sign */}
            {(() => {
              const isOperational = f.system_operational !== false;
              return (
                <div className="flex items-center gap-4 mt-6 p-4 rounded-2xl bg-neutral-100/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/40 max-w-xs shadow-sm backdrop-blur-md">
                  <div className={`relative flex items-center justify-center h-12 w-12 rounded-full ${isOperational ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                    {isOperational && (
                      <motion.div 
                        className="absolute inset-0 rounded-full border-2 border-primary/40 border-t-primary"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                    <motion.div 
                      animate={isOperational ? { scale: [1, 1.2, 1] } : {}} 
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Activity className={`h-6 w-6 ${isOperational ? 'text-primary' : 'text-destructive'}`} />
                    </motion.div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Health Status</p>
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full animate-pulse ${isOperational ? 'bg-green-500' : 'bg-destructive'}`}></div>
                      <span className="text-sm font-bold text-foreground">
                        {isOperational ? 'Systems Operational' : 'Under Maintenance'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          
          <div className="md:col-span-2">
            <h4 className="mb-6 font-display font-bold text-foreground text-lg">Quick Links</h4>
            <div className="flex flex-col gap-4">
              <ClinicLink to="/" className="text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-300 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary/50"></div> Home
              </ClinicLink>
              {clinic?.live_tokens_enabled !== false && (
                <ClinicLink to="/tokens" className="text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-300 flex items-center gap-2">
                   <div className="h-1 w-1 rounded-full bg-primary/50"></div> Live Tokens
                </ClinicLink>
              )}
              <ClinicLink to="/notifications" className="text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-300 flex items-center gap-2">
                 <div className="h-1 w-1 rounded-full bg-primary/50"></div> Notifications
              </ClinicLink>
            </div>
          </div>
          
          <div className="md:col-span-3">
            <h4 className="mb-6 font-display font-bold text-foreground text-lg">Patient Services</h4>
            <div className="flex flex-col gap-4">
              <ClinicLink to="/contact" className="text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-300 flex items-center gap-2">
                 <div className="h-1 w-1 rounded-full bg-primary/50"></div> Contact Support
              </ClinicLink>
              <ClinicLink to="/location" className="text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-300 flex items-center gap-2">
                 <div className="h-1 w-1 rounded-full bg-primary/50"></div> Find Locations
              </ClinicLink>
              <ClinicLink to="/register" className="text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all duration-300 flex items-center gap-2">
                 <div className="h-1 w-1 rounded-full bg-primary/50"></div> New Patient Registration
              </ClinicLink>
            </div>
          </div>
          
          <div className="md:col-span-3">
            <h4 className="mb-6 font-display font-bold text-foreground text-lg">Get in Touch</h4>
            <div className="flex flex-col gap-4 text-sm text-muted-foreground">
              {phone && (
                <div className="flex items-center gap-3 group">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer">{phone}</span>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-3 group">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer break-all">{email}</span>
                </div>
              )}
              {f.address && (
                <div className="flex items-start gap-3 group">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span className="leading-relaxed text-foreground font-semibold">{f.address}</span>
                </div>
              )}
            </div>
            
            {socials.length > 0 && (
              <div className="mt-8 flex gap-3">
                {socials.map((s) => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/50 text-foreground hover:bg-primary hover:text-primary-foreground hover:-translate-y-1 transition-all duration-300 shadow-sm" title={s.label}>
                    {s.label.charAt(0)}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-border/60">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground font-medium">
              &copy; {new Date().getFullYear()} {name}. All rights reserved.
            </p>
            <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:justify-center sm:gap-2 text-slate-800 dark:text-slate-200 bg-secondary/80 dark:bg-secondary/20 px-6 py-2.5 rounded-full border border-border/60 shadow-sm font-semibold">
              <span className="text-sm text-center whitespace-nowrap flex items-center gap-1.5 font-semibold">
                Made with 
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Heart className="h-4 w-4 text-rose-600 fill-rose-600 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                </motion.div>
                by {name}
              </span>
              <span className="hidden sm:inline text-slate-400 dark:text-slate-600 font-bold">•</span>
              <span className="text-sm text-center whitespace-nowrap font-semibold tracking-wide">Developed by Abdul Samad</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;

