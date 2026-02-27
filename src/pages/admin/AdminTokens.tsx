import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Clock, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockTokens as initialTokens, mockDoctors } from "@/data/mockData";
import type { Token } from "@/types/clinic";
import { toast } from "sonner";

const AdminTokens = () => {
  const [tokens, setTokens] = useState<Token[]>(initialTokens);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ doctorId: "", patientName: "" });

  const activeDoctors = mockDoctors.filter((d) => d.status === "active");

  const getNextTokenNumber = (doctorId: string) => {
    const doctorTokens = tokens.filter((t) => t.doctorId === doctorId);
    return doctorTokens.length > 0 ? Math.max(...doctorTokens.map((t) => t.tokenNumber)) + 1 : 1;
  };

  const handleGenerate = () => {
    if (!form.doctorId || !form.patientName) {
      toast.error("Please fill in all fields");
      return;
    }
    const doctor = mockDoctors.find((d) => d.id === form.doctorId);
    const newToken: Token = {
      id: crypto.randomUUID(),
      doctorId: form.doctorId,
      doctorName: doctor?.name || "",
      tokenNumber: getNextTokenNumber(form.doctorId),
      patientName: form.patientName,
      isWalkin: true,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    setTokens((prev) => [...prev, newToken]);
    toast.success(`Token #${newToken.tokenNumber} generated for ${doctor?.name}`);
    setDialogOpen(false);
    setForm({ doctorId: "", patientName: "" });
  };

  const handleStatusChange = (id: string, status: Token["status"]) => {
    setTokens((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    toast.success(`Token marked as ${status}`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Token Management</h2>
          <p className="text-sm text-muted-foreground">{tokens.filter((t) => t.status === "active").length} active tokens today</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <Plus className="mr-2 h-4 w-4" /> Walk-In Token
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Generate Walk-In Token</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Doctor</Label>
                <Select value={form.doctorId} onValueChange={(val) => setForm({ ...form, doctorId: val })}>
                  <SelectTrigger><SelectValue placeholder="Choose a doctor" /></SelectTrigger>
                  <SelectContent>
                    {activeDoctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name} — {d.specialization}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Patient Name</Label>
                <Input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} placeholder="Enter patient name" />
              </div>
              {form.doctorId && (
                <div className="rounded-xl bg-secondary p-4 text-center">
                  <p className="text-sm text-muted-foreground">Next token number</p>
                  <p className="font-display text-4xl font-bold text-primary">{getNextTokenNumber(form.doctorId)}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button variant="hero" onClick={handleGenerate}>Generate Token</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Tokens Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {activeDoctors.map((doctor) => {
          const doctorTokens = tokens.filter((t) => t.doctorId === doctor.id && t.status === "active");
          const currentToken = doctorTokens.length > 0 ? Math.max(...doctorTokens.map((t) => t.tokenNumber)) : 0;
          return (
            <div key={doctor.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-primary font-display text-xl font-bold text-primary-foreground">
                {currentToken || "—"}
              </div>
              <div>
                <p className="font-display font-semibold text-foreground">{doctor.name}</p>
                <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
                <p className="mt-1 text-xs text-primary">{doctorTokens.length} active</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Token Table */}
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token #</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((token) => (
              <TableRow key={token.id}>
                <TableCell>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-secondary font-display font-bold text-primary">
                    {token.tokenNumber}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{token.patientName}</TableCell>
                <TableCell className="text-muted-foreground">{token.doctorName}</TableCell>
                <TableCell>
                  <Badge variant={token.isWalkin ? "outline" : "secondary"}>
                    {token.isWalkin ? "Walk-in" : "Registered"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    token.status === "active" ? "default" :
                    token.status === "completed" ? "secondary" : "outline"
                  }>
                    {token.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {token.status === "active" && (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleStatusChange(token.id, "completed")}>
                        Complete
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleStatusChange(token.id, "closed")}>
                        Close
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default AdminTokens;
