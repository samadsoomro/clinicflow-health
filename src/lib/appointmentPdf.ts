import jsPDF from 'jspdf';

const sanitizeStr = (str: string | null | undefined): string => {
  if (!str) return '';
  return str.replace(/،/g, ',').replace(/[^\x00-\x7F]/g, '');
};

const getHeaderIcon = async (): Promise<string> => {
  return new Promise<string>((resolve) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`; // Calendar icon
    const img = new Image();
    img.onload = () => {
      const size = 1024;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.arc(size/2, size/2, (size/2) - 40, 0, 2 * Math.PI);
        ctx.lineWidth = 50;
        ctx.strokeStyle = "black";
        ctx.stroke();
        
        const padding = 220;
        ctx.drawImage(img, padding, padding, size - (padding*2), size - (padding*2));
      }
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svg);
  });
};

export async function generateAppointmentPDF(appointmentData: any, clinicData: any, clinicShortName?: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 160]
  });

  const W = 80;
  let y = 10;

  // Purple border
  doc.setDrawColor(124, 58, 237); // purple-600
  doc.setLineWidth(0.6);
  doc.rect(2, 2, W - 4, 156);

  // Watermark
  doc.saveGraphicsState();
  const gState = new (doc as any).GState({ opacity: 0.12 });
  doc.setGState(gState);
  doc.setTextColor(124, 58, 237); 
  doc.setFontSize(12);
  doc.setFont('courier', 'bold');
  doc.text('APPOINTMENT   APPOINTMENT', W / 2, 45, { align: 'center', angle: -30 });
  doc.text('APPOINTMENT   APPOINTMENT', W / 2, 85, { align: 'center', angle: -30 });
  doc.text('APPOINTMENT   APPOINTMENT', W / 2, 125, { align: 'center', angle: -30 });
  doc.restoreGraphicsState();

  try {
    const iconDataUrl = await getHeaderIcon();
    doc.addImage(iconDataUrl, 'PNG', 5, y - 2, 11, 11);
  } catch (err) {}

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
  doc.text('Healthcare Appointment System', 18, y);
  
  y += 5;

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
  doc.text('APPOINTMENT SLIP', W / 2, y, { align: 'center', charSpace: 1 });
  y += 3;
  
  drawDashedLine(y);
  y += 10;

  doc.setFontSize(28);
  doc.text(`${appointmentData.appointment_ref}`, W / 2, y, { align: 'center' });
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

  const d = new Date(appointmentData.appointment_date);
  const dateStr = d.toLocaleDateString('en-PK', { weekday:'short', day:'numeric', month:'short' });
  
  const [h, m] = appointmentData.appointment_time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const timeStr = `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;

  drawRow('Patient', appointmentData.patient_name || 'Unknown');
  drawRow('Doctor', appointmentData.doctors?.name || '—');
  drawRow('Specialization', appointmentData.doctors?.specialization || '—');
  drawRow('Date', dateStr);
  drawRow('Time', timeStr);
  
  const statusStr = (appointmentData.status || 'pending');
  const capStatus = statusStr.charAt(0).toUpperCase() + statusStr.slice(1);
  drawRow('Status', capStatus);

  y += 1;
  drawDashedLine(y);
  y += 5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  const msg = "Please present this slip at the clinic reception on your appointment day.";
  const msgLines = doc.splitTextToSize(msg, W - 10);
  doc.text(msgLines, W / 2, y, { align: 'center' });
  y += (msgLines.length * 4) + 1;

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

  y += 3;
  drawDashedLine(y);
  y += 5;

  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(124, 58, 237); 
  doc.text('Powered by ClinicFlow CMS', W / 2, y, { align: 'center' });

  // Build filename
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const hours24 = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const fileAmpm = hours24 >= 12 ? 'PM' : 'AM';
  const hours12_f = (hours24 % 12 || 12).toString().padStart(2, '0');
  const fileTimePart = `${hours12_f}${minutes}${fileAmpm}`;

  const shortName = ((clinicShortName || clinicData?.short_name || clinicData?.clinic_name || 'CLN')
    .replace(/\s+/g, '')
    .toUpperCase()
    .slice(0, 10));

  const filename = `appointment-${appointmentData.appointment_ref}-${shortName}-${datePart}-${fileTimePart}.pdf`;
  doc.save(filename);
}
