import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Users, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockPatients } from "@/data/mockData";

const AdminPatients = () => {
  const [search, setSearch] = useState("");

  const filtered = mockPatients.filter((p) =>
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.formattedPatientId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Patients</h2>
          <p className="text-sm text-muted-foreground">{mockPatients.length} registered patients</p>
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
                    {patient.formattedPatientId}
                  </span>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary text-xs font-bold">
                      {patient.fullName.split(" ").map((n) => n[0]).join("")}
                    </div>
                    {patient.fullName}
                  </div>
                </TableCell>
                <TableCell>{patient.age}</TableCell>
                <TableCell className="capitalize">{patient.gender}</TableCell>
                <TableCell className="text-muted-foreground">{patient.phone}</TableCell>
                <TableCell className="text-muted-foreground">{patient.createdAt}</TableCell>
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
