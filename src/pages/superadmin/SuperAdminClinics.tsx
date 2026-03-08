import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Building2, Edit, Trash2, Search, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClinicRow {
  id: string;
  clinic_name: string;
  subdomain: string;
  domain_name: string | null;
  is_active: boolean | null;
  contact_email: string | null;
  created_at: string | null;
}

const SuperAdminClinics = () => {
  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClinicRow | null>(null);
  const [form, setForm] = useState({ clinic_name: "", subdomain: "", domain_name: "", contact_email: "", address: "", contact_phone: "" });
  const [saving, setSaving] = useState(false);

  const fetchClinics = async () => {
    const { data } = await supabase
      .from("clinics")
      .select("id, clinic_name, subdomain, domain_name, is_active, contact_email, created_at")
      .order("created_at", { ascending: false });
    setClinics((data as ClinicRow[]) || []);
  };

  useEffect(() => { fetchClinics(); }, []);

  const filtered = clinics.filter((c) =>
    c.clinic_name.toLowerCase().includes(search.toLowerCase()) ||
    c.subdomain.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ clinic_name: "", subdomain: "", domain_name: "", contact_email: "", address: "", contact_phone: "" });
    setDialogOpen(true);
  };

  const openEdit = (c: ClinicRow) => {
    setEditing(c);
    setForm({ clinic_name: c.clinic_name, subdomain: c.subdomain, domain_name: c.domain_name || "", contact_email: c.contact_email || "", address: (c as any).address || "", contact_phone: (c as any).contact_phone || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.clinic_name || !form.subdomain) {
      toast.error("Clinic name and subdomain are required");
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("clinics").update({
        clinic_name: form.clinic_name,
        subdomain: form.subdomain,
        domain_name: form.domain_name || null,
        contact_email: form.contact_email || null,
      }).eq("id", editing.id);
      if (error) toast.error(error.message);
      else toast.success("Clinic updated");
    } else {
      const { error } = await supabase.from("clinics").insert({
        clinic_name: form.clinic_name,
        subdomain: form.subdomain,
        domain_name: form.domain_name || null,
        contact_email: form.contact_email || null,
      });
      if (error) toast.error(error.message);
      else toast.success("Clinic created");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchClinics();
  };

  const toggleActive = async (c: ClinicRow) => {
    await supabase.from("clinics").update({ is_active: !c.is_active }).eq("id", c.id);
    toast.success(c.is_active ? "Clinic deactivated" : "Clinic activated");
    fetchClinics();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this clinic? This cannot be undone.")) return;
    const { error } = await supabase.from("clinics").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Clinic deleted"); fetchClinics(); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Clinics</h2>
          <p className="text-sm text-muted-foreground">{clinics.length} clinics registered</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search clinics..." className="pl-9 w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Add Clinic</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">{editing ? "Edit Clinic" : "Create Clinic"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Clinic Name</Label>
                  <Input value={form.clinic_name} onChange={(e) => setForm({ ...form, clinic_name: e.target.value })} placeholder="My Clinic" />
                </div>
                <div className="space-y-2">
                  <Label>Subdomain</Label>
                  <div className="flex items-center gap-2">
                    <Input value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="myclinic" />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">.clinic.health</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Custom Domain (optional)</Label>
                  <Input value={form.domain_name} onChange={(e) => setForm({ ...form, domain_name: e.target.value })} placeholder="myclinic.com" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="admin@clinic.com" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button variant="hero" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clinic</TableHead>
              <TableHead>Subdomain</TableHead>
              <TableHead>Custom Domain</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((clinic) => (
              <TableRow key={clinic.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p>{clinic.clinic_name}</p>
                      {clinic.contact_email && <p className="text-xs text-muted-foreground">{clinic.contact_email}</p>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{clinic.subdomain}</TableCell>
                <TableCell className="text-muted-foreground">{clinic.domain_name || "—"}</TableCell>
                <TableCell>
                  <Badge variant={clinic.is_active ? "default" : "secondary"}>
                    {clinic.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => toggleActive(clinic)} title={clinic.is_active ? "Deactivate" : "Activate"}>
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(clinic)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(clinic.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No clinics found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default SuperAdminClinics;
