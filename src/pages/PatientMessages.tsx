import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, User, Building2, Calendar, ArrowRight, LogIn } from "lucide-react";
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
        const unreadReplyIds = data
          ?.flatMap((m: any) => m.contact_replies || [])
          .filter((r: any) => !r.is_read_by_patient)
          .map((r: any) => r.id) || [];

        if (unreadReplyIds.length > 0) {
          await (supabase as any)
            .from('contact_replies')
            .update({ is_read_by_patient: true })
            .in('id', unreadReplyIds);
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
      <div className="container py-20">
        <div className="max-w-md mx-auto bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-300 dark:border-yellow-800 rounded-xl p-8 text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
            <LogIn className="h-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Authentication Required</h2>
          <p className="text-muted-foreground">
            ⚠️ You are not logged in. Please log in to view your message history and receive clinic replies.
          </p>
          <ClinicLink to="/login">
            <Button className="w-full mt-4">Login here</Button>
          </ClinicLink>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-16 max-w-4xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MessageSquare className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Message History</h1>
          <p className="text-sm text-muted-foreground">View your conversations with the clinic staff.</p>
        </div>
      </div>

      <div className="space-y-6">
        {messages.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-muted rounded-2xl">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No messages found</h3>
            <p className="text-muted-foreground mb-6">You haven't sent any messages to the clinic yet.</p>
            <ClinicLink to="/contact">
              <Button variant="outline">Contact Us Now</Button>
            </ClinicLink>
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
                    {format(new Date(msg.created_at), "PPP p")}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6 space-y-6">
                  {/* Patient Message */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <User className="h-4 w-4 text-primary" />
                      <span>👤 You:</span>
                    </div>
                    <div className="pl-6 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </div>
                  </div>

                  {/* Clinic Replies */}
                  <div className="pt-4 border-t border-muted/50 space-y-4">
                    {msg.contact_replies && msg.contact_replies.length > 0 ? (
                      msg.contact_replies.map((reply: any) => (
                        <div key={reply.id} className="space-y-2 group">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                              <Building2 className="h-4 w-4" />
                              <span>🏥 Clinic replied:</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {format(new Date(reply.created_at), "p")}
                            </span>
                          </div>
                          <div className="pl-6 text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-primary/5 p-4 rounded-lg border border-primary/10">
                            {reply.reply_text}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 p-4 bg-muted/20 border border-muted rounded-lg text-sm text-muted-foreground">
                        <ArrowRight className="h-4 w-4 animate-pulse" />
                        <span>No reply yet — we'll respond soon</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-muted/10 p-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground italic">Want to send another message?</span>
                  <ClinicLink to="/contact">
                    <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                      Use the Contact Us form <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </ClinicLink>
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
