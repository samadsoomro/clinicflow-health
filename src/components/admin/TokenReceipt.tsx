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

const HEALTHCARE_ICON = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhUSEhIWFRUVFRgWFRUVGBgYFRUVFRIXFhUXFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKBQUFDgUFDisZExkrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrK//AABEIAioCKgMBIgACEQEDEQH/xAAcAAACAgMBAQAAAAAAAAAAAAADBAACAQcIBgX/xABWEAABAgMEBwYDBAQLBAkDBQEBAAIDESEEEjFRBRMUMkFhcQY//+11v/656N/2+y/10P8AErkJRB1/F7caMII/6Rsv9cz/ABS//XPRv+32X+uh/wCK5CUQdId6vbWxuxUeFZ7XBiRYlyGGw4jXOumI0vo04XA4ea50e3iMOIy/yQlZjpYIN9/o72C7ZbRHl/GRmsBzbCZP0nEPoty3hmvJd1eitm0VZmESc6HrXToZxiYkiOQcB5L7wCA1oxWIG8jWbd81LTuoCXhmk3CppxVJJ5mA6IA2ak5osRwkehQrXw80FmI6/FCEuSbYf9U9+izH+ke7e9X6Sfevov8UnH/AKUv3nvExXrx4ifV998XvvXxHr779T4j1979SfUX/Gfj96fvd/xH0Y8R+L1fifUj4pXq9X3vUn6vVD+6T6o4gfevV68fA+9fSpWp//Z`;

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
          html {
            width: 80mm;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            color: #000;
            background: #fff;
            width: 80mm;
            max-width: 80mm;
            min-width: 80mm;
            overflow-x: hidden;
            word-wrap: break-word;
          }
          .receipt-header {
            width: 80mm;
            background: #fff;
            color: #000;
            padding: 3mm 4mm 2mm 4mm;
            border-bottom: 1.5px solid #000;
            box-sizing: border-box;
          }
          .icon-row {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 3mm;
          }
          .health-icon {
            width: 14mm;
            height: 14mm;
            object-fit: contain;
            flex-shrink: 0;
          }
          .header-text {
            display: flex;
            flex-direction: column;
            justify-content: center;
            max-width: 52mm;
          }
          .clinic-name-header {
            font-size: 12px;
            font-weight: bold;
            letter-spacing: 0.5px;
            color: #000;
            line-height: 1.2;
            word-break: break-word;
          }
          .clinic-sub {
            font-size: 8px;
            color: #555;
            margin-top: 1px;
          }
          .website {
            font-size: 9px;
            text-align: center;
            color: #555;
            padding: 2px 4mm;
            word-break: break-all;
            width: 80mm;
            box-sizing: border-box;
          }
          .divider {
            border: none;
            border-top: 1px dashed #000;
            margin: 3px 4mm;
            width: calc(80mm - 8mm);
          }
          .receipt-title {
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 2px;
            margin: 3px 0;
            width: 80mm;
          }
          .token-number {
            font-size: 44px;
            font-weight: bold;
            text-align: center;
            line-height: 1;
            margin: 3px 0;
            width: 80mm;
          }
          .row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 1.5px 4mm;
            font-size: 11px;
            width: 80mm;
            box-sizing: border-box;
          }
          .row .label {
            color: #333;
            white-space: nowrap;
            flex-shrink: 0;
            min-width: 16mm;
            margin-right: 2mm;
          }
          .row .value {
            font-weight: bold;
            text-align: right;
            word-break: break-word;
            max-width: 48mm;
          }
          .message {
            text-align: center;
            font-size: 10px;
            padding: 2px 4mm;
            line-height: 1.4;
            word-break: break-word;
            width: 80mm;
            box-sizing: border-box;
          }
          .footer {
            text-align: center;
            font-size: 9px;
            color: #666;
            padding: 4px 0 5mm 0;
            width: 80mm;
          }
          @media print {
            html, body { width: 80mm; max-width: 80mm; }
            @page { size: 80mm auto; margin: 0; }
          }
        </style>
      </head>
      <body>
        <!-- WHITE HEADER WITH ICON + CLINIC NAME -->
        <div class="receipt-header">
          <div class="icon-row">
            <img class="health-icon" src="${HEALTHCARE_ICON}" alt="healthcare icon" />
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

    const printWindow = window.open('', '_blank', 'width=340,height=750');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 800);
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
                <div className="w-[80mm] bg-white text-black p-[3mm_4mm_2mm_4mm] mb-[2px] border-b-[1.5px] border-black flex items-center justify-start gap-[3mm]">
                  <img className="w-[14mm] h-[14mm] object-contain shrink-0" src={HEALTHCARE_ICON} alt="healthcare icon" />
                  <div className="flex flex-col justify-center max-w-[52mm]">
                    <div className="text-[12px] font-bold tracking-[0.5px] leading-tight uppercase line-clamp-2">{data.clinicName}</div>
                    <div className="text-[8px] text-gray-500 mt-[1px]">Healthcare Token System</div>
                  </div>
                </div>

                <div className="px-[4mm] pb-[4mm]">
                  {data.clinicUrl && (
                    <p className="text-[9px] text-gray-400 break-all leading-normal text-center mt-2">
                      {data.clinicUrl}
                    </p>
                  )}

                  <div className="border-t border-dashed border-black my-3" />
                  <p className="text-center font-bold text-[11px] tracking-[2px]">TOKEN RECEIPT</p>
                  <div className="border-t border-dashed border-black my-3" />

                  {/* Token number */}
                  <p className="text-center font-bold text-[44px] my-3 leading-none">#{data.tokenNumber}</p>
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
                    <div className="flex justify-between items-start text-[11px]">
                      <span className="text-gray-500 pr-2 min-w-[16mm]">Spec</span>
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
