import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Ticket, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useClinicDoctors } from "@/hooks/useClinic";
import { toast } from "sonner";

const AdminTokens = () => {
  const { doctors, loading: doctorsLoading, clinicId } = useClinicDoctors();
  const [issueForm, setIssueForm] = useState({ doctorId: "", patientName: "" });
  const [activateNumber, setActivateNumber] = useState("");
  const [todayTokens, setTodayTokens] = useState<any[]>([]);
  const [issuing, setIssuing] = useState(false);
  const [activating, setActivating] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const fetchTodayTokens = async () => {
    const { data } = await supabase
      .from("tokens")
      .select("*, doctors:doctor_id(name, specialization)")
      .eq("clinic_id", clinicId)
      .gte("created_at", today + "T00:00:00")
      .lte("created_at", today + "T23:59:59")
      .order("token_number", { ascending: true });
    setTodayTokens((data as any[]) || []);
  };

  useEffect(() => {
    fetchTodayTokens();
    // Realtime subscription
    const channel = supabase
      .channel("admin-tokens")
      .on("postgres_changes", { event: "*", schema: "public", table: "tokens" }, () => {
        fetchTodayTokens();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clinicId]);

  const getNextTokenNumber = () => {
    if (todayTokens.length === 0) return 1;
    return Math.max(...todayTokens.map((t) => t.token_number)) + 1;
  };

  const handleIssueToken = async () => {
    if (!issueForm.doctorId || !issueForm.patientName.trim()) {
      toast.error("Please select a doctor and enter patient name");
      return;
    }
    setIssuing(true);
    const tokenNumber = getNextTokenNumber();
    const { error } = await supabase.from("tokens").insert({
      clinic_id: clinicId,
      doctor_id: issueForm.doctorId,
      token_number: tokenNumber,
      patient_name: issueForm.patientName.trim(),
      status: "waiting",
    } as any);

    if (error) {
      toast.error("Failed to issue token: " + error.message);
    } else {
      toast.success(`Token #${tokenNumber} issued successfully`);
      setIssueForm({ doctorId: "", patientName: "" });
      fetchTodayTokens();
    }
    setIssuing(false);
  };

  const handleActivateToken = async () => {
    const num = parseInt(activateNumber);
    if (!num) {
      toast.error("Enter a valid token number");
      return;
    }
    setActivating(true);

    // Find the token
    const target = todayTokens.find((t) => t.token_number === num);
    if (!target) {
      toast.error(`Token #${num} not found for today`);
      setActivating(false);
      return;
    }

    // Set all current 'live' tokens to 'completed'
    const liveTokens = todayTokens.filter((t) => t.status === "live");
    for (const lt of liveTokens) {
      await supabase.from("tokens").update({ status: "completed" } as any).eq("id", lt.id);
    }

    // Set target to 'live'
    const { error } = await supabase.from("tokens").update({ status: "live" } as any).eq("id", target.id);
    if (error) {
      toast.error("Failed to activate: " + error.message);
    } else {
      toast.success(`Token #${num} is now LIVE`);
      setActivateNumber("");
      fetchTodayTokens();
    }
    setActivating(false);
  };

  const liveToken = todayTokens.find((t) => t.status === "live");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Token Management</h2>
        <p className="text-sm text-muted-foreground">
          {todayTokens.length} tokens issued today · {todayTokens.filter((t) => t.status === "waiting").length} waiting
        </p>
      </div>

      {/* Two action cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* CARD 1: Issue Token */}
        <Card className="border-border shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Ticket className="h-5 w-5 text-primary" />
              Issue Token
            </CardTitle>
            <CardDescription>Issue a new token for a walk-in patient</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select value={issueForm.doctorId} onValueChange={(v) => setIssueForm({ ...issueForm, doctorId: v })}>
                <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name} — {d.specialization}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Patient Name</Label>
              <Input
                value={issueForm.patientName}
                onChange={(e) => setIssueForm({ ...issueForm, patientName: e.target.value })}
                placeholder="Enter patient name"
              />
            </div>
            <div className="rounded-xl bg-secondary p-4 text-center">
              <p className="text-xs text-muted-foreground">Next Token</p>
              <p className="font-display text-4xl font-bold text-primary">{getNextTokenNumber()}</p>
            </div>
            <Button variant="hero" className="w-full" onClick={handleIssueToken} disabled={issuing}>
              {issuing ? "Issuing..." : "Issue Token"}
            </Button>
          </CardContent>
        </Card>

        {/* CARD 2: Activate Token */}
        <Card className="border-border shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Zap className="h-5 w-5 text-primary" />
              Activate Token
            </CardTitle>
            <CardDescription>Set the currently serving token number</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {liveToken && (
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center">
                <p className="text-xs text-muted-foreground">Currently Live</p>
                <p className="font-display text-4xl font-bold text-primary">{liveToken.token_number}</p>
                <p className="text-sm text-muted-foreground mt-1">{liveToken.patient_name}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Token Number</Label>
              <Input
                type="number"
                value={activateNumber}
                onChange={(e) => setActivateNumber(e.target.value)}
                placeholder="Enter token number to activate"
              />
            </div>
            <Button variant="hero" className="w-full" onClick={handleActivateToken} disabled={activating}>
              {activating ? "Activating..." : "Make Live"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Today's Tokens Table */}
      <Card className="border-border shadow-soft overflow-hidden">
        <CardHeader>
          <CardTitle className="font-display text-lg">Today's Tokens</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token #</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todayTokens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No tokens issued today</TableCell>
                </TableRow>
              ) : (
                todayTokens.map((token) => (
                  <TableRow key={token.id} className={token.status === "live" ? "bg-primary/5" : ""}>
                    <TableCell>
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg font-display font-bold ${
                        token.status === "live" ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
                      }`}>
                        {token.token_number}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{token.patient_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {token.doctors?.name || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        token.status === "live" ? "default" :
                        token.status === "waiting" ? "secondary" : "outline"
                      }>
                        {token.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminTokens;
