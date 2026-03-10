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

  const buildReceiptHTML = () => {
    if (!data) return "";
    const token = data.tokenNumber || "";
    const patient = (data.patientName || "walkin").replace(/\s+/g, "");
    const date = data.dateTime?.split("  ")[0] || "";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <title>Token-${token}-${patient}-${date}</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
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
          width: 100%;
          max-width: 302px;
          background: #fff;
          color: #000;
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          overflow-x: hidden;
        }
        .receipt-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px 7px 10px;
          border-bottom: 2px solid #000;
          width: 100%;
        }
        .icon-wrap {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .icon-wrap i {
          font-size: 42px;
          color: #000;
        }
        .header-text {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        .clinic-name-header {
          font-size: 12px;
          font-weight: bold;
          color: #000;
          line-height: 1.2;
          word-break: break-word;
        }
        .clinic-sub {
          font-size: 8px;
          color: #555;
          margin-top: 1px;
        }
        .website-line {
          text-align: center;
          font-size: 9px;
          color: #555;
          padding: 4px 10px;
          word-break: break-all;
          width: 100%;
        }
        .divider {
          border: none;
          border-top: 1px dashed #000;
          width: calc(100% - 20px);
          margin: 3px 10px;
          display: block;
        }
        .section-title {
          text-align: center;
          font-size: 11px;
          font-weight: bold;
          letter-spacing: 2px;
          padding: 4px 0;
          width: 100%;
        }
        .token-number {
          font-size: 44px;
          font-weight: bold;
          text-align: center;
          line-height: 1.1;
          padding: 3px 0;
          width: 100%;
        }
        .data-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
          padding: 2px 10px;
          font-size: 11px;
        }
        .data-row .lbl {
          color: #444;
          white-space: nowrap;
          flex-shrink: 0;
          margin-right: 6px;
          min-width: 55px;
        }
        .data-row .val {
          font-weight: bold;
          text-align: right;
          word-break: break-word;
          flex: 1;
        }
        .msg {
          text-align: center;
          font-size: 10px;
          padding: 4px 10px;
          line-height: 1.4;
          width: 100%;
          word-break: break-word;
        }
        .footer-line {
          text-align: center;
          font-size: 9px;
          color: #777;
          padding: 5px 0 10px 0;
          width: 100%;
        }
        @media print {
          html, body {
            width: 100%;
            max-width: 302px;
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
          <div class="icon-wrap">
            <i class="fas fa-heartbeat"></i>
          </div>
          <div class="header-text">
            <div class="clinic-name-header">${data.clinicName?.toUpperCase() || 'CLINIC'}</div>
            <div class="clinic-sub">Healthcare Token System</div>
          </div>
        </div>

        ${data.clinicUrl ? `<div class="website-line">${data.clinicUrl}</div>` : ''}

        <div class="divider"></div>
        <div class="section-title">TOKEN RECEIPT</div>
        <div class="divider"></div>

        <div class="token-number">#${token}</div>

        <div class="divider"></div>

        <div class="data-row">
          <span class="lbl">Patient</span>
          <span class="val">${data.patientName || "Walk-in"}</span>
        </div>
        <div class="data-row">
          <span class="lbl">Doctor</span>
          <span class="val">${data.doctorName || "—"}</span>
        </div>
        <div class="data-row">
          <span class="lbl">Spec</span>
          <span class="val">${data.specialization || "—"}</span>
        </div>
        <div class="data-row">
          <span class="lbl">Date</span>
          <span class="val">${data.dateTime || "—"}</span>
        </div>
        <div class="data-row">
          <span class="lbl">Status</span>
          <span class="val" style="text-transform:capitalize;">${data.status || "—"}</span>
        </div>

        <div class="divider"></div>

        <div class="msg">
          Please wait for your token number to be called.
          ${data.clinicUrl ? `<div style="margin-top:4px;">Live status: <strong>${data.clinicUrl}</strong></div>` : ''}
        </div>

        <div class="divider"></div>

        <div class="data-row">
          <span class="lbl">Contact</span>
          <span class="val">${data.phone || "Not provided"}</span>
        </div>
        <div class="data-row">
          <span class="lbl">Address</span>
          <span class="val">${data.address || "Not provided"}</span>
        </div>
        ${data.hours ? `<div class="data-row"><span class="lbl">Hours</span><span class="val">${data.hours}</span></div>` : ''}

        <div class="divider"></div>
        <div class="footer-line">Powered by ClinicToken CMS</div>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=302,height=800,scrollbars=no')
    if (!printWindow) return
    printWindow.document.write(buildReceiptHTML())
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 800)
  }

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
                <div className="w-full bg-white text-black p-[8px_10px_7px_10px] border-b-2 border-black flex items-center justify-start gap-[8px]">
                  <svg className="w-[52px] h-[52px] shrink-0 block" xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 100 100" fill="none" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M50 35 C50 35 50 18 38 18 C26 18 22 30 22 38 C22 50 34 60 50 72 C66 60 78 50 78 38 C78 30 74 18 62 18 C50 18 50 35 50 35 Z" />
                    <polyline points="31,42 37,42 41,32 45,52 48,38 52,38 55,42 61,42" strokeWidth="3" />
                    <path d="M28 78 C26 90 34 94 42 94 L58 94 C66 94 74 90 72 78 L76 66 C78 60 74 56 70 58 L68 62 L67 46 C67 40 62 40 60 44 L59 50 L58 36 C58 30 52 30 50 34 L49 50 L48 40 C48 34 42 34 40 38 L39 62 C36 58 30 56 26 60 Z" />
                  </svg>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="text-[12px] font-bold leading-tight uppercase line-clamp-2">{data.clinicName}</div>
                    <div className="text-[8px] text-[#555] mt-[1px]">Healthcare Token System</div>
                  </div>
                </div>

                <div className="w-full">
                  {data.clinicUrl && (
                    <p className="text-[9px] text-[#555] break-all leading-normal text-center p-[4px_10px] w-full">
                      {data.clinicUrl}
                    </p>
                  )}

                  <div className="border-t border-dashed border-black mx-[10px] my-[3px] w-[calc(100%-20px)]" />
                  <p className="text-center font-bold text-[11px] tracking-[2px] py-[4px] w-full">TOKEN RECEIPT</p>
                  <div className="border-t border-dashed border-black mx-[10px] my-[3px] w-[calc(100%-20px)]" />

                  {/* Token number */}
                  <p className="text-center font-bold text-[44px] py-[3px] leading-[1.1] w-full">#{data.tokenNumber}</p>
                  <div className="border-t border-dashed border-black mx-[10px] my-[3px] w-[calc(100%-20px)]" />

                  {/* Details */}
                  <div className="space-y-0.5 w-full">
                    <div className="flex justify-between items-start px-[10px] py-[2px] text-[11px] w-full">
                      <span className="text-[#444] pr-[2px] min-w-[55px]">Patient</span>
                      <span className="font-bold text-right flex-1 break-words">{data.patientName}</span>
                    </div>
                    <div className="flex justify-between items-start px-[10px] py-[2px] text-[11px] w-full">
                      <span className="text-[#444] pr-[2px] min-w-[55px]">Doctor</span>
                      <span className="font-bold text-right flex-1 break-words">{data.doctorName}</span>
                    </div>
                    <div className="flex justify-between items-start px-[10px] py-[2px] text-[11px] w-full">
                      <span className="text-[#444] pr-[2px] min-w-[55px]">Spec</span>
                      <span className="font-bold text-right flex-1">{data.specialization}</span>
                    </div>
                    <div className="flex justify-between items-start px-[10px] py-[2px] text-[11px] w-full">
                      <span className="text-[#444] pr-[2px] min-w-[55px]">Date</span>
                      <span className="font-bold text-right flex-1">{data.dateTime}</span>
                    </div>
                    <div className="flex justify-between items-start px-[10px] py-[2px] text-[11px] w-full">
                      <span className="text-[#444] pr-[2px] min-w-[55px]">Status</span>
                      <span className="capitalize font-bold text-right flex-1">{data.status}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-black mx-[10px] my-[3px] w-[calc(100%-20px)]" />
                  <div className="text-center text-[10px] py-[4px] px-[10px] leading-[1.4] w-full space-y-1">
                    <p>Please wait for your token number to be called.</p>
                    {data.clinicUrl && (
                      <div className="pt-1">
                        <p className="text-[9px] text-[#555]">Live status: <strong>{data.clinicUrl}</strong></p>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-dashed border-black mx-[10px] my-[3px] w-[calc(100%-20px)]" />

                  {/* Contact */}
                  <div className="space-y-0.5 text-[10px] w-full">
                    <div className="flex justify-between items-start px-[10px] py-[2px] w-full">
                      <span className="text-[#444] pr-[2px] min-w-[55px]">Contact</span>
                      <span className="font-bold text-right flex-1 break-words">{data.phone}</span>
                    </div>
                    <div className="flex justify-between items-start px-[10px] py-[2px] w-full">
                      <span className="text-[#444] pr-[2px] min-w-[55px]">Address</span>
                      <span className="font-bold text-right flex-1 break-words">{data.address}</span>
                    </div>
                    {data.hours && (
                      <div className="flex justify-between items-start px-[10px] py-[2px] w-full">
                        <span className="text-[#444] pr-[2px] min-w-[55px]">Hours</span>
                        <span className="font-bold text-right flex-1 break-words">{data.hours}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-dashed border-black mx-[10px] my-[3px] w-[calc(100%-20px)]" />
                  <p className="text-center text-[9px] text-[#777] py-[5px] pb-[10px] w-full">Powered by ClinicToken CMS</p>
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
