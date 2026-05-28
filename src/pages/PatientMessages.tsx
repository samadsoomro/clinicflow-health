import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, User, Building2, Calendar, ArrowRight, LogIn, Lock, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePublicClinicId } from "@/hooks/useClinic";
import { useClinicContext } from "@/hooks/useClinicContext";
import { Button } from "@/components/ui/button";
import ClinicLink from "@/components/ClinicLink";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { subscribeToPushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

const PatientMessages = () => {
  const { user, loading: authLoading } = useAuth();
  const clinicId = usePublicClinicId();
  const { clinic } = useClinicContext();
  const clinicName = clinic?.clinic_name || "Clinic";
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  const fetchMessages = async () => {
    if (!user || !clinicId) return;
    
    // Fetch patient's messages with their replies
    const { data, error } = await (supabase as any)
      .from('contact_messages')
      .select(`
        id, subject, message, created_at,
        contact_replies (
          id, reply_text, is_read_by_patient, created_at
        )
      `)
      .eq('user_id', user.id)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data || []);
      
      // Mark all unread replies as read
      if (data && data.length > 0) {
        const allMessageIds = data.map((m: any) => m.id);
        await (supabase as any)
          .from('contact_replies')
          .update({ is_read_by_patient: true })
          .in('message_id', allMessageIds)
          .eq('is_read_by_patient', false);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user || !clinicId) {
      if (!authLoading) setLoading(false);
      return;
    }

    fetchMessages();

    // Subscribe to new replies on contact_replies in real-time
    const channel = supabase
      .channel("patient-messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "contact_replies",
          filter: `clinic_id=eq.${clinicId}`,
        },
        async () => {
          // Re-fetch messages when a new reply arrives
          await fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, clinicId, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="container py-20 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-[85vh] flex items-center justify-center px-4 overflow-hidden">
        {/* Ambient background glowing orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-primary/10 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl opacity-40" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full text-center bg-card/90 border border-border/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-primary to-emerald-400" />
          <div className="w-20 h-20 bg-yellow-500/10 dark:bg-yellow-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-yellow-500/20 shadow-inner">
            <Lock size={36} className="text-yellow-600 dark:text-yellow-500 animate-pulse" />
          </div>
          <h2 className="text-3xl font-display font-bold mb-3 text-foreground tracking-tight">Secure Messages</h2>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            Please log in to view your conversation history, receive real-time updates, and communicate securely with our clinical team.
          </p>
          <div className="space-y-4">
            <ClinicLink
              to="/login"
              className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 px-6 rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.01]"
            >
              <span>Login to your account</span>
              <ArrowRight size={16} />
            </ClinicLink>
            <ClinicLink
              to="/register"
              className="block w-full border border-border bg-background/50 hover:bg-muted/80 text-foreground font-semibold py-3.5 px-6 rounded-2xl transition-all duration-300 backdrop-blur"
            >
              Create a new account
            </ClinicLink>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[90vh] py-12 md:py-16 px-4 overflow-hidden">
      {/* Ambient background glowing orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          animate={{
            scale: [1, 1.12, 1],
            x: [0, 20, 0],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-60"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl opacity-50"
        />
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full border border-primary/20 mb-2">
            <MessageCircle size={12} /> Patient Support
          </span>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight flex items-center gap-2">
            Message History
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your conversations with <span className="font-semibold text-primary">{clinicName}</span>
          </p>
        </div>

        {user && permissionState === 'default' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-blue-500/10 via-primary/5 to-transparent border border-blue-500/20 backdrop-blur-md rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 flex-shrink-0">
                <Bell size={20} className="text-blue-500 animate-bounce" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Enable Push Notifications</h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Get notified instantly on this device as soon as a physician replies to your message.
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                const { data: { session: s } } = await supabase.auth.getSession();
                if (!s?.user) return;
                const ok = await subscribeToPushNotifications(s.user.id, clinicId);
                if (ok) {
                  setPermissionState('granted');
                  toast.success('Notifications enabled!');
                } else {
                  setPermissionState(Notification.permission);
                }
              }}
              className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl whitespace-nowrap shadow-sm transition-all duration-300 hover:scale-[1.02]"
            >
              🔔 Enable Now
            </button>
          </motion.div>
        )}

        {user && permissionState === 'denied' && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              Notifications are currently blocked. To get instant updates when a doctor replies, please update your browser settings: <strong>Site Settings → Notifications → Allow</strong>.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="min-h-[45vh] flex items-center justify-center"
            >
              <div className="max-w-md w-full text-center bg-card/70 border border-border/80 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-xl">
                <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-inner">
                  <MessageCircle size={36} className="text-primary" />
                </div>
                <h2 className="text-2xl font-display font-bold mb-3 text-foreground">No Messages Yet</h2>
                <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                  You haven't submitted any messages to the clinic yet. Use the Contact page to reach our team, and we'll reply right here.
                </p>
                <ClinicLink
                  to="/contact"
                  className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 px-6 rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <span>📩 Send a Message</span>
                </ClinicLink>
              </div>
            </motion.div>
          ) : (
            messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/75 backdrop-blur-xl border border-border/80 rounded-[2rem] shadow-md hover:shadow-xl hover:border-primary/20 overflow-hidden transition-all duration-300 mb-6"
              >
                {/* Thread Header */}
                <div className="bg-muted/30 px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-border/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                    <h3 className="font-semibold text-sm text-foreground uppercase tracking-wider text-[11px]">{msg.subject}</h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(msg.created_at).toLocaleDateString('en-PK', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* Timeline Content */}
                <div className="px-6 py-6 space-y-6 bg-gradient-to-b from-transparent to-muted/10">
                  {/* Patient Message */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] sm:max-w-[70%]">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-4.5 py-3 text-sm shadow-md font-medium leading-relaxed">
                        {msg.message}
                      </div>
                      <p className="text-[10px] text-muted-foreground text-right mt-1.5 flex items-center justify-end gap-1.5 font-medium">
                        <span>You</span>
                        <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                        <span>{new Date(msg.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                  </div>

                  {/* Clinic Replies */}
                  {msg.contact_replies && msg.contact_replies.length > 0 ? (
                    msg.contact_replies.map((reply: any) => (
                      <div key={reply.id} className="flex justify-start">
                        <div className="max-w-[85%] sm:max-w-[70%]">
                          <div className="bg-muted/80 backdrop-blur-sm border border-border/50 text-foreground rounded-2xl rounded-tl-none px-4.5 py-3 text-sm shadow-sm leading-relaxed">
                            {reply.reply_text}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1.5 font-medium">
                            <span className="text-primary font-semibold">🏥 Clinic Staff</span>
                            <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                            <span>{new Date(reply.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</span>
                            {!reply.is_read_by_patient && (
                              <span className="ml-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">New</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-start">
                      <div className="bg-background/40 border border-dashed border-border/80 rounded-2xl px-5 py-4 text-xs text-muted-foreground italic flex items-center gap-2.5">
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span>Awaiting clinic response. A staff member will respond shortly.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Link */}
                <div className="px-6 py-3.5 border-t border-border/50 bg-muted/20">
                  <ClinicLink to="/contact" className="text-xs font-semibold text-primary hover:text-primary/80 hover:underline flex items-center gap-1.5 group">
                    <span>📩 Send another inquiry</span>
                    <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                  </ClinicLink>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientMessages;
