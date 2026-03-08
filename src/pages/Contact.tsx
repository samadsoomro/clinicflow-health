import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { usePublicClinicId } from "@/hooks/useClinic";
import { toast } from "sonner";

const Contact = () => {
  const clinicId = usePublicClinicId();
  const [clinic, setClinic] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert({
      clinic_id: clinicId,
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to send message. Please try again.");
      return;
    }
    setSubmitted(true);
    setForm({ name: "", email: "", subject: "", message: "" });
    toast.success("Your message has been sent. We will get back to you shortly.");
    setTimeout(() => setSubmitted(false), 5000);
  };

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
            onSubmit={handleSubmit}
          >
            {submitted && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-300">
                <CheckCircle className="h-4 w-4" />
                Your message has been sent successfully!
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="text-base" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="How can we help?" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required className="text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Your message..." rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required className="text-base" />
            </div>
            <Button variant="hero" className="w-full" disabled={submitting}>
              <Send className="mr-2 h-4 w-4" />
              {submitting ? "Sending..." : "Send Message"}
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
