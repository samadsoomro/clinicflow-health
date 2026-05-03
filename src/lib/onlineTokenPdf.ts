import jsPDF from 'jspdf';

const sanitizeStr = (str: string | null | undefined): string => {
  if (!str) return '';
  return str.replace(/،/g, ',').replace(/[^\x00-\x7F]/g, '');
};

const getHeartbeatIcon = async (): Promise<string> => {
  return new Promise<string>((resolve) => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100" height="100"><path fill="#000000" d="M320.2 243.8l-49.7 99.4c-6 12.1-23.4 11.7-28.9-.6l-56.9-126.3-30 71.7H60.6l50.2 50.2c46.9 46.9 122.7 46.9 169.6 0l50.2-50.2h-10.4zM448 86.6c-46.9-46.9-122.7-46.9-169.6 0L256 109l-22.4-22.4c-46.9-46.9-122.7-46.9-169.6 0-38.3 38.3-45.4 96.6-21.4 141.5H94.9l43-102.6c5.7-13.6 25-13.8 30.9-.4l56.8 126.1 49.8-99.6c5.9-11.8 22.8-12 28.9-.3l37 76.8h110.1c24-44.9 16.9-103.2-21.4-141.5z"/></svg>';
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
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

  // Header Left: Heartbeat Icon
  try {
    const iconDataUrl = await getHeartbeatIcon();
    doc.addImage(iconDataUrl, 'PNG', 5, y - 2, 10, 10);
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
    doc.setFontSize(9);
    doc.setTextColor(68, 68, 68);
    doc.text(label, 5, y);
    
    doc.setFont('courier', 'bold');
    doc.setTextColor(0, 0, 0);
    const splitVal = doc.splitTextToSize(sanitizeStr(value), 45);
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
    const splitVal = doc.splitTextToSize(sanitizeStr(value), 48);
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

  // Watermark
  doc.saveGraphicsState();
  const gState = new (doc as any).GState({ opacity: 0.15 });
  doc.setGState(gState);
  doc.setTextColor(29, 78, 216); // Blue watermark
  doc.setFontSize(38);
  doc.setFont('courier', 'bold');
  doc.text('ONLINE TOKEN', W / 2, 70, {
    angle: 45,
    align: 'center',
  });
  doc.restoreGraphicsState();

  doc.save(`online-token-${tokenData.token_number}.pdf`);
}
