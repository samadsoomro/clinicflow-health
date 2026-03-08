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
        .select("clinic_name, address, contact_phone, working_hours, maps_embed_url")
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

  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
            <MapPin className="h-4 w-4" />
            Find Us
          </div>
          <h1 className="mb-3 font-display text-3xl font-bold text-foreground md:text-4xl">Our Location</h1>
          <p className="text-muted-foreground">Visit us or get directions to our clinic.</p>
        </motion.div>

        <div className="mx-auto max-w-4xl">
          {mapsUrl && mapsUrl.startsWith("https://www.google.com/maps/embed") ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="overflow-hidden rounded-2xl border border-border shadow-card"
            >
              <iframe
                title="Clinic Location"
                className="w-full h-80 md:h-96"
                src={mapsUrl}
                loading="lazy"
                allowFullScreen
                style={{ border: 0 }}
                referrerPolicy="no-referrer-when-downgrade"
              />
            </motion.div>
          ) : !mapsUrl ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
              <MapPin className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Map not configured. Add a Google Maps embed URL in Settings.</p>
            </div>
          ) : null}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 grid gap-4 sm:grid-cols-3"
          >
            {clinic?.address && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">{clinic.address}</span>
              </div>
            )}
            {clinic?.working_hours && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
                <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">{clinic.working_hours}</span>
              </div>
            )}
            {clinic?.contact_phone && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">{clinic.contact_phone}</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Location;
