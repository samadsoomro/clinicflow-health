import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import ClinicLink from "@/components/ClinicLink";
import { Activity, Users, User, Clock, Bell, Shield, Building2, Stethoscope, Heart, Star, Award, Zap, MapPin, Phone, Mail, AlertTriangle, Info, X, Ticket, Globe, Pin, GraduationCap, BookOpen, Languages, CalendarDays, FileText } from "lucide-react";

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

interface HomepageDoctor {
  id: string;
  name: string;
  specialization: string;
  image_url?: string | null;
  display_order: number;
  bio_enabled?: boolean | null;
  bio?: string | null;
  qualification?: string | null;
  degree?: string | null;
  university?: string | null;
  years_experience?: string | null;
  languages?: string | null;
  available_days?: string | null;
  fee?: string | null;
  extra_info?: string | null;
}

const Index = () => {
  const clinicId = usePublicClinicId();
  const [sections, setSections] = useState<SectionData[]>([]);
  const [clinic, setClinic] = useState<any>(null);
  const [doctors, setDoctors] = useState<HomepageDoctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<HomepageDoctor | null>(null);
  const [certs, setCerts] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [secRes, clinicRes, docRes, certRes, notifRes] = await Promise.all([
        supabase.from("homepage_sections").select("*").eq("clinic_id", clinicId).order("display_order"),
        supabase.from("clinics").select("id, clinic_name, short_name, logo_url, theme_color, secondary_theme_color, address, contact_phone, contact_email, working_hours, qr_base_url, maps_embed_url, subdomain, hero_title, hero_subtitle, emergency_contact, second_branch_address, second_branch_working_hours, second_branch_maps_embed_url, location_heading, live_tokens_enabled, online_tokens_enabled, google_review_url").eq("id", clinicId).single(),
        (supabase as any).from("homepage_doctors").select("id, name, specialization, image_url, display_order, bio_enabled, bio, qualification, degree, university, years_experience, languages, available_days, fee, extra_info").eq("clinic_id", clinicId).order("display_order"),

        supabase.from("certifications").select("id, title, image_url").eq("clinic_id", clinicId).order("sort_order"),
        supabase.from("notifications").select("id, title, message, priority, is_pinned, created_at").eq("clinic_id", clinicId).eq("is_active", true).order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(3),
      ]);

      setSections((secRes.data as SectionData[]) || []);
      setClinic(clinicRes.data);
      setDoctors((docRes.data as HomepageDoctor[]) || []);
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
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="mb-8 inline-flex items-center justify-center gap-2 rounded-3xl md:rounded-full border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)] backdrop-blur-md hover:bg-primary/20 transition-colors w-auto max-w-full">
                <Activity className="h-4 w-4 animate-pulse text-primary shrink-0" />
                <span className="break-words text-center whitespace-normal">{heroSubtitle}</span>
              </motion.div>
            )}
            {/* Hero title — allow natural wrapping on all screen sizes */}
            <h1 className="mb-6 font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight text-foreground text-center drop-shadow-sm break-words hyphens-auto px-2">
              {heroTitle}
            </h1>
            {heroDesc && (
              <p className="mb-10 text-lg leading-relaxed text-slate-800 dark:text-slate-200 md:text-2xl max-w-2xl mx-auto font-normal drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">{heroDesc}</p>
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
                  <motion.div whileHover={{ y: -5, scale: 1.02 }} key={i} className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 p-6 backdrop-blur-xl shadow-xl transition-all duration-300 hover:bg-white dark:border-primary/10 dark:bg-primary/5 dark:hover:bg-primary/10">
                    <div className="p-3 rounded-full bg-primary/10 text-primary mb-2 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <IconComp className="h-6 w-6" />
                    </div>
                    <span className="font-display text-4xl font-bold text-slate-900 dark:text-white drop-shadow-sm">{stat.value}</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{stat.title}</span>
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
                featuredDoctors.map((doc, i) => {
                  const hasProfile = !!(
                    doc.qualification || doc.degree || doc.university ||
                    doc.years_experience || doc.languages || doc.available_days ||
                    doc.fee || doc.extra_info || doc.bio
                  );
                  const isClickable = !!(doc.bio_enabled && hasProfile);

                  return (
                    <motion.div
                      key={doc.id}
                      custom={i}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: "-50px" }}
                      variants={fadeUp}
                      whileHover={isClickable ? { y: -10, scale: 1.05 } : { y: -10 }}
                      onClick={() => {
                        if (isClickable) {
                          setSelectedDoctor(doc);
                        }
                      }}
                      className={`group flex flex-col items-center text-center rounded-3xl border border-border/50 bg-card p-8 shadow-lg transition-all duration-300 hover:shadow-2xl hover:border-primary/30 w-full relative overflow-hidden ${
                        isClickable ? 'cursor-pointer hover:shadow-xl hover:scale-105 transition-transform' : 'cursor-default'
                      }`}
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
                      <Badge variant="outline" className="px-3 py-1 font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 dark:bg-primary/20 dark:text-teal-300 dark:border-primary/30 transition-colors">{doc.specialization}</Badge>
                      
                      {/* Small "View Bio" hint badge — only if bio enabled */}
                      {isClickable && (
                        <div className="mt-4 text-xs text-blue-500 font-semibold flex items-center gap-1">
                          <Info size={12} />
                          View Profile
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      )}

      {/* Bio popup modal */}
      {selectedDoctor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setSelectedDoctor(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto text-left"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            {/* Header */}
            <div className="flex items-start gap-4 mb-5">
              {selectedDoctor.image_url ? (
                <img
                  src={selectedDoctor.image_url}
                  alt={selectedDoctor.name}
                  className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-blue-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <User size={32} className="text-blue-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-foreground">{selectedDoctor.name}</h3>
                <p className="text-blue-500 font-medium text-sm mt-0.5">{selectedDoctor.specialization}</p>
              </div>
              {/* Close button */}
              <button
                onClick={() => setSelectedDoctor(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
              >
                <X size={22} />
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-gray-700 mb-4" />

            {/* Structured profile fields — only render if value exists */}
            <div className="space-y-3">
              {[
                { key: 'qualification', label: 'Qualification', icon: <GraduationCap size={16} className="text-blue-500" /> },
                { key: 'degree', label: 'Degree', icon: <BookOpen size={16} className="text-purple-500" /> },
                { key: 'university', label: 'University / Institute', icon: <Building2 size={16} className="text-green-500" /> },
                { key: 'years_experience', label: 'Experience', icon: <Clock size={16} className="text-orange-500" /> },
                { key: 'languages', label: 'Languages', icon: <Languages size={16} className="text-teal-500" /> },
                { key: 'available_days', label: 'Available Days', icon: <CalendarDays size={16} className="text-indigo-500" /> },
                { key: 'fee', label: 'Consultation Fee', icon: <Stethoscope size={16} className="text-red-500" /> },
              ].map(field => {
                const val = selectedDoctor[field.key as keyof HomepageDoctor];
                return val ? (
                  <div key={field.key} className="flex items-start gap-3 py-2.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {field.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        {field.label}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mt-0.5">
                        {val}
                      </p>
                    </div>
                  </div>
                ) : null;
              })}

              {/* Extra info */}
              {selectedDoctor.extra_info && (
                <div className="mt-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={14} className="text-gray-400" />
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">About</p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {selectedDoctor.extra_info}
                  </p>
                </div>
              )}

              {/* Fallback — if bio exists (old single text field) and no structured data */}
              {!selectedDoctor.qualification && !selectedDoctor.degree && !selectedDoctor.university
                && !selectedDoctor.years_experience && !selectedDoctor.extra_info
                && selectedDoctor.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {selectedDoctor.bio}
                </p>
              )}
            </div>

            {/* Close button at bottom */}
            <button
              onClick={() => setSelectedDoctor(null)}
              className="mt-5 w-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 py-2.5 rounded-xl text-sm font-medium transition text-foreground"
            >
              Close
            </button>
          </div>
        </div>
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

                {clinic?.google_review_url && (
                  <div className="mt-6 pt-6 border-t border-border text-center relative z-10">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Happy with our service? Share your experience!
                    </p>
                    
                    <a
                      href={clinic.google_review_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-yellow-400 shadow-sm hover:shadow-md rounded-xl px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-all"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      ⭐ Leave a Google Review
                    </a>
                  </div>
                )}
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

      {clinic?.google_review_url && (
        <a
          href={clinic.google_review_url}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl rounded-full px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all group"
          title="Leave us a Google Review"
        >
          <div className="w-5 h-5 flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <span className="hidden sm:inline">Rate Us on Google</span>
          <Star size={14} className="text-yellow-400 fill-yellow-400" />
        </a>
      )}
    </>
  );
};

export default Index;
