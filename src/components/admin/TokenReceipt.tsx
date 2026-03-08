import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TokenReceiptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: any;
  clinicId: string;
}

interface ReceiptData {
  clinicName: string;
  clinicLogo: string | null;
  clinicUrl: string;
  doctorName: string;
  specialization: string;
  tokenNumber: number;
  patientName: string;
  status: string;
  dateTime: string;
  phone: string;
  address: string;
  hours: string;
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  const date = `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getFullYear()}`;
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${date}  ${time}`;
};

const TokenReceipt = ({ open, onOpenChange, token, clinicId }: TokenReceiptProps) => {
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !token) return;
    setLoading(true);

    const fetchData = async () => {
      const [clinicRes, doctorRes, contactRes] = await Promise.all([
        supabase.from("clinics").select("clinic_name, logo_url, qr_base_url, contact_phone, address, working_hours").eq("id", clinicId).single(),
        supabase.from("doctors").select("name, specialization").eq("id", token.doctor_id).single(),
        supabase.from("homepage_sections").select("content_json").eq("clinic_id", clinicId).eq("section_name", "contact").maybeSingle(),
      ]);

      const clinic = clinicRes.data as any;
      const doctor = doctorRes.data as any;
      const cj = (contactRes.data as any)?.content_json || {};

      setData({
        clinicName: clinic?.clinic_name || "Clinic",
        clinicLogo: clinic?.logo_url || null,
        clinicUrl: clinic?.qr_base_url || "",
        doctorName: doctor?.name || "—",
        specialization: doctor?.specialization || "",
        tokenNumber: token.token_number,
        patientName: token.patient_name || "—",
        status: token.status || "waiting",
        dateTime: formatDateTime(token.created_at),
        phone: cj.phone || clinic?.contact_phone || "Not provided",
        address: cj.address || clinic?.address || "Not provided",
        hours: cj.working_hours || clinic?.working_hours || "",
      });
      setLoading(false);
    };

    fetchData();
  }, [open, token, clinicId]);

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const el = document.getElementById("token-receipt");
    if (!el) return;
    const printContents = el.innerHTML;
    const patientSlug = (data?.patientName || "Patient").replace(/\s+/g, "");
    const dateStr = data?.dateTime?.split("  ")[0] || "";
    const win = window.open("", "", "width=400,height=600");
    if (!win) return;
    win.document.write(`<html><head><title>Token-${data?.tokenNumber}-${patientSlug}-${dateStr}</title><style>body{font-family:'Courier New',monospace;width:300px;margin:0 auto;padding:6px;color:#000;font-size:11px}*{box-sizing:border-box}img{max-height:32px;margin:0 auto;display:block}</style></head><body>${printContents}</body></html>`);
    win.document.close();
    win.print();
  };

  if (!data && !loading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md p-0 gap-0">
        <DialogTitle className="sr-only">Token Receipt</DialogTitle>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>
        ) : data ? (
          <>
            {/* Receipt — printable area */}
            <div id="token-receipt" className="receipt-printable bg-white text-black p-1.5 font-mono text-[11px] leading-tight mx-auto" style={{ width: 300 }}>
              {/* Header */}
              <div className="border-t border-dashed border-black my-1" />
              <div className="text-center">
                {data.clinicLogo && (
                  <img src={data.clinicLogo} alt="" className="mx-auto mb-1 h-8 object-contain" />
                )}
                <p className="font-bold text-sm uppercase">{data.clinicName}</p>
                {data.clinicUrl && <p className="text-[9px] text-gray-500">{data.clinicUrl}</p>}
              </div>
              <div className="border-t border-dashed border-black my-1" />
              <p className="text-center font-bold text-[10px] tracking-widest">TOKEN RECEIPT</p>
              <div className="border-t border-dashed border-black my-1" />

              {/* Token number */}
              <p className="text-center font-bold text-3xl my-1">#{data.tokenNumber}</p>

              {/* Details */}
              <div className="space-y-0">
                <div className="flex justify-between"><span className="text-gray-500">Patient</span><span className="font-semibold text-right max-w-[55%] truncate">{data.patientName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Doctor</span><span className="font-semibold">{data.doctorName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Specialization</span><span>{data.specialization}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{data.dateTime}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="capitalize">{data.status}</span></div>
              </div>

              <div className="border-t border-dashed border-black my-1" />
              <div className="text-center text-[10px]">
                <p>Please wait for your token</p>
                <p>number to be called.</p>
                {data.clinicUrl && (
                  <>
                    <p className="mt-0.5">Check live token status at:</p>
                    <p className="font-semibold">{data.clinicUrl}</p>
                  </>
                )}
              </div>
              <div className="border-t border-dashed border-black my-1" />

              {/* Contact */}
              <div className="space-y-0 text-[9px]">
                <div className="flex justify-between"><span className="text-gray-500">Contact</span><span>{data.phone}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="text-right max-w-[60%]">{data.address}</span></div>
                {data.hours && <div className="flex justify-between"><span className="text-gray-500">Hours</span><span>{data.hours}</span></div>}
              </div>

              <div className="border-t border-dashed border-black my-1" />
              <p className="text-center text-[8px] text-gray-400">Powered by ClinicToken CMS</p>
            </div>

            {/* Action buttons — hidden in print */}
            <div className="receipt-no-print flex flex-col sm:flex-row gap-2 p-4 border-t">
              <Button variant="outline" className="flex-1" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
              <Button className="flex-1" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default TokenReceipt;
