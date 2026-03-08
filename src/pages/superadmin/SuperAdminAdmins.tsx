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
  const [form, setForm] = useState({ full_name: "", email: "", password: "", clinic_id: "" });
  const [saving, setSaving] = useState(false);

  const fetchAdmins = async () => {
    // Fetch roles first
    const { data: roles } = await supabase
      .from("user_roles")
      .select("id, user_id, role, clinic_id")
      .in("role", ["super_admin", "clinic_admin"]);
    if (!roles || roles.length === 0) { setAdmins([]); return; }

    // Fetch profiles and clinics separately
    const userIds = [...new Set(roles.map(r => r.user_id))];
    const clinicIds = [...new Set(roles.map(r => r.clinic_id).filter(Boolean))] as string[];

    const [{ data: profiles }, { data: clinicData }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email").in("id", userIds),
      clinicIds.length > 0
        ? supabase.from("clinics").select("id, clinic_name").in("id", clinicIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    const clinicMap = Object.fromEntries((clinicData || []).map(c => [c.id, c]));

    setAdmins(roles.map(r => ({
      ...r,
      profile: profileMap[r.user_id] || null,
      clinic: r.clinic_id ? clinicMap[r.clinic_id] || null : null,
    })));
  };

  const fetchClinics = async () => {
    const { data } = await supabase.from("clinics").select("id, clinic_name").order("clinic_name");
    setClinics((data as ClinicOption[]) || []);
  };

  useEffect(() => { fetchAdmins(); fetchClinics(); }, []);

  const filtered = admins.filter((a) => {
    const name = a.profile?.full_name || "";
    const email = a.profile?.email || "";
    return name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase());
  });

  const handleCreate = async () => {
    if (!form.full_name || !form.email || !form.password) {
      toast.error("Name, email and password are required");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!form.clinic_id) {
      toast.error("Please select a clinic");
      return;
    }

    setSaving(true);
    const { data, error } = await supabase.functions.invoke("create-clinic-admin", {
      body: {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        clinic_id: form.clinic_id,
      },
    });

    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Failed to create admin");
    } else {
      toast.success("Clinic admin created successfully");
      setDialogOpen(false);
      setForm({ full_name: "", email: "", password: "", clinic_id: "" });
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
              <Button variant="hero"><Plus className="mr-2 h-4 w-4" /> Create Admin</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Create Clinic Admin</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Admin Name</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Dr. Ahmed Khan" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@clinic.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
                </div>
                <div className="space-y-2">
                  <Label>Assign to Clinic</Label>
                  <Select value={form.clinic_id} onValueChange={(v) => setForm({ ...form, clinic_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select clinic" /></SelectTrigger>
                    <SelectContent>
                      {clinics.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.clinic_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button variant="hero" onClick={handleCreate} disabled={saving}>{saving ? "Creating..." : "Create Admin"}</Button>
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
