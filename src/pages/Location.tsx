import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePublicClinicId } from "@/hooks/useClinic";

const Location = () => {
  const clinicId = usePublicClinicId();
  const [clinic, setClinic] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("clinics")
        .select("clinic_name, address, contact_phone, working_hours, maps_embed_url, location_heading")
        .eq("id", clinicId)
        .single();
      setClinic(data);
      setLoading(false);
    };
    fetch();
  }, [clinicId]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const mapsUrl = (clinic as any)?.maps_embed_url;
  const locationHeading = (clinic as any)?.location_heading;

  return (
    <div className="relative min-h-[85vh] overflow-hidden bg-background">
      {/* Decorative Background Glow Orbs */}
      <div className="absolute inset-0 opacity-30 z-0 mix-blend-screen pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} 
          className="absolute right-[-10%] top-[5%] h-[35rem] w-[35rem] rounded-full bg-primary/20 blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.25, 1], opacity: [0.1, 0.25, 0.1] }} 
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }} 
          className="absolute bottom-[10%] left-[-10%] h-[30rem] w-[30rem] rounded-full bg-accent/20 blur-[100px]" 
        />
      </div>

      <section className="relative z-10 py-16 md:py-24">
        <div className="container max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-semibold text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)] backdrop-blur-md hover:bg-primary/20 transition-all duration-300 cursor-pointer">
              <MapPin className="h-4 w-4 animate-pulse text-primary" />
              Find Us
            </div>
            <h1 className="mb-4 font-display text-4xl font-extrabold text-foreground md:text-5xl drop-shadow-sm tracking-tight">
              Our Location
            </h1>
            <p className="text-lg text-slate-700 dark:text-slate-300 max-w-md mx-auto font-medium">
              Visit us or get instant directions to our branch.
            </p>
          </motion.div>

          <div className="mx-auto max-w-4xl space-y-8">
            {mapsUrl && mapsUrl.startsWith("https://www.google.com/maps/embed") ? (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 100 }}
                className="space-y-4"
              >
                {locationHeading && (
                  <h3 className="text-xl font-display font-bold text-foreground mb-2 flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-primary" />
                    {locationHeading}
                  </h3>
                )}
                <div className="overflow-hidden rounded-[2.5rem] border border-border/80 shadow-2xl bg-muted group">
                  <iframe
                    title="Clinic Location"
                    className="w-full h-96 md:h-[28rem] grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out"
                    src={mapsUrl}
                    loading="lazy"
                    allowFullScreen
                    style={{ border: 0 }}
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </motion.div>
            ) : !mapsUrl ? (
              <div className="rounded-3xl border border-dashed border-border bg-card/50 backdrop-blur-md p-12 text-center flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-secondary/50 text-muted-foreground/60">
                  <MapPin className="h-8 w-8" />
                </div>
                <p className="text-sm text-muted-foreground font-semibold">Map not configured. Add a Google Maps embed URL in Settings.</p>
              </div>
            ) : null}

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid gap-6 sm:grid-cols-3"
            >
              {clinic?.address && (
                <div className="group flex items-center gap-4 rounded-3xl border border-border/80 bg-card/95 p-6 backdrop-blur-xl shadow-md hover:shadow-2xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-foreground/50 uppercase tracking-wider mb-0.5">Address</h4>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold leading-snug">{clinic.address}</p>
                  </div>
                </div>
              )}
              {clinic?.working_hours && (
                <div className="group flex items-center gap-4 rounded-3xl border border-border/80 bg-card/95 p-6 backdrop-blur-xl shadow-md hover:shadow-2xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-foreground/50 uppercase tracking-wider mb-0.5">Working Hours</h4>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold leading-snug">{clinic.working_hours}</p>
                  </div>
                </div>
              )}
              {clinic?.contact_phone && (
                <div className="group flex items-center gap-4 rounded-3xl border border-border/80 bg-card/95 p-6 backdrop-blur-xl shadow-md hover:shadow-2xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-foreground/50 uppercase tracking-wider mb-0.5">Phone</h4>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold leading-snug">{clinic.contact_phone}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Location;
