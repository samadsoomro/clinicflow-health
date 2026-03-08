import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Users, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminRow {
  id: string;
  user_id: string;
  role: string;
  clinic_id: string | null;
  profile?: { full_name: string; email: string | null } | null;
  clinic?: { clinic_name: string } | null;
}

interface ClinicOption {
  id: string;
  clinic_name: string;
}

const SuperAdminAdmins = () => {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [clinics, setClinics] = useState<ClinicOption[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ email: "", role: "clinic_admin" as string, clinic_id: "" });
  const [saving, setSaving] = useState(false);

  const fetchAdmins = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("id, user_id, role, clinic_id, profiles:user_id(full_name, email), clinics:clinic_id(clinic_name)")
      .in("role", ["super_admin", "clinic_admin"]);
    setAdmins((data as any[]) || []);
  };

  const fetchClinics = async () => {
    const { data } = await supabase.from("clinics").select("id, clinic_name").order("clinic_name");
    setClinics((data as ClinicOption[]) || []);
  };

  useEffect(() => { fetchAdmins(); fetchClinics(); }, []);

  const filtered = admins.filter((a) => {
    const name = (a as any).profiles?.full_name || "";
    const email = (a as any).profiles?.email || "";
    return name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase());
  });

  const handleAssign = async () => {
    if (!form.email) { toast.error("Email is required"); return; }
    if (form.role === "clinic_admin" && !form.clinic_id) { toast.error("Select a clinic"); return; }

    setSaving(true);
    // Find user by email in profiles
    const { data: profileData } = await supabase.from("profiles").select("id").eq("email", form.email).single();
    if (!profileData) {
      toast.error("No user found with that email. They must register first.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("user_roles").insert({
      user_id: profileData.id,
      role: form.role as any,
      clinic_id: form.role === "clinic_admin" ? form.clinic_id : null,
    });

    if (error) {
      if (error.message.includes("duplicate")) toast.error("This user already has this role");
      else toast.error(error.message);
    } else {
      toast.success("Role assigned successfully");
      setDialogOpen(false);
      fetchAdmins();
    }
    setSaving(false);
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this role assignment?")) return;
    await supabase.from("user_roles").delete().eq("id", id);
    toast.success("Role removed");
    fetchAdmins();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Admin Users</h2>
          <p className="text-sm text-muted-foreground">Manage super admins and clinic admins</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search admins..." className="pl-9 w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero"><Plus className="mr-2 h-4 w-4" /> Assign Role</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Assign Admin Role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>User Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@example.com" />
                  <p className="text-xs text-muted-foreground">User must have registered first</p>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="clinic_admin">Clinic Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.role === "clinic_admin" && (
                  <div className="space-y-2">
                    <Label>Clinic</Label>
                    <Select value={form.clinic_id} onValueChange={(v) => setForm({ ...form, clinic_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select clinic" /></SelectTrigger>
                      <SelectContent>
                        {clinics.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.clinic_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button variant="hero" onClick={handleAssign} disabled={saving}>{saving ? "Assigning..." : "Assign Role"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Clinic</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p>{(admin as any).profiles?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{(admin as any).profiles?.email || ""}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={admin.role === "super_admin" ? "destructive" : "default"}>
                    {admin.role === "super_admin" ? "Super Admin" : "Clinic Admin"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {(admin as any).clinics?.clinic_name || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(admin.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No admin users found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default SuperAdminAdmins;
