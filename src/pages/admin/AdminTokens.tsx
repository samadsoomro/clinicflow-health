import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Ticket, RotateCcw, FileSpreadsheet, FileText, UserCheck, UserX, CheckCircle, Printer, Trash2, Loader2 } from "lucide-react";
import TokenReceipt from "@/components/admin/TokenReceipt";
import IssueTokenModal from "@/components/admin/IssueTokenModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useClinicId } from "@/hooks/useClinic";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AdminTokens = () => {
  const { clinicId } = useClinicId();
  const [activeDoctors, setActiveDoctors] = useState<any[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [todayTokens, setTodayTokens] = useState<any[]>([]);
  const [issuing, setIssuing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [receiptToken, setReceiptToken] = useState<any>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | undefined>(undefined);
  const [clinicShortName, setClinicShortName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);
  const [urlSaveMsg, setUrlSaveMsg] = useState<string | null>(null);
  const [clearingOld, setClearingOld] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchDoctors = async () => {
      setDoctorsLoading(true);
      const { data: doctorsData } = await supabase
        .from("doctors")
        .select("id, name, specialization")
        .eq("clinic_id", clinicId)
        .eq("status", "active")
        .order("name");
      setActiveDoctors(doctorsData || []);
      setDoctorsLoading(false);
    };

    if (clinicId) {
      fetchDoctors();
      supabase.from("clinics").select("short_name, clinic_name, qr_base_url").eq("id", clinicId).single()
        .then(({ data }) => {
          setClinicShortName((data as any)?.short_name || data?.clinic_name || "Clinic");
          setWebsiteUrl((data as any)?.qr_base_url || "");
        });
    }
  }, [clinicId]);

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
    if (clinicId) {
      fetchTodayTokens();
      const channel = supabase
        .channel("admin-tokens")
        .on("postgres_changes", { event: "*", schema: "public", table: "tokens", filter: `clinic_id=eq.${clinicId}` }, () => {
          fetchTodayTokens();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [clinicId]);

  const getNextTokenNumber = () => {
    if (todayTokens.length === 0) return 1;
    return Math.max(...todayTokens.map((t) => t.token_number)) + 1;
  };

  const handleOpenIssueModal = (doctorId?: string) => {
    setSelectedDoctorId(doctorId);
    setIssueModalOpen(true);
  };

  const handleIssueToken = async (doctorId: string, patientName: string) => {
    setIssuing(true);
    const tokenNumber = getNextTokenNumber();
    const { error } = await supabase.from("tokens").insert({
      clinic_id: clinicId,
      doctor_id: doctorId,
      token_number: tokenNumber,
      patient_name: patientName.trim() || "",
      status: "waiting",
    } as any);

    if (error) {
      toast.error("Failed to issue token: " + error.message);
    } else {
      const issuedToken = { token_number: tokenNumber, patient_name: patientName.trim() || "", doctor_id: doctorId, status: "waiting", created_at: new Date().toISOString(), clinic_id: clinicId };
      toast.success(`Token #${tokenNumber} issued successfully`, {
        action: { label: "Print Token", onClick: () => { setReceiptToken(issuedToken); setReceiptOpen(true); } },
      });
      fetchTodayTokens();
    }
    setIssuing(false);
  };

  const handleMarkServing = async (token: any) => {
    const servingForDoc = todayTokens.filter((t) => t.doctor_id === token.doctor_id && t.status === "serving");
    for (const st of servingForDoc) {
      await supabase.from("tokens").update({ status: "completed" } as any).eq("id", st.id);
    }
    const { error } = await supabase.from("tokens").update({ status: "serving" } as any).eq("id", token.id);
    if (error) {
      toast.error("Failed: " + error.message);
    } else {
      toast.success(`Token #${token.token_number} is now Serving`);
      fetchTodayTokens();
    }
  };

  const handleMarkUnavailable = async (token: any) => {
    const { error } = await supabase.from("tokens").update({ status: "unavailable" } as any).eq("id", token.id);
    if (error) {
      toast.error("Failed: " + error.message);
    } else {
      toast.info(`Token #${token.token_number} marked as unavailable`);
      fetchTodayTokens();
    }
  };

  const handleMarkCompleted = async (token: any) => {
    const { data: nextToken } = await supabase
      .from("tokens")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("doctor_id", token.doctor_id)
      .eq("status", "waiting")
      .gte("created_at", today + "T00:00:00")
      .lte("created_at", today + "T23:59:59")
      .order("token_number", { ascending: true })
      .limit(1)
      .single();

    const { error } = await supabase.from("tokens").update({ status: "completed" } as any).eq("id", token.id);
    if (error) {
      toast.error("Failed: " + error.message);
      return;
    }

    if (nextToken) {
      await supabase.from("tokens").update({ status: "serving" } as any).eq("id", nextToken.id);
      toast.success(`Token #${token.token_number} completed → Token #${nextToken.token_number} now serving`);
    } else {
      toast.success(`Token #${token.token_number} completed. Queue is clear.`);
    }
    fetchTodayTokens();
  };

  const handleResetToday = async () => {
    if (!confirm("Reset all of today's tokens? This action cannot be undone.")) return;
    setResetting(true);

    const ids = todayTokens.map((t) => t.id);
    if (ids.length > 0) {
      const { error } = await supabase.from("tokens").delete().in("id", ids);
      if (error) {
        toast.error("Failed to reset: " + error.message);
      } else {
        setTodayTokens([]);
        toast.success("Today's tokens have been reset!");
      }
    } else {
      toast.info("No tokens to reset");
    }
    setResetting(false);
  };

  const getTimestamp = () => {
    const now = new Date();
    return `${now.getDate().toString().padStart(2, "0")}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  };

  const exportRows = todayTokens.map((t) => ({
    "Token #": t.token_number,
    "Patient Name": t.patient_name,
    "Doctor Name": t.doctors?.name || "—",
    Status: t.status,
    Time: t.created_at ? new Date(t.created_at).toLocaleTimeString() : "—",
  }));

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tokens");
    XLSX.writeFile(wb, `Today's Tokens - ${clinicShortName} - ${getTimestamp()}.xlsx`);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Today's Tokens - ${clinicShortName}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Exported: ${getTimestamp()}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["Token #", "Patient Name", "Doctor Name", "Status", "Time"]],
      body: exportRows.map((r) => [r["Token #"], r["Patient Name"], r["Doctor Name"], r.Status, r.Time]),
    });

    doc.save(`Today's Tokens - ${clinicShortName} - ${getTimestamp()}.pdf`);
  };

  const handleSaveUrl = async () => {
    setSavingUrl(true);
    const { error } = await supabase.from("clinics").update({ qr_base_url: websiteUrl.trim() } as any).eq("id", clinicId);
    if (error) {
      setUrlSaveMsg("✗ Failed to save");
    } else {
      setUrlSaveMsg("✓ Saved");
    }
    setSavingUrl(false);
    setTimeout(() => setUrlSaveMsg(null), 2000);
  };

  const handleClearOldTokens = async () => {
    if (!confirm("Delete all completed/unavailable tokens older than 7 days? This cannot be undone.")) return;
    setClearingOld(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cleanup-old-tokens`,
        { method: "POST", headers: { Authorization: `Bearer ${session?.access_token || ""}` } }
      );
      const json = await res.json();
      if (json.success) {
        toast.success(`Cleared ${json.deleted ?? 0} old token(s).`);
      } else {
        toast.error("Cleanup failed: " + (json.error || "Unknown error"));
      }
    } catch (e: any) {
      toast.error("Cleanup error: " + e.message);
    }
    setClearingOld(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Website URL + Export bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2">
            <Label className="shrink-0 text-xs text-muted-foreground">Website URL</Label>
            <Input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="e.g. zahidaclinic.health.vercel.app"
              className="max-w-xs text-sm"
            />
            <Button size="sm" variant="outline" onClick={handleSaveUrl} disabled={savingUrl}>
              {savingUrl ? "…" : "Save"}
            </Button>
            {urlSaveMsg && <span className={`text-xs ${urlSaveMsg.startsWith("✓") ? "text-green-600" : "text-destructive"}`}>{urlSaveMsg}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={todayTokens.length === 0}>
              <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={todayTokens.length === 0}>
              <FileText className="mr-1.5 h-4 w-4" /> PDF
            </Button>
            <Button variant="destructive" size="sm" onClick={handleResetToday} disabled={resetting || todayTokens.length === 0}>
              <RotateCcw className="mr-1.5 h-4 w-4" /> {resetting ? "Resetting..." : "Reset Today"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearOldTokens} disabled={clearingOld} className="border-destructive text-destructive hover:bg-destructive/10">
              {clearingOld ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />}
              {clearingOld ? "Clearing..." : "Clear Old Tokens"}
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground -mt-1">This URL appears on token receipts so patients can check live token status</p>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 overflow-hidden">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground truncate">Token Management</h2>
              <p className="text-sm text-muted-foreground">
                {todayTokens.length} tokens issued today · {todayTokens.filter((t) => t.status === "waiting").length} waiting
              </p>
            </div>
          </div>
        </div>
      </div>

      {doctorsLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
          {activeDoctors.map((doctor) => {
            const doctorTokens = todayTokens.filter(t => t.doctor_id === doctor.id);
            const servingToken = doctorTokens.find(t => t.status === 'serving');
            const waitingCount = doctorTokens.filter(t => t.status === 'waiting').length;

            return (
              <div key={doctor.id} className="border border-border rounded-2xl p-6 bg-card shadow-soft flex flex-col">
                {/* Doctor header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold font-display">{doctor.name}</h3>
                    <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                  </div>
                  <Button
                    onClick={() => handleOpenIssueModal(doctor.id)}
                    variant="hero"
                    size="sm"
                  >
                    <Ticket className="mr-2 h-4 w-4" /> Issue Token
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-primary/5 border border-primary/10 rounded-xl px-4 py-3 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Now Serving</div>
                    <div className="text-2xl font-bold font-display text-primary">
                      {servingToken ? `#${servingToken.token_number}` : '—'}
                    </div>
                  </div>
                  <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl px-4 py-3 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Waiting</div>
                    <div className="text-2xl font-bold font-display text-yellow-600">{waitingCount}</div>
                  </div>
                </div>

                {/* Token table for this doctor only */}
                <div className="flex-1 overflow-hidden border rounded-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 text-left text-muted-foreground border-b border-border">
                          <th className="px-4 py-3 font-semibold">#</th>
                          <th className="px-4 py-3 font-semibold">Patient</th>
                          <th className="px-4 py-3 font-semibold text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {doctorTokens.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-12 text-center text-muted-foreground italic">
                              No tokens yet for {doctor.name}
                            </td>
                          </tr>
                        ) : (
                          doctorTokens
                            .sort((a, b) => a.token_number - b.token_number)
                            .map(token => (
                              <tr key={token.id} className={`hover:bg-muted/30 transition-colors ${token.status === 'serving' ? 'bg-primary/5' : ''}`}>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg font-display font-bold ${token.status === "serving" ? "bg-primary text-white" :
                                    token.status === "waiting" ? "bg-yellow-500 text-white" :
                                      token.status === "unavailable" ? "bg-destructive/20 text-destructive" :
                                        "bg-secondary text-muted-foreground"
                                    }`}>
                                    {token.token_number}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <p className={`font-medium ${token.status === 'unavailable' ? 'line-through text-muted-foreground' : ''}`}>
                                    {token.patient_name || 'Walk-in'}
                                  </p>
                                  <Badge variant="outline" className={`mt-1 text-[10px] px-1.5 py-0 capitalize ${token.status === 'serving' ? 'bg-primary/10 text-primary border-primary/20' :
                                    token.status === 'waiting' ? 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' :
                                      token.status === 'completed' ? 'bg-green-500/10 text-green-700 border-green-500/20' :
                                        'bg-destructive/10 text-destructive border-destructive/20'
                                    }`}>
                                    {token.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center gap-1">
                                    {token.status === "waiting" && (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                          onClick={() => handleMarkServing(token)}
                                          title="Mark Serving"
                                        >
                                          <UserCheck className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                          onClick={() => handleMarkUnavailable(token)}
                                          title="Mark Unavailable"
                                        >
                                          <UserX className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                    {token.status === "serving" && (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                          onClick={() => handleMarkCompleted(token)}
                                          title="Mark Completed"
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                          onClick={() => handleMarkUnavailable(token)}
                                          title="Mark Unavailable"
                                        >
                                          <UserX className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                      onClick={() => { setReceiptToken(token); setReceiptOpen(true); }}
                                      title="Print Receipt"
                                    >
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
          {activeDoctors.length === 0 && (
            <div className="col-span-full border-2 border-dashed rounded-3xl p-20 text-center bg-muted/20">
              <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <h3 className="text-xl font-bold font-display">No Active Doctors Found</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                Please add active doctors in the settings to start managing tokens by doctor.
              </p>
            </div>
          )}
        </div>
      )}

      <IssueTokenModal
        open={issueModalOpen}
        onOpenChange={setIssueModalOpen}
        doctors={activeDoctors}
        initialDoctorId={selectedDoctorId}
        onIssue={handleIssueToken}
        isIssuing={issuing}
        nextTokenNumber={getNextTokenNumber()}
      />

      <TokenReceipt open={receiptOpen} onOpenChange={setReceiptOpen} token={receiptToken} clinicId={clinicId} />
    </motion.div>
  );
};

export default AdminTokens;
