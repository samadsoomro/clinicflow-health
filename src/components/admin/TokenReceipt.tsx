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

  const handlePrint = () => {
    if (!data) return;
    const token = data.tokenNumber || "";
    const patient = (data.patientName || "walkin").replace(/\s+/g, "");
    const date = data.dateTime?.split("  ")[0] || "";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <title>Token-${token}-${patient}-${date}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          html, body {
            width: 80mm;
            max-width: 80mm;
            min-width: 80mm;
            background: #fff;
            color: #000;
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            padding: 0;
            overflow-x: hidden;
          }

          .receipt-header {
            width: 100%;
            background: #fff;
            color: #000;
            padding: 3mm 3mm 2mm 3mm;
            margin: 0 0 2px 0;
            box-sizing: border-box;
            border-bottom: 2px solid #000;
          }

          .icon-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 3mm;
          }

          .health-icon {
            width: 16mm;
            height: 12mm;
            flex-shrink: 0;
          }

          .header-text {
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .clinic-name-header {
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 1px;
            color: #000;
            line-height: 1.2;
          }

          .clinic-sub {
            font-size: 8px;
            color: #444;
            margin-top: 1px;
          }

          .website {
            font-size: 9px;
            text-align: center;
            color: #444;
            margin: 3px 0;
            word-break: break-all;
            padding: 0 3mm;
          }

          .divider {
            border: none;
            border-top: 1px dashed #000;
            margin: 4px 3mm;
          }

          .receipt-title {
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 2px;
            margin: 3px 0;
          }

          .token-number {
            font-size: 48px;
            font-weight: bold;
            text-align: center;
            line-height: 1;
            margin: 4px 0;
          }

          .row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin: 2px 3mm;
            font-size: 11px;
            width: calc(100% - 6mm);
          }

          .row .label {
            color: #333;
            white-space: nowrap;
            flex-shrink: 0;
            margin-right: 3mm;
          }

          .row .value {
            font-weight: bold;
            text-align: right;
            word-break: break-word;
            max-width: 52mm;
          }

          .message {
            text-align: center;
            font-size: 10px;
            margin: 3px 3mm;
            line-height: 1.4;
            word-break: break-word;
          }

          .footer {
            text-align: center;
            font-size: 9px;
            color: #555;
            margin: 5px 0 4mm 0;
          }

          @media print {
            html, body {
              width: 80mm;
              max-width: 80mm;
            }
            @page {
              size: 80mm auto;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <!-- WHITE HEADER WITH ICON + CLINIC NAME -->
        <div class="receipt-header">
          <div class="icon-row">
            <svg class="health-icon" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 65 Q20 72 30 72 L65 72 Q72 70 75 65 L80 55 Q82 50 78 47 Q74 44 70 47 L68 50 L67 35 Q67 30 62 30 Q57 30 57 35 L57 38 L56 25 Q56 20 51 20 Q46 20 46 25 L46 38 L45 28 Q45 23 40 23 Q35 23 35 28 L35 50 Q30 45 25 47 Q18 50 15 58 Z" fill="none" stroke="#000" stroke-width="2.5" stroke-linejoin="round"/>
              <path d="M50 18 Q50 8 42 8 Q34 8 34 16 Q34 20 38 24 L50 35 L62 24 Q66 20 66 16 Q66 8 58 8 Q50 8 50 18 Z" fill="none" stroke="#000" stroke-width="2.5" stroke-linejoin="round"/>
              <polyline points="38,18 41,18 43,13 46,23 48,16 51,16 53,18 56,18" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div class="header-text">
              <div class="clinic-name-header">${data.clinicName?.toUpperCase() || 'CLINIC'}</div>
              <div class="clinic-sub">Healthcare Token System</div>
            </div>
          </div>
        </div>

        ${data.clinicUrl ? `<div class="website">${data.clinicUrl}</div>` : ''}

        <div class="divider"></div>
        <div class="receipt-title">TOKEN RECEIPT</div>
        <div class="divider"></div>

        <div class="token-number">#${token}</div>

        <div class="divider"></div>

        <div class="row">
          <span class="label">Patient</span>
          <span class="value">${data.patientName || "Walk-in"}</span>
        </div>
        <div class="row">
          <span class="label">Doctor</span>
          <span class="value">${data.doctorName || "—"}</span>
        </div>
        <div class="row">
          <span class="label">Spec</span>
          <span class="value">${data.specialization || "—"}</span>
        </div>
        <div class="row">
          <span class="label">Date</span>
          <span class="value">${data.dateTime || "—"}</span>
        </div>
        <div class="row">
          <span class="label">Status</span>
          <span class="value" style="text-transform:capitalize;">${data.status || "—"}</span>
        </div>

        <div class="divider"></div>

        <div class="message">
          Please wait for your token number to be called.
          ${data.clinicUrl ? `<div style="margin-top:4px;">Live status: <strong>${data.clinicUrl}</strong></div>` : ''}
        </div>

        <div class="divider"></div>

        <div class="row">
          <span class="label">Contact</span>
          <span class="value">${data.phone || "Not provided"}</span>
        </div>
        <div class="row">
          <span class="label">Address</span>
          <span class="value">${data.address || "Not provided"}</span>
        </div>
        ${data.hours ? `<div class="row"><span class="label">Hours</span><span class="value">${data.hours}</span></div>` : ''}

        <div class="divider"></div>
        <div class="footer">Powered by ClinicToken CMS</div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=320,height=700');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 600);
  };

  const handleDownload = handlePrint;

  if (!data && !loading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Token Receipt</DialogTitle>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>
        ) : data ? (
          <div className="flex flex-col h-auto">
            <div className="flex-1 overflow-y-auto p-4 bg-muted/30">
              <div
                id="token-receipt"
                className="bg-white text-black font-mono text-[11px] leading-tight mx-auto shadow-sm overflow-hidden"
                style={{ width: "80mm", minHeight: "100mm", height: "auto" }}
              >
                {/* WHITE HEADER WITH ICON + CLINIC NAME */}
                <div className="w-full bg-white text-black p-[3mm_3mm_2mm_3mm] mb-[2px] border-b-2 border-black flex items-center justify-center gap-[3mm]">
                  <svg className="w-[16mm] h-[12mm] shrink-0" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 65 Q20 72 30 72 L65 72 Q72 70 75 65 L80 55 Q82 50 78 47 Q74 44 70 47 L68 50 L67 35 Q67 30 62 30 Q57 30 57 35 L57 38 L56 25 Q56 20 51 20 Q46 20 46 25 L46 38 L45 28 Q45 23 40 23 Q35 23 35 28 L35 50 Q30 45 25 47 Q18 50 15 58 Z" fill="none" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
                    <path d="M50 18 Q50 8 42 8 Q34 8 34 16 Q34 20 38 24 L50 35 L62 24 Q66 20 66 16 Q66 8 58 8 Q50 8 50 18 Z" fill="none" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
                    <polyline points="38,18 41,18 43,13 46,23 48,16 51,16 53,18 56,18" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex flex-col justify-center">
                    <div className="text-[13px] font-bold tracking-[1px] leading-tight uppercase">{data.clinicName}</div>
                    <div className="text-[8px] text-gray-500 tracking-[0.5px] mt-[1px]">Healthcare Token System</div>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  {data.clinicUrl && (
                    <p className="text-[9px] text-gray-400 break-all leading-normal text-center mt-2">
                      {data.clinicUrl}
                    </p>
                  )}

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
                      <span className="text-gray-500 pr-2">Spec</span>
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
                        <p className="text-[9px] text-gray-400">Live status: <strong>{data.clinicUrl}</strong></p>
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
