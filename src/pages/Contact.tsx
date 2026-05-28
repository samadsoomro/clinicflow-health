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
  const [showSuccessModal, setShowSuccessModal] = useState(false);


  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("clinics")
        .select("contact_phone, contact_email, address, working_hours, maps_embed_url, contact_note_english, contact_note_urdu, contact_note_loggedin_english, contact_note_loggedin_urdu, contact_note_urdu_enabled, contact_popup_english, contact_popup_second_lang")
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
      setShowSuccessModal(true);
    } else {
      toast.success("Your message has been sent! We will get back to you shortly.");
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

  const defaultPopupEnglish = 'Your message has been sent successfully! Please check the "Messages" menu on our website later to view our reply. We will respond as soon as possible.';
  const defaultPopupSecondLang = 'آپ کا پیغام کامیابی سے بھیج دیا گیا ہے! براہِ کرم کچھ دیر بعد ہماری ویب سائٹ کے Messages مینو میں جا کر ہمارا جواب دیکھیں۔ ہم جلد از جلد جواب دیں گے۔';



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
              <Mail className="h-4 w-4 animate-pulse text-primary" />
              Get In Touch
            </div>
            <h1 className="mb-4 font-display text-4xl font-extrabold text-foreground md:text-5xl drop-shadow-sm tracking-tight">
              Contact Us
            </h1>
            <p className="text-lg text-slate-700 dark:text-slate-300 max-w-md mx-auto font-medium">
              Have a question or feedback? We would love to hear from you.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-5 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="space-y-6 lg:col-span-2"
            >
              {contactItems.map((item) => (
                <div 
                  key={item.label} 
                  className="group flex items-center gap-4 rounded-3xl border border-border/85 bg-card/95 p-6 backdrop-blur-xl shadow-md hover:shadow-2xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-foreground/50 uppercase tracking-wider mb-0.5">{item.label}</h4>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold leading-snug break-all">{item.value}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.form
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-6 rounded-[2.5rem] border border-border/80 bg-card/95 p-8 md:p-10 backdrop-blur-xl shadow-2xl lg:col-span-3 hover:border-primary/20 transition-all duration-300"
              onSubmit={handleSubmit}
            >
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <span className="text-amber-500 text-2xl flex-shrink-0">⚠️</span>
                  <div className="w-full space-y-3">
                    {!isLoggedIn ? (
                      <>
                        <p className="text-sm text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
                          {clinic?.contact_note_english || defaultGuestEnglish}
                        </p>
                        {urduEnabled && (
                          <p
                            className="text-sm text-amber-900 dark:text-amber-200 border-t border-amber-200/50 dark:border-amber-900/40 pt-3 mt-3 font-medium leading-relaxed"
                            dir="rtl"
                            style={{ fontFamily: 'serif' }}
                          >
                            {clinic?.contact_note_urdu || defaultGuestUrdu}
                          </p>
                        )}
                        <div className="flex gap-3 mt-4 flex-wrap">
                          <ClinicLink
                            to="/login"
                            className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-amber-600/25 hover:-translate-y-0.5"
                          >
                            Login
                          </ClinicLink>
                          <ClinicLink
                            to="/register"
                            className="text-xs border-2 border-amber-400/80 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/20 px-5 py-2 rounded-xl font-bold transition-all hover:-translate-y-0.5"
                          >
                            Register
                          </ClinicLink>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
                          {clinic?.contact_note_loggedin_english || defaultLoggedInEnglish}
                        </p>
                        {urduEnabled && (
                          <p
                            className="text-sm text-amber-900 dark:text-amber-200 border-t border-amber-200/50 dark:border-amber-900/40 pt-3 mt-3 font-medium leading-relaxed"
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
                <div className="flex flex-col gap-2 rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-905/30 p-5 text-sm text-green-800 dark:text-green-300 shadow-sm animate-pulse-token">
                  <div className="flex items-center gap-2.5 font-bold">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    Your message has been sent successfully!
                  </div>
                  {user && (
                    <div className="flex items-center gap-2 pl-7">
                      <MessageSquare className="h-4 w-4" />
                      <span>
                        Track replies in your{" "}
                        <ClinicLink to="/messages" className="font-bold underline hover:text-green-700 dark:hover:text-green-100 transition-colors">
                          message history
                        </ClinicLink>
                      </span>
                    </div>
                  )}
                  {!user && (
                     <div className="pl-7 text-xs opacity-80 italic">
                      Log in to track your message history and receive direct replies.
                     </div>
                  )}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold text-foreground/80">Name</Label>
                  <Input id="name" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="text-base rounded-2xl border-border/80 focus:ring-primary/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-semibold text-foreground/80">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="text-base rounded-2xl border-border/80 focus:ring-primary/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject" className="font-semibold text-foreground/80">Subject</Label>
                <Input id="subject" placeholder="How can we help?" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required className="text-base rounded-2xl border-border/80 focus:ring-primary/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="font-semibold text-foreground/80">Message</Label>
                <Textarea id="message" placeholder="Your message..." rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required className="text-base rounded-2xl border-border/80 focus:ring-primary/50" />
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5" disabled={submitting}>
                <Send className="mr-2 h-4 w-4" />
                {submitting ? "Sending..." : "Send Message"}
              </Button>
            </motion.form>
          </div>

          {mapsUrl && mapsUrl.startsWith("https://www.google.com/maps/embed") && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
              className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-[2.5rem] border border-border/80 shadow-2xl bg-muted group"
            >
              <iframe 
                src={mapsUrl} 
                width="100%" 
                height="380" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade" 
                title="Clinic Location" 
                className="grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out"
              />
            </motion.div>
          )}
        </div>
      </section>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-fade-in border border-border/60">
            {/* Success icon */}
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={36} className="text-green-500" />
            </div>

            <h2 className="text-2xl font-bold mb-3 tracking-tight">Message Sent!</h2>

            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
              {clinic?.contact_popup_english || defaultPopupEnglish}
            </p>

            {urduEnabled && (
              <p
                className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed border-t border-gray-200 dark:border-gray-700 pt-4 mb-4 font-medium"
                dir="rtl"
                style={{ fontFamily: 'serif' }}
              >
                {clinic?.contact_popup_second_lang || defaultPopupSecondLang}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <ClinicLink
                to="/messages"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition text-sm shadow-md hover:shadow-blue-600/25"
                onClick={() => setShowSuccessModal(false)}
              >
                📩 View Messages
              </ClinicLink>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold py-3 px-4 rounded-xl transition text-sm"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

};

export default Contact;
