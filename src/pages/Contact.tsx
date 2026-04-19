import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, Clock, CheckCircle, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { usePublicClinicId } from "@/hooks/useClinic";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ClinicLink from "@/components/ClinicLink";

const Contact = () => {
  const clinicId = usePublicClinicId();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clinic, setClinic] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("clinics")
        .select("contact_phone, contact_email, address, working_hours, maps_embed_url, contact_note_english, contact_note_urdu, contact_note_loggedin_english, contact_note_loggedin_urdu, contact_note_urdu_enabled")
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

    const { data: { session } } = await supabase.auth.getSession();

    const { error } = await supabase.from("contact_messages").insert({
      clinic_id: clinicId,
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
      user_id: session?.user?.id ?? null
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to send message. Please try again.");
      return;
    }
    setSubmitted(true);
    setForm({ name: "", email: "", subject: "", message: "" });
    
    if (session?.user) {
      toast.success("Message sent!", {
        description: "Your message has been sent. View your history to track replies.",
        action: {
          label: "View History",
          onClick: () => {
            const params = new URLSearchParams(window.location.search);
            const clinicParam = params.get('clinic');
            navigate(clinicParam ? `/messages?clinic=${clinicParam}` : "/messages");
          }
        }
      });
    } else {
      toast.success("Your message has been sent. We will get back to you shortly.");
    }

    setTimeout(() => setSubmitted(false), 8000);
  };

  const mapsUrl = (clinic as any)?.maps_embed_url;

  const contactItems = [
    { icon: Phone, label: "Phone", value: clinic?.contact_phone },
    { icon: Mail, label: "Email", value: clinic?.contact_email },
    { icon: MapPin, label: "Address", value: clinic?.address },
    { icon: Clock, label: "Hours", value: clinic?.working_hours },
  ].filter((i) => i.value);

  const noteEnglish = clinic?.contact_note_english || 
    "If you'd like the clinic to reply to your message, please log in or register first, then send your message. We can only reply to messages from registered patients.";
  const noteUrdu = clinic?.contact_note_urdu ||
    "اگر آپ چاہتے ہیں کہ کلینک آپ کے پیغام کا جواب دے، تو براہ کرم پہلے لاگ ان یا رجسٹر کریں، پھر پیغام بھیجیں۔ ہم صرف رجسٹرڈ مریضوں کے پیغامات کا جواب دے سکتے ہیں۔";
  const urduEnabled = clinic?.contact_note_urdu_enabled || false;
  const isLoggedIn = !!user;

  const defaultGuestEnglish = "If you would like the clinic to reply to your message, please log in or register first, then send your message. We can only respond to messages from registered patients. After sending your message, please check the \"Messages\" menu on the website later to see our reply.";
  const defaultGuestUrdu = "اگر آپ چاہتے ہیں کہ کلینک آپ کے پیغام کا جواب دے، تو براہِ کرم پہلے لاگ اِن کریں یا رجسٹر کریں، پھر اپنا پیغام بھیجیں۔ ہم صرف رجسٹرڈ مریضوں کے پیغامات کا جواب دے سکتے ہیں۔ اپنا پیغام بھیجنے کے بعد، براہِ کرم کچھ دیر بعد ویب سائٹ کے Messages مینو میں جا کر ہمارا جواب دیکھیں۔";
  const defaultLoggedInEnglish = "After sending your message, please check the \"Messages\" menu on the website later to see our reply.";
  const defaultLoggedInUrdu = "اپنا پیغام بھیجنے کے بعد، براہِ کرم کچھ دیر بعد ویب سائٹ کے Messages مینو میں جا کر ہمارا جواب دیکھیں۔";


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

        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6 lg:col-span-2"
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
            className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card lg:col-span-3"
            onSubmit={handleSubmit}
          >
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-amber-500 text-xl flex-shrink-0">ℹ️</span>
                <div className="w-full space-y-2">
                  {!isLoggedIn ? (
                    // NON-LOGGED-IN: show full note + login/register buttons
                    <>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        {clinic?.contact_note_english || defaultGuestEnglish}
                      </p>
                      {urduEnabled && (
                        <p
                          className="text-sm text-amber-800 dark:text-amber-200 border-t border-amber-200 dark:border-amber-600 pt-2 mt-2"
                          dir="rtl"
                          style={{ fontFamily: 'serif' }}
                        >
                          {clinic?.contact_note_urdu || defaultGuestUrdu}
                        </p>
                      )}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <ClinicLink
                          to="/login"
                          className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                        >
                          Login
                        </ClinicLink>
                        <ClinicLink
                          to="/register"
                          className="text-xs border border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 px-4 py-2 rounded-lg font-semibold transition-colors"
                        >
                          Register
                        </ClinicLink>
                      </div>
                    </>
                  ) : (
                    // LOGGED-IN: show short reminder note only
                    <>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        {clinic?.contact_note_loggedin_english || defaultLoggedInEnglish}
                      </p>
                      {urduEnabled && (
                        <p
                          className="text-sm text-amber-800 dark:text-amber-200 border-t border-amber-200 dark:border-amber-600 pt-2 mt-2"
                          dir="rtl"
                          style={{ fontFamily: 'serif' }}
                        >
                          {clinic?.contact_note_loggedin_urdu || defaultLoggedInUrdu}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>


            {submitted && (
              <div className="flex flex-col gap-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 text-sm text-green-700 dark:text-green-300">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle className="h-4 w-4" />
                  Your message has been sent successfully!
                </div>
                {user && (
                  <div className="flex items-center gap-2 pl-6">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>
                      Track replies in your{" "}
                      <ClinicLink to="/messages" className="font-bold underline hover:text-green-800 dark:hover:text-green-100 transition-colors">
                        message history
                      </ClinicLink>
                    </span>
                  </div>
                )}
                {!user && (
                   <div className="pl-6 text-xs opacity-80 italic">
                    Log in to track your message history and receive direct replies.
                   </div>
                )}
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
