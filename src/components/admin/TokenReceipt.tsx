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



  const handleDownload = () => {
    if (!data) return;
    const clinic = data.clinicName || "";
    const token = data.tokenNumber || "";
    const patient = (data.patientName || "walkin").replace(/\s+/g, "");
    const date = data.dateTime?.split("  ")[0] || "";

    const logoHtml = data.clinicLogo
      ? `<img src="${data.clinicLogo}" style="width:48px;height:48px;object-fit:contain;margin-bottom:4px;" />`
      : "";

    const mapsUrl = data.clinicUrl
      ? `<p style="margin:6px 0 0 0;">Check live token status at:</p>
         <p style="margin:2px 0;font-weight:bold;word-break:break-all;">${data.clinicUrl}</p>`
      : "";

    const hoursHtml = data.hours
      ? `<tr><td style="padding:1px 0;">Hours</td><td style="padding:1px 0;text-align:right;">${data.hours}</td></tr>`
      : "";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <title>Token-${token}-${patient}-${date}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            width: 80mm;
            margin: 0 auto;
            padding: 20px 10px;
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .token-num { font-size: 42px; font-weight: bold; text-align: center; margin: 10px 0; }
          .clinic-name { font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 2px; }
          .clinic-url { font-size: 9px; text-align: center; word-break: break-all; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 5px 0; }
          td { font-size: 11px; padding: 2px 0; vertical-align: top; }
          td:last-child { text-align: right; font-weight: bold; }
          .footer { text-align: center; font-size: 9px; margin-top: 10px; color: #999; }
          .wait-msg { text-align: center; font-size: 10px; margin: 6px 0; line-height: 1.4; }
          img { display: block; margin: 0 auto 6px auto; }
          @media print {
            body { width: 100%; margin: 0; padding: 10px; }
            @page { size: 80mm auto; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="center">
          ${logoHtml}
          <div class="clinic-name">${clinic.toUpperCase()}</div>
          <div class="clinic-url">${data.clinicUrl || ""}</div>
        </div>
        <div class="divider"></div>
        <div class="center" style="font-weight:bold;letter-spacing:1.5px;font-size:12px;">TOKEN RECEIPT</div>
        <div class="divider"></div>
        <div class="token-num">#${token}</div>
        <div class="divider"></div>
        <table>
          <tr><td>Patient</td><td>${data.patientName || "—"}</td></tr>
          <tr><td>Doctor</td><td>${data.doctorName || "—"}</td></tr>
          <tr><td>Spec</td><td>${data.specialization || "—"}</td></tr>
          <tr><td>Date</td><td>${data.dateTime || "—"}</td></tr>
          <tr><td>Status</td><td style="text-transform:capitalize;">${data.status || "—"}</td></tr>
        </table>
        <div class="divider"></div>
        <div class="wait-msg">
          Please wait for your token number to be called.
          ${mapsUrl}
        </div>
        <div class="divider"></div>
        <table>
          <tr><td>Contact</td><td>${data.phone || "Not provided"}</td></tr>
          <tr><td>Address</td><td>${data.address || "Not provided"}</td></tr>
          ${hoursHtml}
        </table>
        <div class="divider"></div>
        <div class="footer">Powered by ClinicToken CMS</div>
      </body>
      </html>
    `;

    const win = window.open("", "_blank", "width=350,height=600");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
  };

  const handlePrint = () => {
    // Small delay to ensure modal is rendered
    setTimeout(() => {
      window.print();
    }, 200);
  };

  if (!data && !loading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Token Receipt</DialogTitle>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>
        ) : data ? (
          <div className="flex flex-col max-h-[90vh]">
            <div className="flex-1 overflow-y-auto p-4 bg-muted/30">
              <div
                id="token-receipt"
                className="receipt-printable bg-white text-black p-6 font-mono text-[11px] leading-tight mx-auto shadow-sm"
                style={{ width: "80mm", minHeight: "100mm" }}
              >
                {/* Header */}
                <div className="text-center">
                  {data.clinicLogo && (
                    <img src={data.clinicLogo} alt="" className="mx-auto mb-2 h-12 w-12 object-contain" />
                  )}
                  <p className="font-bold text-base uppercase mb-1">{data.clinicName}</p>
                  {data.clinicUrl && (
                    <p className="text-[9px] text-gray-500 break-all leading-normal px-4">
                      {data.clinicUrl}
                    </p>
                  )}
                </div>

                <div className="border-t border-dashed border-black my-3" />
                <p className="text-center font-bold text-[11px] tracking-[0.2em]">TOKEN RECEIPT</p>
                <div className="border-t border-dashed border-black my-3" />

                {/* Token number */}
                <p className="text-center font-bold text-5xl my-4">#{data.tokenNumber}</p>
                <div className="border-t border-dashed border-black my-3" />

                {/* Details */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500 pr-2">Patient</span>
                    <span className="font-bold text-right flex-1">{data.patientName}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500 pr-2">Doctor</span>
                    <span className="font-bold text-right flex-1">{data.doctorName}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500 pr-2">Specialization</span>
                    <span className="text-right flex-1">{data.specialization}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500 pr-2">Date</span>
                    <span className="text-right flex-1">{data.dateTime}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500 pr-2">Status</span>
                    <span className="capitalize font-bold text-right flex-1">{data.status}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-black my-3" />
                <div className="text-center text-[10px] space-y-1">
                  <p>Please wait for your token number to be called.</p>
                  {data.clinicUrl && (
                    <div className="pt-1">
                      <p className="text-[9px] text-gray-400">Check live token status at:</p>
                      <p className="font-bold break-all px-2">{data.clinicUrl}</p>
                    </div>
                  )}
                </div>
                <div className="border-t border-dashed border-black my-3" />

                {/* Contact */}
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500 pr-2">Contact</span>
                    <span className="font-bold text-right flex-1">{data.phone}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500 pr-2">Address</span>
                    <span className="text-right flex-1">{data.address}</span>
                  </div>
                  {data.hours && (
                    <div className="flex justify-between items-start">
                      <span className="text-gray-500 pr-2">Hours</span>
                      <span className="text-right flex-1">{data.hours}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-dashed border-black mt-4 mb-2" />
                <p className="text-center text-[9px] text-gray-400">Powered by ClinicToken CMS</p>
              </div>
            </div>

            {/* Action buttons — excluded from printable class but handled via receipt-no-print media query */}
            <div className="receipt-no-print flex gap-3 p-4 bg-background border-t">
              <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
              <Button
                onClick={handlePrint}
                className="flex-1 rounded-xl h-11 gradient-primary shadow-lg shadow-primary/20"
              >
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default TokenReceipt;
