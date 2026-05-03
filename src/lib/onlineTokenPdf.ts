import jsPDF from 'jspdf';

const sanitizeStr = (str: string | null | undefined): string => {
  if (!str) return '';
  return str.replace(/،/g, ',').replace(/[^\x00-\x7F]/g, '');
};

const getHeaderIcon = async (): Promise<string> => {
  return new Promise<string>((resolve) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>`;
    const img = new Image();
    img.onload = () => {
      const size = 1024;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw crisp circle border
        ctx.beginPath();
        ctx.arc(size/2, size/2, (size/2) - 40, 0, 2 * Math.PI);
        ctx.lineWidth = 50;
        ctx.strokeStyle = "black";
        ctx.stroke();
        
        // Draw Lucide Activity SVG centered
        const padding = 220;
        ctx.drawImage(img, padding, padding, size - (padding*2), size - (padding*2));
      }
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svg);
  });
};

export async function generateOnlineTokenPDF(tokenData: any, clinicData: any) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 160]
  });

  const W = 80;
  let y = 10;

  // Add blue border around the slip
  doc.setDrawColor(29, 78, 216); // blue-700
  doc.setLineWidth(0.6);
  doc.rect(2, 2, W - 4, 156);

  // Watermark (Drawn early so it's beneath text)
  doc.saveGraphicsState();
  const gState = new (doc as any).GState({ opacity: 0.12 });
  doc.setGState(gState);
  doc.setTextColor(220, 38, 38); // Red watermark
  doc.setFontSize(12);
  doc.setFont('courier', 'bold');
  // Multiple horizontal small watermarks
  doc.text('ONLINE TOKEN   ONLINE TOKEN', W / 2, 45, { align: 'center' });
  doc.text('ONLINE TOKEN   ONLINE TOKEN', W / 2, 85, { align: 'center' });
  doc.text('ONLINE TOKEN   ONLINE TOKEN', W / 2, 125, { align: 'center' });
  doc.restoreGraphicsState();

  // Header Left: Heartbeat Icon
  try {
    const iconDataUrl = await getHeaderIcon();
    doc.addImage(iconDataUrl, 'PNG', 5, y - 2, 11, 11);
  } catch (err) {
    // silently skip icon if generation fails
  }

  // Header Right: Clinic Name & Subtitle
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const clinicName = sanitizeStr(clinicData.clinic_name || 'CLINIC').toUpperCase();
  const nameLines = doc.splitTextToSize(clinicName, W - 25);
  doc.text(nameLines, 18, y + 1);
  
  y += (nameLines.length * 4) - 1;
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(85, 85, 85);
  doc.text('Healthcare Token System', 18, y);
  
  y += 5;

  if (clinicData.qr_base_url) {
    doc.setFontSize(7);
    doc.text(clinicData.qr_base_url, W / 2, y, { align: 'center' });
    y += 4;
  }

  const drawDashedLine = (yPos: number) => {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(4, yPos, W - 4, yPos);
  };

  drawDashedLine(y);
  y += 5;

  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('TOKEN RECEIPT', W / 2, y, { align: 'center', charSpace: 1 });
  y += 3;
  
  drawDashedLine(y);
  y += 10;

  doc.setFontSize(40);
  doc.text(`#${tokenData.token_number}`, W / 2, y, { align: 'center' });
  y += 5;
  
  drawDashedLine(y);
  y += 6;

  const drawRow = (label: string, value: string) => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(68, 68, 68);
    doc.text(label, 5, y);
    
    doc.setFont('courier', 'bold');
    doc.setTextColor(0, 0, 0);
    const splitVal = doc.splitTextToSize(sanitizeStr(value), 52);
    doc.text(splitVal, W - 5, y, { align: 'right' });
    y += (splitVal.length * 4) + 1;
  };

  const d = new Date(tokenData.created_at || new Date());
  const dateStr = `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getFullYear()}`;
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12;
  h = h ? h : 12;
  const timePart = `${h}:${m} ${ampm}`;
  const dateTime = `${dateStr}  ${timePart}`;

  drawRow('Patient', tokenData.patient_name || 'Walk-in');
  drawRow('Doctor', tokenData.doctors?.name ? `Dr. ${tokenData.doctors.name}` : '—');
  drawRow('Specialization', tokenData.doctors?.specialization || '—');
  drawRow('Date', dateTime);
  
  const statusStr = (tokenData.status || 'waiting');
  const capStatus = statusStr.charAt(0).toUpperCase() + statusStr.slice(1);
  drawRow('Status', capStatus);

  y += 1;
  drawDashedLine(y);
  y += 5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  const msg = "Please wait for your token number to be called.";
  const msgLines = doc.splitTextToSize(msg, W - 10);
  doc.text(msgLines, W / 2, y, { align: 'center' });
  y += (msgLines.length * 4) + 1;

  if (clinicData.qr_base_url) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.text('Live status:', W / 2, y, { align: 'center' });
    y += 4;
    doc.setFont('courier', 'bold');
    doc.text(clinicData.qr_base_url, W / 2, y, { align: 'center' });
    y += 5;
  }

  drawDashedLine(y);
  y += 5;

  const drawSmallRow = (label: string, value: string) => {
    if (!value) return;
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(68, 68, 68);
    doc.text(label, 5, y);
    
    doc.setFont('courier', 'bold');
    doc.setTextColor(0, 0, 0);
    const splitVal = doc.splitTextToSize(sanitizeStr(value), 52);
    doc.text(splitVal, W - 5, y, { align: 'right' });
    y += (splitVal.length * 4);
  };

  drawSmallRow('Contact', clinicData.contact_phone || 'Not provided');
  drawSmallRow('Address', clinicData.address || 'Not provided');
  drawSmallRow('Hours', clinicData.working_hours || '');

  y += 3;
  drawDashedLine(y);
  y += 5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(119, 119, 119);
  doc.text('Powered by ClinicToken CMS', W / 2, y, { align: 'center' });

  doc.save(`online-token-${tokenData.token_number}.pdf`);
}
