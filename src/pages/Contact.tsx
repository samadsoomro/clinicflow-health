import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { usePublicClinicId } from "@/hooks/useClinic";

const Contact = () => {
  const clinicId = usePublicClinicId();
  const [clinic, setClinic] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("clinics")
        .select("contact_phone, contact_email, address, working_hours, maps_embed_url")
        .eq("id", clinicId)
        .single();
      setClinic(data);
    };
    fetch();
  }, [clinicId]);

  const mapsUrl = (clinic as any)?.maps_embed_url;

  const contactItems = [
    { icon: Phone, label: "Phone", value: clinic?.contact_phone },
    { icon: Mail, label: "Email", value: clinic?.contact_email },
    { icon: MapPin, label: "Address", value: clinic?.address },
    { icon: Clock, label: "Hours", value: clinic?.working_hours },
  ].filter((i) => i.value);

  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
            <Mail className="h-4 w-4" />
            Get In Touch
          </div>
          <h1 className="mb-3 font-display text-3xl font-bold text-foreground md:text-4xl">Contact Us</h1>
          <p className="text-muted-foreground">Have a question? We'd love to hear from you.</p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6 md:col-span-2"
          >
            {contactItems.map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card md:col-span-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="How can we help?" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Your message..." rows={4} />
            </div>
            <Button variant="hero" className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </motion.form>
        </div>

        {mapsUrl && mapsUrl.startsWith("https://www.google.com/maps/embed") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border border-border shadow-card"
          >
            <iframe src={mapsUrl} width="100%" height="350" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Clinic Location" />
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Contact;
