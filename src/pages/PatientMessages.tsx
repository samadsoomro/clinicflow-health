import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, User, Building2, Calendar, ArrowRight, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePublicClinicId } from "@/hooks/useClinic";
import { Button } from "@/components/ui/button";
import ClinicLink from "@/components/ClinicLink";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

const PatientMessages = () => {
  const { user, loading: authLoading } = useAuth();
  const clinicId = usePublicClinicId();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !clinicId) {
      if (!authLoading) setLoading(false);
      return;
    }

    const fetchMessages = async () => {
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

    fetchMessages();
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
      <div className="max-w-lg mx-auto mt-16 text-center p-6 border rounded-lg">
        <MessageCircle size={48} className="mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold mb-2">Messages</h2>
        <p className="text-gray-500 mb-4">
          ⚠️ You are not logged in. Please log in to view your message history and clinic replies.
        </p>
        <ClinicLink to="/login" className="text-primary hover:underline">
          Login here →
        </ClinicLink>
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-16 max-w-4xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MessageCircle className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Message History</h1>
          <p className="text-sm text-muted-foreground">View your conversations with the clinic staff.</p>
        </div>
      </div>

      <div className="space-y-6">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No messages yet. Use the <ClinicLink to="/contact" className="text-primary hover:underline">Contact Us</ClinicLink> form to send a message.
          </div>
        ) : (
          messages.map((msg) => (
            <Card key={msg.id} className="overflow-hidden border-border shadow-md">
              <CardHeader className="bg-muted/30 border-b border-border py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-lg font-semibold truncate pr-4">
                    Subject: {msg.subject}
                  </CardTitle>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(msg.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6 space-y-6">
                  {/* Patient Message */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                    <p className="text-xs text-gray-400 mb-1">👤 You wrote:</p>
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>

                  {/* Clinic Replies */}
                  {msg.contact_replies && msg.contact_replies.length > 0 ? (
                    msg.contact_replies.map((reply: any) => (
                      <div key={reply.id} className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded p-3 mt-4">
                        <p className="text-xs text-blue-500 mb-1">🏥 Clinic replied · {new Date(reply.created_at).toLocaleDateString()}</p>
                        <p className="whitespace-pre-wrap">{reply.reply_text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic mt-4">
                      No reply yet — we'll respond to your message soon.
                    </p>
                  )}
                </div>
                
                <div className="text-center mt-6 text-sm text-gray-500 pb-4 border-t border-border pt-4">
                  Want to send another message? <ClinicLink to="/contact" className="text-primary hover:underline">Use the Contact Us form →</ClinicLink>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientMessages;
