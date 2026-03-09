import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, AlertTriangle, Info, Trash2, ToggleLeft, ToggleRight, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useClinicId } from "@/hooks/useClinic";
import { toast } from "sonner";

interface NotifRow {
  id: string;
  title: string;
  message: string;
  priority: string | null;
  is_active: boolean | null;
  is_pinned: boolean;
  created_at: string | null;
}

const AdminNotifications = () => {
  const { clinicId } = useClinicId();
  const [notifications, setNotifications] = useState<NotifRow[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", priority: "normal" });
  const [saving, setSaving] = useState(false);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("id, title, message, priority, is_active, is_pinned, created_at")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false });
    setNotifications((data as NotifRow[]) || []);
  };

  useEffect(() => { fetchNotifications(); }, [clinicId]);

  const handleAdd = async () => {
    if (!form.title || !form.message) {
      toast.error("Please fill in all fields");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("notifications").insert({
      clinic_id: clinicId,
      title: form.title,
      message: form.message,
      priority: form.priority,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Notification created");
      setDialogOpen(false);
      setForm({ title: "", message: "", priority: "normal" });
      fetchNotifications();
    }
    setSaving(false);
  };

  const toggleActive = async (n: NotifRow) => {
    await supabase.from("notifications").update({ is_active: !n.is_active } as any).eq("id", n.id);
    fetchNotifications();
  };

  const togglePinned = async (n: NotifRow) => {
    await supabase.from("notifications").update({ is_pinned: !n.is_pinned } as any).eq("id", n.id);
    toast.success(n.is_pinned ? "Notification unpinned" : "Notification pinned to homepage banner");
    fetchNotifications();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this notification?")) return;
    await supabase.from("notifications").delete().eq("id", id);
    toast.success("Notification deleted");
    fetchNotifications();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            {notifications.filter((n) => n.is_active).length} active · {notifications.filter((n) => n.is_pinned).length} pinned to banner
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero"><Plus className="mr-2 h-4 w-4" /> New Notification</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Create Notification</DialogTitle>
              <DialogDescription>Create a new notification for your clinic.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notification title" />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Notification message" rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(val) => setForm({ ...form, priority: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button variant="hero" onClick={handleAdd} disabled={saving}>{saving ? "Creating..." : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {notifications.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-2xl border p-5 shadow-soft transition-all ${
              n.priority === "urgent" ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"
            } ${!n.is_active ? "opacity-60" : ""}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                  n.priority === "urgent" ? "bg-destructive/10 text-destructive" : "bg-secondary text-primary"
                }`}>
                  {n.priority === "urgent" ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display font-semibold text-foreground">{n.title}</h3>
                    <Badge variant={n.is_active ? "default" : "secondary"} className="text-xs">
                      {n.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {n.is_pinned && (
                      <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                        <Pin className="mr-1 h-3 w-3" /> Pinned
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                  <span className="mt-2 inline-block text-xs text-muted-foreground">
                    {n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => togglePinned(n)}
                  title={n.is_pinned ? "Unpin from homepage" : "Pin to homepage banner"}
                  className={n.is_pinned ? "text-primary" : ""}
                >
                  {n.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => toggleActive(n)} title={n.is_active ? "Deactivate" : "Activate"}>
                  {n.is_active ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(n.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
        {notifications.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">No notifications yet</p>
        )}
      </div>
    </motion.div>
  );
};

export default AdminNotifications;
