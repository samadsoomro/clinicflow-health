import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Mail, Eye, Trash2, CheckCircle, Circle, Inbox, MessageSquare, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useClinicId } from "@/hooks/useClinic";
import { toast } from "sonner";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  user_id: string | null;
  created_at: string;
  contact_replies?: {
    id: string;
    reply_text: string;
    created_at: string;
  }[];
}

const AdminContactMessages = () => {
  const { clinicId } = useClinicId();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const [noteGuest, setNoteGuest] = useState('');
  const [noteGuestUrdu, setNoteGuestUrdu] = useState('');
  const [noteLoggedIn, setNoteLoggedIn] = useState('');
  const [noteLoggedInUrdu, setNoteLoggedInUrdu] = useState('');
  const [popupEnglish, setPopupEnglish] = useState('');
  const [popupSecondLang, setPopupSecondLang] = useState('');
  const [urduEnabled, setUrduEnabled] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  const [clinicDataLoaded, setClinicDataLoaded] = useState(false);
  const [clinicName, setClinicName] = useState("");

  const fetchMessages = useCallback(async () => {
    const { data } = await (supabase as any)
      .from("contact_messages")
      .select("*, contact_replies(id, reply_text, created_at)")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false });

    setMessages((data as ContactMessage[]) || []);
    setLoading(false);
  }, [clinicId]);

  const fetchClinicSettings = useCallback(async () => {
    if (!clinicId) return;
    const { data } = await supabase
      .from('clinics')
      .select('contact_note_english, contact_note_urdu, contact_note_loggedin_english, contact_note_loggedin_urdu, contact_note_urdu_enabled, clinic_name, contact_popup_english, contact_popup_second_lang')
      .eq('id', clinicId)
      .single();



    if (data) {
      setNoteGuest(data.contact_note_english || '');
      setNoteGuestUrdu(data.contact_note_urdu || '');
      setNoteLoggedIn(data.contact_note_loggedin_english || '');
      setNoteLoggedInUrdu(data.contact_note_loggedin_urdu || '');
      setUrduEnabled(data.contact_note_urdu_enabled || false);
      setPopupEnglish(data.contact_popup_english || '');
      setPopupSecondLang(data.contact_popup_second_lang || '');
      setClinicName(data.clinic_name || '');

      setClinicDataLoaded(true);
    }

  }, [clinicId]);

  useEffect(() => {
    fetchMessages();
    fetchClinicSettings();
    const channel = supabase
      .channel("admin-contact-messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages", filter: `clinic_id=eq.${clinicId}` }, () => fetchMessages())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchMessages, fetchClinicSettings, clinicId]);

  const handleSaveNote = async () => {
    setSavingNote(true);
    const { error } = await supabase
      .from('clinics')
      .update({
        contact_note_english: noteGuest || null,
        contact_note_urdu: urduEnabled ? (noteGuestUrdu || null) : null,
        contact_note_loggedin_english: noteLoggedIn || null,
        contact_note_loggedin_urdu: urduEnabled ? (noteLoggedInUrdu || null) : null,
        contact_note_urdu_enabled: urduEnabled,
        contact_popup_english: popupEnglish || null,
        contact_popup_second_lang: urduEnabled ? (popupSecondLang || null) : null,
      })
      .eq('id', clinicId);


    setSavingNote(false);
    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Note settings saved');
    }

  };

  const openMessage = async (msg: ContactMessage) => {
    setSelectedMessage(msg);
    if (!msg.is_read) {
      await supabase.from("contact_messages").update({ is_read: true }).eq("id", msg.id);
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, is_read: true } : m));
    }
  };

  const toggleRead = async (msg: ContactMessage) => {
    const newVal = !msg.is_read;
    await supabase.from("contact_messages").update({ is_read: newVal }).eq("id", msg.id);
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, is_read: newVal } : m));
    toast.success(newVal ? "Marked as read" : "Marked as unread");
  };

  const deleteMessage = async (id: string) => {
    // Step 1 — delete replies first (foreign key)
    await (supabase as any).from('contact_replies').delete().eq('message_id', id);

    // Step 2 — delete the message
    await supabase.from("contact_messages").delete().eq("id", id);
    
    await fetchMessages();
    setSelectedMessage(null);
    toast.success("Message deleted");
  };

  const handleSendReply = async (messageId: string) => {
    if (!replyText.trim()) {
      toast.error("Please type a reply.");
      return;
    }

    const currentReplyText = replyText.trim();
    const message = messages.find(m => m.id === messageId);
    
    // Step 1 — Save reply to Supabase (fast)
    const { error } = await (supabase as any).from('contact_replies').insert({
      clinic_id: clinicId,
      message_id: messageId,
      reply_text: currentReplyText,
      is_read_by_patient: false
    });

    if (error) {
      toast.error("Failed to send reply.");
      return;
    }

    // Step 2 — Show success immediately — don't wait for push
    setReplyText('');
    setReplyingTo(null);
    toast.success('Reply sent successfully');
    fetchMessages();

    // Step 3 — Fire push notification in background (no await)
    if (message?.user_id) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.access_token) return;
        fetch(
          'https://swyyktpdjftxzazqedyx.supabase.co/functions/v1/send-push-notification',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              user_id: message.user_id,
              title: `${clinicName || "Clinic"} replied to your message`,
              body: currentReplyText.length > 100 ? currentReplyText.substring(0, 100) + '...' : currentReplyText,
            }),
          }
        ).catch(err => console.error('Push notification failed:', err));
      });
    }
  };

  const filtered = messages.filter((m) => {
    if (filter === "unread") return !m.is_read;
    if (filter === "read") return m.is_read;
    return true;
  });

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Contact Messages</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : "No unread messages"}
          </p>
        </div>
        <div className="flex gap-2">
          {(["all", "unread", "read"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
              {f === "unread" && unreadCount > 0 && (
                <Badge className="ml-1.5 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0">{unreadCount}</Badge>
              )}
            </Button>
          ))}
        </div>
      </div>



      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-display text-lg font-semibold text-muted-foreground">No messages yet</p>
          <p className="text-sm text-muted-foreground">Contact form submissions will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subject</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((msg, i) => (
                <tr key={msg.id} className={`transition-colors hover:bg-muted/30 ${!msg.is_read ? "bg-primary/5" : ""}`}>
                  <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{msg.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{msg.email}</td>
                  <td className="px-4 py-3 text-foreground max-w-[200px] truncate">{msg.subject}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell whitespace-nowrap">
                    {new Date(msg.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {msg.is_read ? (
                        <Badge variant="secondary" className="text-[10px] w-fit">Read</Badge>
                      ) : (
                        <Badge className="bg-primary text-primary-foreground text-[10px] w-fit">Unread</Badge>
                      )}
                      {!msg.user_id ? (
                        <Badge variant="outline" className="text-[10px] w-fit border-gray-400 text-gray-500">Guest</Badge>
                      ) : msg.contact_replies && msg.contact_replies.length > 0 ? (
                        <Badge className="bg-green-500 text-white text-[10px] w-fit">Replied</Badge>
                      ) : (
                        <Badge className="bg-orange-500 text-white text-[10px] w-fit">Awaiting Reply</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openMessage(msg)} title="View">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleRead(msg)} title={msg.is_read ? "Mark unread" : "Mark read"}>
                        {msg.is_read ? <Circle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete message?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMessage(msg.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── CONTACT PAGE NOTE SETTINGS ─── */}
      <div className="mt-8 border-t pt-6 pb-12">
        <h3 className="text-lg font-semibold mb-4">Contact Page Note Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section A — Note for non-logged-in visitors */}
          <div className="p-4 bg-muted/30 dark:bg-muted/10 rounded-xl border border-border">
            <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
              <span>📢</span> Note for visitors NOT logged in
            </h4>
            <p className="text-[11px] text-muted-foreground mb-3">
              Shown to anyone who visits the contact page without being logged in.
            </p>
            <Textarea
              value={noteGuest}
              onChange={(e) => setNoteGuest(e.target.value)}
              rows={3}
              placeholder="Default: If you'd like the clinic to reply to your message, please log in or register first..."
              className="w-full text-sm resize-none"
            />
            {urduEnabled && (
              <div className="mt-3 space-y-1.5">
                <label className="text-[10px] font-medium text-muted-foreground uppercase">Second Language (Guest)</label>
                <Textarea
                  value={noteGuestUrdu}
                  onChange={(e) => setNoteGuestUrdu(e.target.value)}
                  rows={3}
                  dir="rtl"
                  placeholder="اردو یا کوئی اور زبان میں ترجمہ یہاں لکھیں..."
                  className="w-full text-sm font-arabic resize-none"
                />
              </div>
            )}
          </div>

          {/* Section B — Note for logged-in patients */}
          <div className="p-4 bg-muted/30 dark:bg-muted/10 rounded-xl border border-border">
            <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
              <span>✅</span> Note for logged-in patients
            </h4>
            <p className="text-[11px] text-muted-foreground mb-3">
              Shown only to patients who are already logged in.
            </p>
            <Textarea
              value={noteLoggedIn}
              onChange={(e) => setNoteLoggedIn(e.target.value)}
              rows={3}
              placeholder='Default: After sending your message, please check the "Messages" menu later...'
              className="w-full text-sm resize-none"
            />
            {urduEnabled && (
              <div className="mt-3 space-y-1.5">
                <label className="text-[10px] font-medium text-muted-foreground uppercase">Second Language (Logged-in)</label>
                <Textarea
                  value={noteLoggedInUrdu}
                  onChange={(e) => setNoteLoggedInUrdu(e.target.value)}
                  rows={3}
                  dir="rtl"
                  placeholder="لاگ ان مریضوں کے لیے اردو نوٹ..."
                  className="w-full text-sm font-arabic resize-none"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="urduToggle"
              checked={urduEnabled}
              onChange={(e) => setUrduEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="urduToggle" className="text-sm font-medium cursor-pointer">
              Show second language translation on contact page
            </label>
          </div>
          
          <div className="flex items-center gap-4">
            <Button onClick={handleSaveNote} disabled={savingNote} className="px-8">
              {savingNote ? "Saving..." : "Save Note Settings"}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Tip: You can use Google Translate for translations. Any language is supported.
            </p>
          </div>
        </div>

        {/* Section C — Success popup for logged-in patients */}
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
          <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
            <span>✅</span> Success popup message (logged-in patients only)
          </h4>
          <p className="text-[11px] text-muted-foreground mb-3">
            This larger popup appears after a logged-in patient successfully sends a message. You can customize what it says.
          </p>
          <Textarea
            value={popupEnglish}
            onChange={(e) => setPopupEnglish(e.target.value)}
            rows={3}
            placeholder='Default: Your message has been sent! Please check the "Messages" menu on our website to view our reply. We will respond as soon as possible.'
            className="w-full text-sm resize-none"
          />
          {urduEnabled && (
            <div className="mt-3 space-y-1.5">
              <label className="text-[10px] font-medium text-muted-foreground uppercase">Second Language (Popup)</label>
              <Textarea
                value={popupSecondLang}
                onChange={(e) => setPopupSecondLang(e.target.value)}
                rows={3}
                dir="rtl"
                placeholder="آپ کا پیغام بھیج دیا گیا ہے! براہِ کرم ہماری ویب سائٹ کے Messages مینو میں جا کر ہمارا جواب دیکھیں۔ ہم جلد از جلد جواب دیں گے۔"
                className="w-full text-sm font-arabic resize-none"
              />
            </div>
          )}
        </div>
      </div>



      {/* Message Detail Modal */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">{selectedMessage?.subject}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">From</p>
                  <p className="font-medium text-foreground">{selectedMessage.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{selectedMessage.email}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium text-foreground">
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="whitespace-pre-wrap text-sm text-foreground">{selectedMessage.message}</p>
              </div>

              {/* Reply History */}
              {selectedMessage.contact_replies && selectedMessage.contact_replies.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Previous Replies</h4>
                  <div className="space-y-2">
                    {selectedMessage.contact_replies.map((reply) => (
                      <div key={reply.id} className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                        <p className="text-foreground">{reply.reply_text}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {new Date(reply.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply Input */}
              <div className="pt-4 border-t border-border">
                {selectedMessage.user_id ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Reply to Patient
                      </h4>
                    </div>
                    <Textarea
                      placeholder="Type your reply to this patient..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleSendReply(selectedMessage.id)}
                        disabled={!replyText.trim()}
                      >
                        <Send className="mr-2 h-3.5 w-3.5" />
                        Send Reply
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md bg-muted p-3 text-center text-xs text-muted-foreground">
                    Guest message — cannot reply via this system.
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border mt-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleRead(selectedMessage)}>
                    {selectedMessage.is_read ? "Mark Unread" : "Mark Read"}
                  </Button>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete message?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMessage(selectedMessage.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AdminContactMessages;
