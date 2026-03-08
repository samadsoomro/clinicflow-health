import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Activity, Users, Clock, Bell, Shield, Building2, Stethoscope, Heart, Star, Award, Zap, MapPin, Phone, Mail, AlertTriangle, Info } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { usePublicClinicId } from "@/hooks/useClinic";
import heroPattern from "@/assets/hero-pattern.jpg";

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
        supabase.from("clinics").select("*").eq("id", clinicId).single(),
        supabase.from("doctors").select("id, name, specialization, image_url, status").eq("clinic_id", clinicId).eq("status", "active"),
        supabase.from("certifications").select("id, title, image_url").eq("clinic_id", clinicId).order("sort_order"),
        supabase.from("notifications").select("id, title, message, priority, created_at").eq("clinic_id", clinicId).eq("is_active", true).order("created_at", { ascending: false }).limit(3),
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

  const featuredDoctorIds = doctorsSection?.content_json?.featured_ids || [];
  const doctorsMaxDisplay = doctorsSection?.content_json?.max_display;
  let featuredDoctors = featuredDoctorIds.length > 0
    ? doctors.filter((d) => featuredDoctorIds.includes(d.id))
    : doctors;
  if (doctorsMaxDisplay) featuredDoctors = featuredDoctors.slice(0, doctorsMaxDisplay);

  const notifsMaxDisplay = notifsSection?.content_json?.max_display || 3;
  const displayNotifs = notifs.slice(0, notifsMaxDisplay);

  const contactContent = contactSection?.content_json || {};
  const contactPhone = contactContent.phone || clinic?.contact_phone;
  const contactEmail = contactContent.email || clinic?.contact_email;
  const contactAddress = contactContent.address || clinic?.address;
  const contactHours = contactContent.working_hours || clinic?.working_hours;
  const mapsEmbedUrl = contactContent.maps_embed_url;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32" style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0 gradient-hero opacity-85" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="container relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mx-auto max-w-3xl text-center">
            {heroSubtitle && (
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary-foreground/80">
                <Activity className="h-4 w-4" />
                {heroSubtitle}
              </div>
            )}
            <h1 className="mb-6 font-display text-4xl font-extrabold leading-tight tracking-tight text-primary-foreground md:text-6xl">
              {heroTitle}
            </h1>
            {heroDesc && (
              <p className="mb-8 text-lg leading-relaxed text-primary-foreground/70 md:text-xl">{heroDesc}</p>
            )}
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link to={heroBtnLink}>
                <Button variant="accent" size="lg" className="px-8">{heroBtnText}</Button>
              </Link>
              <Link to="/tokens">
                <Button variant="outline" size="lg" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 px-8">
                  See Live Tokens
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          {statsItems.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }} className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-3">
              {statsItems.map((stat: any, i: number) => {
                const IconComp = ICON_MAP[stat.icon] || Activity;
                return (
                  <div key={i} className="flex flex-col items-center gap-1 rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-4 backdrop-blur-sm">
                    <IconComp className="mb-1 h-5 w-5 text-primary-foreground/60" />
                    <span className="font-display text-2xl font-bold text-primary-foreground">{stat.value}</span>
                    <span className="text-xs text-primary-foreground/60">{stat.title}</span>
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* Doctors */}
      {(doctorsSection || !hasCustomSections) && featuredDoctors.length > 0 && (
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
                {doctorsSection?.content_json?.title || "Meet Our Doctors"}
              </h2>
              <p className="text-lg text-muted-foreground">
                {doctorsSection?.content_json?.subtitle || "Our team of experienced professionals"}
              </p>
            </div>
            <div className={`mx-auto max-w-4xl ${featuredDoctors.length < 3 ? 'flex flex-wrap justify-center gap-6' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'}`}>
              {featuredDoctors.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={fadeUp}
                  className="group flex flex-col items-center text-center rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:shadow-card hover:-translate-y-1"
                >
                  {doc.image_url ? (
                    <img src={doc.image_url} alt={doc.name} className="mx-auto mb-4 h-24 w-24 rounded-full object-cover border-4 border-secondary" />
                  ) : (
                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-secondary text-primary">
                      <Stethoscope className="h-10 w-10" />
                    </div>
                  )}
                  <h3 className="font-display text-lg font-semibold text-foreground">{doc.name}</h3>
                  <p className="text-sm text-muted-foreground">{doc.specialization}</p>
                </motion.div>
              ))}
            </div>
            </div>
          </div>
        </section>
      )}

      {/* Certifications */}
      {certsSection && certs.length > 0 && (
        <section className="py-20 bg-secondary/30">
          <div className="container">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
                {certsSection.content_json?.title || "Our Certifications"}
              </h2>
              <p className="text-lg text-muted-foreground">
                {certsSection.content_json?.subtitle || "Recognized excellence in healthcare"}
              </p>
            </div>
            {certs.length === 1 ? (
              <div className="mx-auto max-w-sm">
                  <motion.div
                    custom={0}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
                  >
                    <div className="aspect-[210/297] overflow-hidden">
                      <img src={certs[0].image_url} alt={certs[0].title} className="h-full w-full object-cover" />
                    </div>
                    <div className="p-4 text-center">
                      <h3 className="font-display font-semibold text-foreground">{certs[0].title}</h3>
                    </div>
                  </motion.div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {certs.map((cert, i) => (
                  <motion.div
                    key={cert.id}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
                  >
                    <div className="aspect-[210/297] overflow-hidden">
                      <img src={cert.image_url} alt={cert.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="p-4 text-center">
                      <h3 className="font-display font-semibold text-foreground">{cert.title}</h3>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Notifications */}
      {notifsSection && notifs.length > 0 && (
        <section className="py-20">
          <div className="container">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
                {notifsSection.content_json?.title || "Latest Updates"}
              </h2>
              <p className="text-lg text-muted-foreground">
                {notifsSection.content_json?.subtitle || "Stay informed about our clinic"}
              </p>
            </div>
            <div className="mx-auto max-w-2xl space-y-4">
              {displayNotifs.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`rounded-2xl border p-5 shadow-soft ${
                    n.priority === "urgent" ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                      n.priority === "urgent" ? "bg-destructive/10 text-destructive" : "bg-secondary text-primary"
                    }`}>
                      {n.priority === "urgent" ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-semibold text-foreground">{n.title}</h3>
                        {n.priority === "urgent" && <Badge variant="destructive" className="text-[10px]">Urgent</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
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
        <section className="py-20 bg-secondary/30">
          <div className="container">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
                {contactSection.content_json?.title || "Contact Us"}
              </h2>
              <p className="text-lg text-muted-foreground">
                {contactSection.content_json?.subtitle || "Get in touch with our team"}
              </p>
            </div>
            <div className="mx-auto max-w-xl space-y-6">
              <div className="rounded-2xl border border-border bg-card p-8 shadow-soft space-y-4">
                {contactAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-foreground">{contactAddress}</p>
                  </div>
                )}
                {contactPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-foreground">{contactPhone}</p>
                  </div>
                )}
                {contactEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-foreground">{contactEmail}</p>
                  </div>
                )}
                {contactHours && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-foreground">{contactHours}</p>
                  </div>
                )}
                {clinic?.emergency_contact && (
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-destructive flex-shrink-0" />
                    <p className="text-foreground">Emergency: {clinic.emergency_contact}</p>
                  </div>
                )}
              </div>
              {mapsEmbedUrl && (
                <div className="overflow-hidden rounded-2xl border border-border shadow-soft">
                  <iframe src={mapsEmbedUrl} width="100%" height="300" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Clinic Location" />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl rounded-3xl gradient-hero p-10 text-center md:p-16 shadow-elevated">
            <h2 className="mb-4 font-display text-3xl font-bold text-primary-foreground md:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mb-8 text-primary-foreground/70">
              Register today and experience modern healthcare management.
            </p>
            <Link to="/register">
              <Button variant="accent" size="lg" className="px-10">Register Now</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Index;
