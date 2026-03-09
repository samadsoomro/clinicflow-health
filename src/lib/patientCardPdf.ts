import jsPDF from 'jspdf';

// Helper to remove PDF-breaking characters from dynamic data
const sanitizeStr = (str: string | null | undefined): string => {
  if (!str) return '';
  return str
    .replace(/،/g, ',') // Replace Arabic comma with ASCII comma
    .replace(/[^\x00-\x7F]/g, ''); // Remove any other non-ASCII characters
};

export async function generatePatientCardPDF(patient: any, clinic: any) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [105, 148]  // A6 portrait
  });

  const bgColor = clinic.card_background_color || '#1e293b';
  const accentColor = clinic.theme_color || '#0ea5e9';
  const W = 105;
  const topH = 82;  // dark section height

  // Helper: hex to RGB
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const bg = hexToRgb(bgColor);
  const ac = hexToRgb(accentColor);

  // -- TOP SECTION (dark background) --
  doc.setFillColor(bg.r, bg.g, bg.b);
  doc.rect(0, 0, W, topH, 'F');

  // Logo or initials box (top-left)
  const logoSize = 14;
  const logoX = 8;
  const logoY = 8;

  if (clinic.logo_url) {
    try {
      // Fetch logo as base64
      const response = await fetch(clinic.logo_url);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      doc.addImage(base64, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch {
      // fallback: colored box with initials
      doc.setFillColor(ac.r, ac.g, ac.b);
      doc.roundedRect(logoX, logoY, logoSize, logoSize, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(sanitizeStr(clinic.short_name)?.slice(0, 3) || 'CL', logoX + logoSize / 2, logoY + logoSize / 2 + 2, { align: 'center' });
    }
  } else {
    doc.setFillColor(ac.r, ac.g, ac.b);
    doc.roundedRect(logoX, logoY, logoSize, logoSize, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(sanitizeStr(clinic.short_name)?.slice(0, 3) || 'CL', logoX + logoSize / 2, logoY + logoSize / 2 + 2, { align: 'center' });
  }

  // Clinic short name and subtitle (next to logo)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(sanitizeStr(clinic.short_name) || 'CLINIC', logoX + logoSize + 3, logoY + 5);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text('Health Identity Card', logoX + logoSize + 3, logoY + 10);

  // QR code (top-right) - fetch from QR API
  if (clinic.qr_base_url) {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(clinic.qr_base_url)}`;
      const qrResponse = await fetch(qrUrl);
      const qrBlob = await qrResponse.blob();
      const qrBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(qrBlob);
      });
      doc.addImage(qrBase64, 'PNG', W - 24, 6, 18, 18);
    } catch {
      // skip QR if fetch fails
    }
  }

  // Divider line
  doc.setDrawColor(ac.r, ac.g, ac.b);
  doc.setLineWidth(0.3);
  doc.line(8, 28, W - 8, 28);

  // Patient fields (2-column grid)
  const fields = [
    { label: 'PATIENT NAME', value: sanitizeStr(patient.full_name) },
    { label: 'PATIENT ID', value: sanitizeStr(patient.patient_id || patient.formatted_patient_id || patient.id), accent: true },
    { label: 'AGE', value: String(patient.age) },
    { label: 'GENDER', value: sanitizeStr(patient.gender) },
    { label: 'REGISTERED', value: new Date(patient.created_at).toLocaleDateString('en-GB') },
  ];

  let y = 34;
  const colW = (W - 16) / 2;

  fields.forEach((field, i) => {
    const cx = i % 2 === 0 ? 8 : 8 + colW;
    const cy = y + Math.floor(i / 2) * 14;

    // Label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 180, 200);
    doc.text(field.label, cx, cy);

    // Value
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    if (field.accent) {
      doc.setTextColor(ac.r, ac.g, ac.b);
    } else {
      doc.setTextColor(255, 255, 255);
    }
    doc.text(field.value || '-', cx, cy + 5);
  });

  // -- BOTTOM SECTION (white) --
  doc.setFillColor(255, 255, 255);
  doc.rect(0, topH, W, 148 - topH, 'F');

  let bottomY = topH + 8;

  // Terms & Conditions
  if (clinic.terms_conditions) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Terms & Conditions', 8, bottomY);
    bottomY += 5;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const sanitizedTerms = sanitizeStr(clinic.terms_conditions);
    const termsLines = doc.splitTextToSize(sanitizedTerms, W - 16);
    doc.text(termsLines, 8, bottomY);
    bottomY += termsLines.length * 3.5 + 4;
  }

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(8, bottomY, W - 8, bottomY);
  bottomY += 5;

  // Contact info
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  if (clinic.address) {
    const sanitizedAddr = sanitizeStr(clinic.address);
    const addressLines = doc.splitTextToSize(`Address: ${sanitizedAddr}`, W - 16);
    doc.text(addressLines, 8, bottomY);
    bottomY += addressLines.length * 3.5 + 1;
  }
  if (clinic.contact_phone) {
    const sanitizedPhone = sanitizeStr(clinic.contact_phone);
    doc.text(`Phone: ${sanitizedPhone}`, 8, bottomY);
    bottomY += 4;
  }
  if (clinic.contact_email) {
    const sanitizedEmail = sanitizeStr(clinic.contact_email);
    doc.text(`Email: ${sanitizedEmail}`, 8, bottomY);
    bottomY += 4;
  }
  if (clinic.working_hours) {
    const sanitizedHours = sanitizeStr(clinic.working_hours);
    const hoursLines = doc.splitTextToSize(`Hours: ${sanitizedHours}`, W - 16);
    doc.text(hoursLines, 8, bottomY);
    bottomY += hoursLines.length * 3.5 + 1;
  }

  // Footer
  doc.setFontSize(6);
  doc.setTextColor(170, 170, 170);
  doc.setFont('helvetica', 'normal');
  const footerText = 'VALIDATED DIGITAL HEALTH RECORD';
  const footerW = doc.getTextWidth(footerText);
  doc.text(footerText, (W - footerW) / 2, 144);

  // Save
  const shortName = sanitizeStr(clinic.short_name) || 'clinic';
  doc.save(`PatientCard-${patient.patient_id || patient.formatted_patient_id || patient.id}-${shortName}.pdf`);
}
