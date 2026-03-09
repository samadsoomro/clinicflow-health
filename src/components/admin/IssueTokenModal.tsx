import { useState, useEffect } from "react";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface Doctor {
    id: string;
    name: string;
    specialization: string;
}

interface IssueTokenModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    doctors: Doctor[];
    initialDoctorId?: string;
    onIssue: (doctorId: string, patientName: string) => Promise<void>;
    isIssuing: boolean;
    nextTokenNumber: number;
}

const IssueTokenModal = ({
    open,
    onOpenChange,
    doctors,
    initialDoctorId,
    onIssue,
    isIssuing,
    nextTokenNumber,
}: IssueTokenModalProps) => {
    const [doctorId, setDoctorId] = useState(initialDoctorId || "");
    const [patientName, setPatientName] = useState("");

    useEffect(() => {
        if (open) {
            setDoctorId(initialDoctorId || "");
            setPatientName("");
        }
    }, [open, initialDoctorId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!doctorId) return;
        await onIssue(doctorId, patientName);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-display">
                        <Ticket className="h-5 w-5 text-primary" />
                        Issue New Token
                    </DialogTitle>
                    <DialogDescription>
                        Enter patient details to issue a new token.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="doctor">Select Doctor</Label>
                        <Select value={doctorId} onValueChange={setDoctorId} disabled={!!initialDoctorId}>
                            <SelectTrigger id="doctor">
                                <SelectValue placeholder="Select a doctor" />
                            </SelectTrigger>
                            <SelectContent>
                                {doctors.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>
                                        {d.name} — {d.specialization}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="patientName">
                            Patient Name <span className="text-muted-foreground font-normal">(optional)</span>
                        </Label>
                        <Input
                            id="patientName"
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                            placeholder="Enter patient name"
                            autoFocus
                        />
                    </div>
                    <div className="rounded-xl bg-secondary p-4 text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Next Token Number</p>
                        <p className="font-display text-4xl font-bold text-primary">{nextTokenNumber}</p>
                    </div>
                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="hero" disabled={isIssuing || !doctorId}>
                            {isIssuing ? "Issuing..." : "Confirm & Issue"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default IssueTokenModal;
