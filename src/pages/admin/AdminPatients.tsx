import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, FileSpreadsheet, FileText, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useClinicId } from "@/hooks/useClinic";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PatientRow {
  id: string;
  full_name: string;
  formatted_patient_id: string;
  age: number;
  gender: string;
  phone: string | null;
  email: string | null;
  created_at: string | null;
}

const AdminPatients = () => {
  const { clinicId } = useClinicId();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [search, setSearch] = useState("");
  const [clinicShortName, setClinicShortName] = useState("");

  const fetchData = async () => {
    const [{ data: pts }, { data: clinic }] = await Promise.all([
      supabase
        .from("patients")
        .select("id, full_name, formatted_patient_id, age, gender, phone, email, created_at")
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false }),
      supabase.from("clinics").select("short_name, clinic_name").eq("id", clinicId).single(),
    ]);
    setPatients((pts as PatientRow[]) || []);
    setClinicShortName((clinic as any)?.short_name || clinic?.clinic_name || "Clinic");
  };

  useEffect(() => {
    fetchData();
  }, [clinicId]);

  const handleDelete = async (patient: PatientRow) => {
    const { error } = await supabase.from("patients").delete().eq("id", patient.id);
    if (error) {
      toast.error("Failed to delete: " + error.message);
    } else {
      toast.success(`Patient ${patient.formatted_patient_id} deleted`);
      setPatients((prev) => prev.filter((p) => p.id !== patient.id));
    }
  };

  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.formatted_patient_id.toLowerCase().includes(search.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(search.toLowerCase()))
  );

  const getTimestamp = () => {
    const now = new Date();
    return `${now.getDate().toString().padStart(2, "0")}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  };

  const exportRows = patients.map((p) => ({
    "Patient ID": p.formatted_patient_id,
    "Full Name": p.full_name,
    Age: p.age,
    Gender: p.gender,
    Phone: p.phone || "—",
    Email: p.email || "—",
    "Registration Date": p.created_at ? new Date(p.created_at).toLocaleDateString() : "—",
  }));

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Patients");
    XLSX.writeFile(wb, `Patients - ${clinicShortName} - ${getTimestamp()}.xlsx`);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Patients - ${clinicShortName}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Exported: ${getTimestamp()}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [["Patient ID", "Full Name", "Age", "Gender", "Phone", "Email", "Registered"]],
      body: exportRows.map((r) => [r["Patient ID"], r["Full Name"], r.Age, r.Gender, r.Phone, r.Email, r["Registration Date"]]),
    });
    doc.save(`Patients - ${clinicShortName} - ${getTimestamp()}.pdf`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Patients</h2>
          <p className="text-sm text-muted-foreground">{patients.length} registered patients</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name or ID..." className="pl-9 w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPdf}>
            <FileText className="mr-1.5 h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>
                  <span className="inline-flex items-center rounded-lg bg-secondary px-2.5 py-1 font-display font-bold text-primary text-sm">
                    {patient.formatted_patient_id}
                  </span>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary text-xs font-bold">
                      {patient.full_name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    {patient.full_name}
                  </div>
                </TableCell>
                <TableCell>{patient.age}</TableCell>
                <TableCell className="capitalize">{patient.gender}</TableCell>
                <TableCell className="text-muted-foreground">{patient.phone || "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Patient</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to permanently delete <strong>{patient.full_name}</strong> ({patient.formatted_patient_id})? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(patient)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No patients found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default AdminPatients;
