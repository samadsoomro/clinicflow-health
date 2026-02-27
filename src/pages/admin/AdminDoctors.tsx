import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Stethoscope, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockDoctors as initialDoctors } from "@/data/mockData";
import type { Doctor } from "@/types/clinic";
import { toast } from "sonner";

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [form, setForm] = useState({ name: "", specialization: "", status: "active" as Doctor["status"] });

  const filtered = doctors.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingDoctor(null);
    setForm({ name: "", specialization: "", status: "active" });
    setDialogOpen(true);
  };

  const openEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setForm({ name: doctor.name, specialization: doctor.specialization, status: doctor.status });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.specialization) {
      toast.error("Please fill in all fields");
      return;
    }
    if (editingDoctor) {
      setDoctors((prev) => prev.map((d) => d.id === editingDoctor.id ? { ...d, ...form } : d));
      toast.success("Doctor updated successfully");
    } else {
      const newDoctor: Doctor = {
        id: crypto.randomUUID(),
        name: form.name,
        specialization: form.specialization,
        imageUrl: "",
        status: form.status,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setDoctors((prev) => [...prev, newDoctor]);
      toast.success("Doctor added successfully");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setDoctors((prev) => prev.filter((d) => d.id !== id));
    toast.success("Doctor removed");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Doctors</h2>
          <p className="text-sm text-muted-foreground">{doctors.length} doctors registered</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search doctors..." className="pl-9 w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" onClick={openAdd}>
                <Plus className="mr-2 h-4 w-4" /> Add Doctor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">{editingDoctor ? "Edit Doctor" : "Add New Doctor"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Full Name" />
                </div>
                <div className="space-y-2">
                  <Label>Specialization</Label>
                  <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="e.g., Cardiologist" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(val) => setForm({ ...form, status: val as Doctor["status"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button variant="hero" onClick={handleSave}>{editingDoctor ? "Update" : "Add"} Doctor</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((doctor) => (
              <TableRow key={doctor.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    {doctor.name}
                  </div>
                </TableCell>
                <TableCell>{doctor.specialization}</TableCell>
                <TableCell>
                  <Badge variant={doctor.status === "active" ? "default" : "secondary"}>
                    {doctor.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{doctor.createdAt}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(doctor)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(doctor.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No doctors found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default AdminDoctors;
