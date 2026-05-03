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
  } else {
    y += 5;
  }

  doc.setTextColor(0, 0, 0);
  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  const clinicNameLines = doc.splitTextToSize(sanitizeStr(clinicData.clinic_name).toUpperCase(), W - 10);
  doc.text(clinicNameLines, W / 2, y, { align: 'center' });
  y += (clinicNameLines.length * 5) + 1;
  
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(85, 85, 85);
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
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('TOKEN RECEIPT', W / 2, y, { align: 'center', charSpace: 1 });
  y += 4;
  
  doc.line(5, y, W - 5, y);
  y += 10;

  // Token Number
  doc.setFontSize(44);
  doc.text(`#${tokenData.token_number}`, W / 2, y, { align: 'center' });
  y += 6;
  
  doc.line(5, y, W - 5, y);
  y += 6;

  // Detail Rows
  const drawRow = (label: string, value: string) => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(label, 6, y);
    
    doc.setFont('courier', 'bold');
    doc.setTextColor(0, 0, 0);
    const splitVal = doc.splitTextToSize(sanitizeStr(value), 45);
    doc.text(splitVal, W - 6, y, { align: 'right' });
    y += (splitVal.length * 4) + 1;
  };

  drawRow('Patient', tokenData.patient_name || 'Walk-in');
  if (tokenData.formatted_patient_id) {
    drawRow('Patient ID', tokenData.formatted_patient_id);
  }
  drawRow('Doctor', `Dr. ${tokenData.doctors?.name || '—'}`);
  drawRow('Specialization', tokenData.doctors?.specialization || '—');
  
  const dateObj = new Date(tokenData.created_at || new Date());
  const datePart = `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;
  
  let h = dateObj.getHours();
  const m = dateObj.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12;
  h = h ? h : 12;
  const timePart = `${h}:${m} ${ampm}`;
  const formattedDate = `${datePart} ${timePart}`;
  
  drawRow('Date', formattedDate);
  drawRow('Status', tokenData.status || 'waiting');

  y += 2;
  doc.line(5, y, W - 5, y);
  y += 6;

  // Message
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  const msg = "Please wait for your token number to be called.";
  const msgLines = doc.splitTextToSize(msg, W - 12);
  doc.text(msgLines, W / 2, y, { align: 'center' });
  y += (msgLines.length * 4) + 2;

  if (clinicData.qr_base_url) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.text('Live status:', W / 2, y, { align: 'center' });
    y += 4;
    doc.setFont('courier', 'bold');
    doc.text(clinicData.qr_base_url, W / 2, y, { align: 'center' });
    y += 6;
  }

  doc.line(5, y, W - 5, y);
  y += 6;

  // Contact Info
  const drawSmallRow = (label: string, value: string) => {
    if (!value) return;
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(label, 6, y);
    
    doc.setFont('courier', 'bold');
    doc.setTextColor(0, 0, 0);
    const splitVal = doc.splitTextToSize(sanitizeStr(value), 50);
    doc.text(splitVal, W - 6, y, { align: 'right' });
    y += (splitVal.length * 4);
  };

  drawSmallRow('Contact', clinicData.contact_phone || 'Not provided');
  drawSmallRow('Address', clinicData.address || 'Not provided');
  drawSmallRow('Hours', clinicData.working_hours || '');

  y += 4;
  doc.line(5, y, W - 5, y);
  y += 6;

  // Footer
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Powered by ClinicToken CMS', W / 2, y, { align: 'center' });

  // -- WATERMARK --
  doc.saveGraphicsState();
  const gState = new (doc as any).GState({ opacity: 0.15 });
  doc.setGState(gState);
  doc.setTextColor('#1d4ed8');
  doc.setFontSize(40);
  doc.setFont('courier', 'bold');
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
