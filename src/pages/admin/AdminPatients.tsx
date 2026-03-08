import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useClinicId } from "@/hooks/useClinic";

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

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("patients")
        .select("id, full_name, formatted_patient_id, age, gender, phone, email, created_at")
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false });
      setPatients((data as PatientRow[]) || []);
    };
    fetch();
  }, [clinicId]);

  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.formatted_patient_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Patients</h2>
          <p className="text-sm text-muted-foreground">{patients.length} registered patients</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or ID..." className="pl-9 w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
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
              <TableHead>Registered</TableHead>
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
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No patients found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default AdminPatients;
