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
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Messages</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            You need to be logged in to view your message history and receive replies from the clinic.
          </p>
          <div className="space-y-3">
            <ClinicLink
              to="/login"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition"
            >
              Login to your account
            </ClinicLink>
            <ClinicLink
              to="/register"
              className="block w-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold py-3 px-6 rounded-xl transition"
            >
              Create an account
            </ClinicLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-16 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle size={24} /> Message History
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Your conversations with {clinicName}
        </p>
      </div>

      {user && permissionState === 'default' && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Enable notifications on this device to get alerted when the clinic replies.
            </p>
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
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg whitespace-nowrap"
          >
            🔔 Enable Now
          </button>
        </div>
      )}

      {user && permissionState === 'denied' && (
        <div className="mb-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 rounded-xl p-3">
          <p className="text-sm text-orange-700 dark:text-orange-300">
            ⚠️ Notifications are blocked on this device. Go to your browser settings → Site Settings → Notifications → Allow for this site.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {messages.length === 0 ? (
          <div className="min-h-[50vh] flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={32} className="text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No Messages Yet</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                You haven't sent any messages to the clinic yet. Use the Contact Us form to get in touch — we'll reply right here.
              </p>
              <ClinicLink
                to="/contact"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition"
              >
                📩 Go to Contact Us
              </ClinicLink>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-4 overflow-hidden">
              
              {/* Thread header */}
              <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-sm">{msg.subject}</h3>
                <span className="text-xs text-gray-400">
                  {new Date(msg.created_at).toLocaleDateString('en-PK', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>

              {/* Timeline body */}
              <div className="px-5 py-4 space-y-4">

                {/* Patient message — right aligned */}
                <div className="flex justify-end">
                  <div className="max-w-[80%]">
                    <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm">
                      {msg.message}
                    </div>
                    <p className="text-xs text-gray-400 text-right mt-1">
                      👤 You · {new Date(msg.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Clinic replies — left aligned */}
                {msg.contact_replies && msg.contact_replies.length > 0 ? (
                  msg.contact_replies.map((reply: any) => (
                    <div key={reply.id} className="flex justify-start">
                      <div className="max-w-[80%]">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 text-sm">
                          {reply.reply_text}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          🏥 Clinic · {new Date(reply.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                          {!reply.is_read_by_patient && (
                            <span className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">New</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-start">
                    <div className="bg-gray-50 dark:bg-gray-700/40 border border-dashed border-gray-200 dark:border-gray-600 rounded-2xl px-4 py-3 text-sm text-gray-400 italic">
                      ⏳ No reply yet — the clinic will respond soon.
                    </div>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                <ClinicLink to="/contact" className="text-sm text-blue-500 hover:underline">
                  📩 Send another message →
                </ClinicLink>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientMessages;
