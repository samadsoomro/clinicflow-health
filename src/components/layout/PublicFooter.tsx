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
                {socials.map((s) => {
                  if (s.label === "Facebook") {
                    return (
                      <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full flex items-center justify-center bg-[#1877F2] hover:bg-[#166FE5] transition-colors"
                        title="Facebook">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </a>
                    );
                  }
                  if (s.label === "Instagram") {
                    return (
                      <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                        style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' }}
                        title="Instagram">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                        </svg>
                      </a>
                    );
                  }
                  if (s.label === "WhatsApp") {
                    return (
                      <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full flex items-center justify-center bg-[#25D366] hover:bg-[#20BD5C] transition-colors"
                        title="WhatsApp">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </a>
                    );
                  }
                  return (
                    <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/50 text-foreground hover:bg-primary hover:text-primary-foreground hover:-translate-y-1 transition-all duration-300 shadow-sm" title={s.label}>
                      {s.label.charAt(0)}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-border/60">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground font-medium">
              &copy; {new Date().getFullYear()} {name}. All rights reserved.
            </p>
            {/* Footer credit line */}
            <div className="flex flex-col items-center gap-1 text-center px-4 w-full md:w-auto">
              <p className="text-xs text-gray-400 dark:text-gray-500 break-words text-center w-full">
                Made with{' '}
                <Heart size={10} className="inline text-red-400 fill-red-400 mx-0.5" />{' '}
                by{' '}
                <span className="font-medium break-words">
                  {name}
                </span>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Developed by Abdul Samad
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;

