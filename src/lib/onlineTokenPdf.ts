import jsPDF from 'jspdf';

// Helper to remove PDF-breaking characters from dynamic data
const sanitizeStr = (str: string | null | undefined): string => {
  if (!str) return '';
  return str
    .replace(/،/g, ',') // Replace Arabic comma with ASCII comma
    .replace(/[^\x00-\x7F]/g, ''); // Remove any other non-ASCII characters
};

export async function generateOnlineTokenPDF(tokenData: any, clinicData: any) {
  // Thermal paper size: 80mm wide, dynamic height (auto-estimated here)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 160] 
  });

  const W = 80;
  let y = 10;

  // -- LOGO & HEADER --
  if (clinicData.logo_url) {
    try {
      const response = await fetch(clinicData.logo_url);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      doc.addImage(base64, 'PNG', (W - 15) / 2, y, 15, 15);
      y += 18;
    } catch {
      y += 5;
    }
  }

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(sanitizeStr(clinicData.clinic_name).toUpperCase(), W / 2, y, { align: 'center' });
  y += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('Healthcare Token System', W / 2, y, { align: 'center' });
  y += 6;

  if (clinicData.qr_base_url) {
    doc.setFontSize(7);
    doc.text(clinicData.qr_base_url, W / 2, y, { align: 'center' });
    y += 5;
  }

  // Divider
  doc.setDrawColor(0, 0, 0);
  doc.setLineDashPattern([2, 1], 0);
  doc.line(5, y, W - 5, y);
  y += 6;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ONLINE TOKEN RECEIPT', W / 2, y, { align: 'center', charSpace: 1 });
  y += 4;
  
  doc.line(5, y, W - 5, y);
  y += 10;

  // Token Number
  doc.setFontSize(40);
  doc.text(`#${tokenData.token_number}`, W / 2, y, { align: 'center' });
  y += 6;
  
  doc.line(5, y, W - 5, y);
  y += 10;

  // Detail Rows
  const drawRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(label, 8, y);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const splitVal = doc.splitTextToSize(sanitizeStr(value), 40);
    doc.text(splitVal, W - 8, y, { align: 'right' });
    y += (splitVal.length * 4) + 2;
  };

  drawRow('Patient', tokenData.patient_name || '—');
  if (tokenData.formatted_patient_id) {
    drawRow('Patient ID', tokenData.formatted_patient_id);
  }
  drawRow('Doctor', `Dr. ${tokenData.doctors?.name || '—'}`);
  drawRow('Specialization', tokenData.doctors?.specialization || '—');
  
  const formattedDate = new Date(tokenData.created_at || new Date()).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).replace(',', '');
  
  drawRow('Date', formattedDate);
  drawRow('Status', tokenData.status || 'waiting');

  y += 2;
  doc.line(5, y, W - 5, y);
  y += 6;

  // Message
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  const msg = "Please be present when your token number is called. Check live tokens for updates.";
  const msgLines = doc.splitTextToSize(msg, W - 16);
  doc.text(msgLines, W / 2, y, { align: 'center' });
  y += (msgLines.length * 4) + 2;

  doc.line(5, y, W - 5, y);
  y += 8;

  // Contact Info
  const drawSmallRow = (label: string, value: string) => {
    if (!value) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(label, 8, y);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const splitVal = doc.splitTextToSize(sanitizeStr(value), 45);
    doc.text(splitVal, W - 8, y, { align: 'right' });
    y += (splitVal.length * 4);
  };

  drawSmallRow('Contact', clinicData.contact_phone || '—');
  drawSmallRow('Address', clinicData.address || '—');
  drawSmallRow('Hours', clinicData.working_hours || '—');

  y += 4;
  doc.line(5, y, W - 5, y);
  y += 6;

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Powered by ClinicToken CMS', W / 2, y, { align: 'center' });

  // -- WATERMARK --
  doc.saveGraphicsState();
  const gState = new (doc as any).GState({ opacity: 0.15 });
  doc.setGState(gState);
  doc.setTextColor('#1d4ed8');
  doc.setFontSize(40);
  doc.setFont('helvetica', 'bold');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.text('ONLINE TOKEN', pageWidth / 2, pageHeight / 2, {
    angle: 45,
    align: 'center',
  });
  doc.restoreGraphicsState();

  // Save
  doc.save(`online-token-${tokenData.token_number}.pdf`);
}
