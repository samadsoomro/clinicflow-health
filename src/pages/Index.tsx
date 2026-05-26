import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import ClinicLink from "@/components/ClinicLink";
import { Activity, Users, User, Clock, Bell, Shield, Building2, Stethoscope, Heart, Star, Award, Zap, MapPin, Phone, Mail, AlertTriangle, Info, X, Ticket, Globe, Pin } from "lucide-react";

import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { usePublicClinicId } from "@/hooks/useClinic";
import heroPattern from "@/assets/hero-pattern.jpg";
import { subscribeToPushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

interface SectionData {
  section_name: string;
  content_json: any;
  is_enabled: boolean;
  display_order: number;
}

const ICON_MAP: Record<string, any> = {
  users: Users, stethoscope: Stethoscope, clock: Clock, heart: Heart,
  building: Building2, shield: Shield, star: Star, award: Award,
  activity: Activity, zap: Zap,
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Index = () => {
  const clinicId = usePublicClinicId();
  const [sections, setSections] = useState<SectionData[]>([]);
  const [clinic, setClinic] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [secRes, clinicRes, docRes, certRes, notifRes] = await Promise.all([
        supabase.from("homepage_sections").select("*").eq("clinic_id", clinicId).order("display_order"),
        supabase.from("clinics").select("id, clinic_name, short_name, logo_url, theme_color, secondary_theme_color, address, contact_phone, contact_email, working_hours, qr_base_url, maps_embed_url, subdomain, hero_title, hero_subtitle, emergency_contact, second_branch_address, second_branch_working_hours, second_branch_maps_embed_url, location_heading, live_tokens_enabled, online_tokens_enabled").eq("id", clinicId).single(),
        (supabase as any).from("homepage_doctors").select("id, name, specialization, image_url, display_order").eq("clinic_id", clinicId).order("display_order"),

        supabase.from("certifications").select("id, title, image_url").eq("clinic_id", clinicId).order("sort_order"),
        supabase.from("notifications").select("id, title, message, priority, is_pinned, created_at").eq("clinic_id", clinicId).eq("is_active", true).order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(3),
      ]);

      setSections((secRes.data as SectionData[]) || []);
      setClinic(clinicRes.data);
      setDoctors((docRes.data as any[]) || []);
      setCerts((certRes.data as any[]) || []);
      setNotifs((notifRes.data as any[]) || []);
      setLoading(false);
    };
    fetchAll();
  }, [clinicId]);

  const getSection = (name: string): SectionData | undefined =>
    sections.find((s) => s.section_name === name && s.is_enabled);

  const hasCustomSections = sections.length > 0;

  // Fallback: if no homepage_sections configured, show a default landing
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const heroSection = getSection("hero");
  const statsSection = getSection("stats");
  const doctorsSection = getSection("doctors");
  const certsSection = getSection("certifications");
  const notifsSection = getSection("notifications");
  const contactSection = getSection("contact");

  // Use homepage_sections content or fallback to clinic table data
  const heroContent = heroSection?.content_json || {};
  const heroTitle = heroContent.title || clinic?.hero_title || "Smart Clinic Management, Simplified";
  const heroSubtitle = heroContent.subtitle || clinic?.hero_subtitle || "Modern Health CMS Platform";
  const heroDesc = heroContent.description || "Real-time token tracking, patient cards, notifications, and multi-clinic management — all in one powerful platform.";
  const heroBtnText = heroContent.button_text || "Get Started";
  const heroBtnLink = heroContent.button_link || "/register";
  const heroBg = heroContent.background_image || heroPattern;

  const statsItems = statsSection?.content_json?.items || [];

  const featuredDoctors = doctors;

  const notifsMaxDisplay = notifsSection?.content_json?.max_display || 3;
  const displayNotifs = notifs.slice(0, notifsMaxDisplay);

  const contactContent = contactSection?.content_json || {};
  const contactPhone = contactContent.phone || clinic?.contact_phone;
  const contactEmail = contactContent.email || clinic?.contact_email;
  const contactAddress = contactContent.address || clinic?.address;
  const contactHours = contactContent.working_hours || clinic?.working_hours;
  const mapsEmbedUrl = contactContent.maps_embed_url || clinic?.maps_embed_url;

  return (
    <>
      <div className="fixed inset-0 z-[-1]" style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32 flex items-center min-h-[90vh]">
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/50 to-transparent z-0" />
        <div className="absolute inset-0 opacity-20 z-0 mix-blend-screen pointer-events-none">
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute right-[-10%] top-[-10%] h-[40rem] w-[40rem] rounded-full bg-primary/40 blur-[120px]" />
          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[-20%] left-[-10%] h-[35rem] w-[35rem] rounded-full bg-accent/40 blur-[100px]" />
        </div>
        <div className="container relative z-10">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="mx-auto max-w-4xl text-center">
            {heroSubtitle && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 py-2 text-sm font-medium text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)] backdrop-blur-md overflow-hidden text-ellipsis whitespace-nowrap max-w-full hover:bg-primary/20 transition-colors">
                <Activity className="h-4 w-4 animate-pulse text-primary" />
                {heroSubtitle}
              </motion.div>
            )}
            <h1 className="mb-6 font-display text-5xl font-extrabold leading-tight tracking-tight text-foreground md:text-7xl drop-shadow-sm">
              {heroTitle}
            </h1>
            {heroDesc && (
              <p className="mb-10 text-lg leading-relaxed text-muted-foreground md:text-2xl max-w-2xl mx-auto font-light">{heroDesc}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 justify-center sm:flex-row sm:justify-center">
              <ClinicLink to={heroBtnLink} className="w-full sm:w-auto">
                <Button variant="default" size="lg" className="w-full px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-primary/25 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                  <span className="relative z-10">{heroBtnText}</span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                </Button>
              </ClinicLink>
              {clinic?.live_tokens_enabled !== false && (
                <ClinicLink to="/tokens" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full bg-background/50 backdrop-blur-sm text-foreground font-semibold border-2 border-border hover:bg-green-500 hover:text-white hover:border-green-500 hover:-translate-y-1 shadow-lg transition-all duration-300 px-8 py-6 text-lg rounded-full">
                    <Activity className="mr-2 h-5 w-5" /> See Live Tokens
                  </Button>
                </ClinicLink>
              )}
              {clinic?.online_tokens_enabled && (
                <ClinicLink to="/online-token" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full bg-secondary text-secondary-foreground font-semibold border-2 border-secondary hover:bg-secondary/90 hover:border-secondary/90 hover:-translate-y-1 hover:shadow-secondary/30 shadow-lg transition-all duration-300 px-8 py-6 text-lg rounded-full">
                    <Ticket className="mr-2 h-5 w-5" /> Get Online Token
                  </Button>
                </ClinicLink>
              )}
            </div>
          </motion.div>

          {/* Stats */}
          {statsItems.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }} className="mx-auto mt-20 grid max-w-4xl gap-6 grid-cols-1 sm:grid-cols-3">
              {statsItems.map((stat: any, i: number) => {
                const IconComp = ICON_MAP[stat.icon] || Activity;
                return (
                  <motion.div whileHover={{ y: -5, scale: 1.02 }} key={i} className="group flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl transition-all duration-300 hover:bg-white/10 dark:border-primary/10 dark:bg-primary/5 dark:hover:bg-primary/10">
                    <div className="p-3 rounded-full bg-primary/10 text-primary mb-2 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <IconComp className="h-6 w-6" />
                    </div>
                    <span className="font-display text-4xl font-bold text-foreground drop-shadow-sm">{stat.value}</span>
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* Doctors */}
      {(doctorsSection || !hasCustomSections) && featuredDoctors.length > 0 && (
        <section className="py-24 overflow-hidden bg-background relative z-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none"></div>
          <div className="container relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 font-display text-4xl font-bold text-foreground md:text-5xl">
                {doctorsSection?.content_json?.title || "Meet Our Doctors"}
              </h2>
              <div className="h-1 w-20 bg-primary mx-auto rounded-full mb-6"></div>
              <p className="text-lg text-muted-foreground">
                {doctorsSection?.content_json?.subtitle || "Our team of experienced professionals dedicated to your care."}
              </p>
            </motion.div>
            <div className={`mx-auto max-w-5xl ${featuredDoctors.length === 0 ? 'text-center py-12' : featuredDoctors.length < 3 ? 'flex flex-wrap justify-center gap-8' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'}`}>
              {featuredDoctors.length === 0 ? (
                <div className="text-muted-foreground italic">Coming soon</div>
              ) : (
                featuredDoctors.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={fadeUp}
                    whileHover={{ y: -10 }}
                    className="group flex flex-col items-center text-center rounded-3xl border border-border/50 bg-card p-8 shadow-lg transition-all duration-300 hover:shadow-2xl hover:border-primary/30 w-full relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-primary">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                    {doc.image_url ? (
                      <div className="relative mb-6">
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse scale-110 group-hover:scale-125 transition-transform duration-500"></div>
                        <img 
                          src={doc.image_url} 
                          alt={doc.name} 
                          className="relative h-32 w-32 rounded-full object-cover border-4 border-background shadow-md z-10 group-hover:scale-105 transition-transform duration-300" 
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-secondary/50 text-primary/40 group-hover:bg-primary/10 transition-colors duration-300">
                        <User className="h-16 w-16" />
                      </div>
                    )}
                    <h3 className="font-display text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{doc.name}</h3>
                    <Badge variant="secondary" className="px-3 py-1 font-medium bg-secondary text-secondary-foreground">{doc.specialization}</Badge>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Certifications */}
      {certsSection && certs.length > 0 && (
        <section className="py-24 bg-card/80 backdrop-blur-xl border-y border-border/50 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent pointer-events-none"></div>
          <div className="container relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 font-display text-4xl font-bold text-foreground md:text-5xl">
                {certsSection.content_json?.title || "Our Certifications"}
              </h2>
              <div className="h-1 w-20 bg-accent mx-auto rounded-full mb-6"></div>
              <p className="text-lg text-muted-foreground">
                {certsSection.content_json?.subtitle || "Recognized excellence and verified standards in healthcare."}
              </p>
            </motion.div>
            
            <div className={`mx-auto ${certs.length === 1 ? 'max-w-md' : 'max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'}`}>
              {certs.map((cert, i) => (
                <motion.div
                  key={cert.id}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={fadeUp}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="rounded-3xl border border-border/50 bg-card shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-accent/30 group cursor-pointer"
                >
                  <div className="aspect-[4/3] overflow-hidden relative bg-muted flex items-center justify-center">
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                    <img 
                      src={cert.image_url} 
                      alt={cert.title} 
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                      loading="lazy"
                    />
                    <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
                      <Badge variant="default" className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border-white/30">
                        Verified
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6 text-center bg-card relative z-20">
                    <h3 className="font-display font-semibold text-foreground text-lg group-hover:text-accent transition-colors">{cert.title}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Notifications */}
      {notifsSection && notifs.length > 0 && (
        <section className="py-24 bg-background border-y border-border/50 relative z-10">
          <div className="container">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 font-display text-4xl font-bold text-foreground md:text-5xl">
                {notifsSection.content_json?.title || "Latest Updates"}
              </h2>
              <div className="h-1 w-20 bg-primary mx-auto rounded-full mb-6"></div>
              <p className="text-lg text-muted-foreground">
                {notifsSection.content_json?.subtitle || "Stay informed about our clinic news and announcements."}
              </p>
            </motion.div>
            <div className="mx-auto max-w-3xl space-y-6">
              {displayNotifs.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.01, x: 5 }}
                  className={`relative overflow-hidden rounded-2xl border p-6 shadow-md transition-all duration-300 hover:shadow-lg ${n.priority === "urgent" ? "border-destructive/30 bg-destructive/5" : "border-border bg-card hover:border-primary/30"
                    }`}
                >
                  {n.priority === "urgent" && <div className="absolute top-0 left-0 w-1 h-full bg-destructive"></div>}
                  {!n.priority && <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 transition-opacity group-hover:opacity-100"></div>}
                  
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl shadow-sm ${n.priority === "urgent" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                      }`}>
                      {n.priority === "urgent" ? <AlertTriangle className="h-6 w-6" /> : <Bell className="h-6 w-6" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-display text-xl font-semibold text-foreground">{n.title}</h3>
                        {n.is_pinned && <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1"><Pin className="w-3 h-3"/> Pinned</Badge>}
                        {n.priority === "urgent" && <Badge variant="destructive" className="animate-pulse">Urgent</Badge>}
                      </div>
                      <p className="text-base text-muted-foreground leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      {contactSection && clinic && (
        <section className="py-24 bg-card/80 backdrop-blur-xl border-y border-border/50 relative">
          <div className="container">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 font-display text-4xl font-bold text-foreground md:text-5xl">
                {contactSection.content_json?.title || "Contact Us"}
              </h2>
              <div className="h-1 w-20 bg-primary mx-auto rounded-full mb-6"></div>
              <p className="text-lg text-muted-foreground">
                {contactSection.content_json?.subtitle || "Get in touch with our team for any inquiries."}
              </p>
            </motion.div>
            
            <div className="grid lg:grid-cols-5 gap-12 items-start mx-auto max-w-6xl">
              <motion.div 
                initial={{ opacity: 0, x: -30 }} 
                whileInView={{ opacity: 1, x: 0 }} 
                viewport={{ once: true }} 
                transition={{ duration: 0.6 }}
                className="lg:col-span-2 rounded-3xl border border-border bg-card p-8 shadow-xl relative overflow-hidden"
              >
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <h3 className="text-2xl font-display font-bold mb-8 flex items-center gap-2">
                  <Activity className="h-6 w-6 text-primary" />
                  Contact Info
                </h3>
                
                <div className="space-y-8 relative z-10">
                  <div className="group flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground/70 uppercase tracking-wider mb-1">Main Address</h4>
                      <p className="text-foreground font-medium">{contactAddress || clinic.address}</p>
                    </div>
                  </div>

                  {(contactSection.content_json?.second_branch_address || clinic.second_branch_address) && (
                    <div className="group flex items-start gap-4">
                       <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground/70 uppercase tracking-wider mb-1">Second Branch</h4>
                        <p className="text-foreground font-medium">{contactSection.content_json?.second_branch_address || clinic.second_branch_address}</p>
                      </div>
                    </div>
                  )}

                  {(contactPhone || clinic.contact_phone) && (
                    <div className="group flex items-start gap-4">
                      <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground/70 uppercase tracking-wider mb-1">Phone</h4>
                        <p className="text-foreground font-medium">{contactPhone || clinic.contact_phone}</p>
                      </div>
                    </div>
                  )}

                  {(contactEmail || clinic.contact_email) && (
                    <div className="group flex items-start gap-4">
                       <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground/70 uppercase tracking-wider mb-1">Email</h4>
                        <p className="text-foreground font-medium">{contactEmail || clinic.contact_email}</p>
                      </div>
                    </div>
                  )}

                  <div className="group flex items-start gap-4">
                     <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground/70 uppercase tracking-wider mb-1">Main Hours</h4>
                      <p className="text-foreground font-medium">{contactHours || clinic.working_hours}</p>
                    </div>
                  </div>

                  {(contactSection.content_json?.second_branch_working_hours || clinic.second_branch_working_hours) && (
                    <div className="group flex items-start gap-4">
                       <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground/70 uppercase tracking-wider mb-1">Second Branch Hours</h4>
                        <p className="text-foreground font-medium">{contactSection.content_json?.second_branch_working_hours || clinic.second_branch_working_hours}</p>
                      </div>
                    </div>
                  )}
                  
                  {clinic?.emergency_contact && (
                    <div className="pt-6 border-t border-border mt-4">
                      <div className="group flex items-center gap-4 bg-destructive/10 p-4 rounded-2xl border border-destructive/20 hover:bg-destructive/20 transition-colors">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground animate-pulse">
                          <Bell className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-destructive uppercase tracking-wider text-xs mb-1">Emergency</h4>
                          <p className="text-foreground font-display text-xl font-bold">{clinic.emergency_contact}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {mapsEmbedUrl && (mapsEmbedUrl.includes('google.com/maps/embed') || mapsEmbedUrl.includes('maps.google.com') || mapsEmbedUrl.includes('google.com/maps')) && (
                <motion.div 
                  initial={{ opacity: 0, x: 30 }} 
                  whileInView={{ opacity: 1, x: 0 }} 
                  viewport={{ once: true }} 
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="lg:col-span-3 space-y-8"
                >
                  <div>
                    {clinic.second_branch_maps_embed_url && (
                      <h3 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" /> Main Branch
                      </h3>
                    )}
                    <div className="overflow-hidden rounded-3xl border border-border shadow-xl hover:shadow-2xl transition-shadow duration-300 bg-muted group">
                      <iframe
                        src={mapsEmbedUrl}
                        width="100%"
                        height={clinic.second_branch_maps_embed_url ? "300" : "450"}
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Main Location"
                        className="grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out"
                      />
                    </div>
                  </div>

                  {clinic.second_branch_maps_embed_url && (
                    <div>
                      <h3 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-accent" /> Second Branch
                      </h3>
                      <div className="overflow-hidden rounded-3xl border border-border shadow-xl hover:shadow-2xl transition-shadow duration-300 bg-muted group">
                        <iframe
                          src={clinic.second_branch_maps_embed_url}
                          width="100%"
                          height="300"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Second Branch Location"
                          className="grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24 bg-background relative overflow-hidden z-10">
        <div className="absolute inset-0 bg-primary/5"></div>
        <div className="container relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            whileInView={{ opacity: 1, scale: 1 }} 
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl rounded-[3rem] bg-gradient-to-br from-primary via-primary/90 to-accent p-12 text-center md:p-20 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:scale-150 transition-transform duration-1000"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 group-hover:scale-150 transition-transform duration-1000"></div>
            
            <h2 className="mb-6 font-display text-4xl font-extrabold text-white md:text-5xl drop-shadow-md relative z-10">
              Ready to Experience Better Care?
            </h2>
            <p className="mb-10 text-lg text-white/90 md:text-xl max-w-2xl mx-auto relative z-10 font-medium">
              Join our clinic today and get access to seamless appointments, live tracking, and personalized health management.
            </p>
            <div className="flex flex-wrap gap-4 justify-center relative z-10">
              <ClinicLink to="/register">
                <Button size="lg" className="px-10 py-7 text-lg rounded-full bg-white text-primary hover:bg-white/90 hover:-translate-y-1 shadow-xl hover:shadow-white/20 transition-all duration-300 font-bold">
                  Register Now <Activity className="ml-2 h-5 w-5" />
                </Button>
              </ClinicLink>
              {clinic?.online_tokens_enabled && (
                <ClinicLink to="/online-token">
                  <Button size="lg" variant="outline" className="px-10 py-7 text-lg rounded-full bg-transparent text-white border-2 border-white/50 hover:bg-white/10 hover:border-white hover:-translate-y-1 transition-all duration-300 font-bold backdrop-blur-sm">
                    <Ticket className="mr-2 h-5 w-5" /> Get Online Token
                  </Button>
                </ClinicLink>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Index;
