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
    format: [105, 148]  // A6 portrait (105mm wide x 148mm tall)
  });

  const bgColor = clinic.card_background_color || '#1e293b';
  const accentColor = clinic.theme_color || '#0ea5e9';
  
  // Mathematically symmetric card sizing (Standard CR80 aspect ratio)
  const W_card = 90;
  const H_card = 56;
  
  // Symmetrical placement: Centered horizontally (7.5mm margins) and vertically split at 74mm center
  const cardX = 7.5;
  const frontY = 9;  // Front card (y: 9mm to 65mm)
  const backY = 83;  // Back card (y: 83mm to 139mm)

  // Helper: hex to RGB
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  const bg = hexToRgb(bgColor);
  const ac = hexToRgb(accentColor);

  // Custom high-fidelity vector icons drawing engine
  const drawMapPin = (x: number, y: number) => {
    doc.setFillColor(ac.r, ac.g, ac.b);
    doc.ellipse(x + 1.5, y + 1.5, 1.2, 1.2, 'F'); // Pin head circle
    doc.triangle(x + 0.6, y + 2.0, x + 2.4, y + 2.0, x + 1.5, y + 3.8, 'F'); // Pin point arrow
    doc.setFillColor(255, 255, 255);
    doc.ellipse(x + 1.5, y + 1.5, 0.4, 0.4, 'F'); // Central pin hollow dot
  };

  const drawPhone = (x: number, y: number) => {
    doc.setFillColor(ac.r, ac.g, ac.b);
    doc.roundedRect(x + 0.6, y + 0.4, 1.8, 3.6, 0.3, 0.3, 'F'); // Smartdevice rounded body
    doc.setFillColor(255, 255, 255);
    doc.rect(x + 0.8, y + 0.7, 1.4, 2.3, 'F'); // Device white screen
    doc.setFillColor(ac.r, ac.g, ac.b);
    doc.ellipse(x + 1.5, y + 3.4, 0.15, 0.15, 'F'); // Home circular button
  };

  const drawEnvelope = (x: number, y: number) => {
    doc.setFillColor(ac.r, ac.g, ac.b);
    doc.rect(x + 0.2, y + 0.8, 2.6, 1.8, 'F'); // Main envelope rect body
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.2);
    doc.line(x + 0.2, y + 0.8, x + 1.5, y + 1.7); // Flap fold line 1
    doc.line(x + 2.8, y + 0.8, x + 1.5, y + 1.7); // Flap fold line 2
  };

  const drawClock = (x: number, y: number) => {
    doc.setDrawColor(ac.r, ac.g, ac.b);
    doc.setLineWidth(0.35);
    doc.ellipse(x + 1.5, y + 1.5, 1.3, 1.3, 'D'); // Outer dial outline
    doc.line(x + 1.5, y + 1.5, x + 1.5, y + 0.8); // Hour hand pointing straight up
    doc.line(x + 1.5, y + 1.5, x + 2.1, y + 1.5); // Minute hand pointing right
  };

  // ==========================================
  // 1. FRONT CARD (Top half, dark background)
  // ==========================================
  doc.setFillColor(bg.r, bg.g, bg.b);
  doc.roundedRect(cardX, frontY, W_card, H_card, 4, 4, 'F');

  // Subtle Accent Bar at the top of the card
  doc.setFillColor(ac.r, ac.g, ac.b);
  doc.rect(cardX, frontY, W_card, 2, 'F');

  // Header Logo or Initials (Left side)
  const logoSize = 10;
  const logoX = cardX + 6;
  const logoY = frontY + 6;

  if (clinic.logo_url) {
    try {
      const response = await fetch(clinic.logo_url);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      doc.addImage(base64, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch {
      doc.setFillColor(ac.r, ac.g, ac.b);
      doc.roundedRect(logoX, logoY, logoSize, logoSize, 1.5, 1.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.text(sanitizeStr(clinic.short_name)?.slice(0, 3) || 'CL', logoX + logoSize / 2, logoY + logoSize / 2 + 1.8, { align: 'center' });
    }
  } else {
    doc.setFillColor(ac.r, ac.g, ac.b);
    doc.roundedRect(logoX, logoY, logoSize, logoSize, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.text(sanitizeStr(clinic.short_name)?.slice(0, 3) || 'CL', logoX + logoSize / 2, logoY + logoSize / 2 + 1.8, { align: 'center' });
  }

  // Clinic Title & Subtitle next to Logo
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const shortName = sanitizeStr(clinic.short_name) || 'CLINIC';
  doc.text(shortName, logoX + logoSize + 2.5, logoY + 4);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 210, 220);
  doc.text('Health Identity Card', logoX + logoSize + 2.5, logoY + 8);

  // QR Code (Right side)
  if (clinic.qr_base_url) {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(clinic.qr_base_url)}`;
      const qrResponse = await fetch(qrUrl);
      const qrBlob = await qrResponse.blob();
      const qrBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(qrBlob);
      });
      doc.addImage(qrBase64, 'PNG', cardX + W_card - 18, frontY + 5, 12, 12);
    } catch {
      // skip
    }
  }

  // Symmetrical White Divider line
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.line(cardX + 6, frontY + 18, cardX + W_card - 6, frontY + 18);

  // Front Info Layout
  const frontFields = [
    { label: 'PATIENT NAME', value: sanitizeStr(patient.full_name) },
    { label: 'PATIENT ID', value: sanitizeStr(patient.patient_id || patient.formatted_patient_id || patient.id), accent: true },
    { label: 'AGE / GENDER', value: `${patient.age} / ${sanitizeStr(patient.gender)}` },
    { label: 'REGISTERED', value: new Date(patient.created_at).toLocaleDateString('en-GB') }
  ];

  let col1X = cardX + 6;
  let col2X = cardX + W_card / 2 + 2;
  
  // Row 1 (Name & ID)
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(170, 190, 210);
  doc.text(frontFields[0].label, col1X, frontY + 23);
  doc.text(frontFields[1].label, col2X, frontY + 23);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(frontFields[0].value, col1X, frontY + 27);
  doc.setFillColor(ac.r, ac.g, ac.b);
  doc.setTextColor(ac.r, ac.g, ac.b);
  doc.text(frontFields[1].value, col2X, frontY + 27);

  // Row 2 (Age/Gender & Registered Date)
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(170, 190, 210);
  doc.text(frontFields[2].label, col1X, frontY + 34);
  doc.text(frontFields[3].label, col2X, frontY + 34);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(frontFields[2].value, col1X, frontY + 38);
  doc.text(frontFields[3].value, col2X, frontY + 38);

  // Validated stamp in front card
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(150, 170, 190);
  const vText = 'VALIDATED DIGITAL HEALTH RECORD';
  const vTextW = doc.getTextWidth(vText);
  doc.text(vText, cardX + (W_card - vTextW) / 2, frontY + 49);


  // ==========================================
  // 2. BACK CARD (Bottom half, white background)
  // ==========================================
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(210, 215, 220);
  doc.setLineWidth(0.35);
  doc.roundedRect(cardX, backY, W_card, H_card, 4, 4, 'FD');

  let bottomY = backY + 6;

  // Terms & Conditions
  if (clinic.terms_conditions) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 50, 60);
    doc.text('Terms & Conditions', cardX + 6, bottomY);
    bottomY += 3.8;

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 110, 120);
    const sanitizedTerms = sanitizeStr(clinic.terms_conditions);
    const termsLines = doc.splitTextToSize(sanitizedTerms, W_card - 12);
    doc.text(termsLines, cardX + 6, bottomY);
    bottomY += termsLines.length * 3 + 2;
  }

  // Divider
  doc.setDrawColor(230, 235, 240);
  doc.setLineWidth(0.2);
  doc.line(cardX + 6, bottomY, cardX + W_card - 6, bottomY);
  bottomY += 3.5;

  // Vector Contact Icons & Values List
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 90, 100);

  if (clinic.address) {
    drawMapPin(cardX + 6, bottomY);
    const sanitizedAddr = sanitizeStr(clinic.address);
    const addressLines = doc.splitTextToSize(sanitizedAddr, W_card - 18);
    doc.text(addressLines, cardX + 11, bottomY + 2.5);
    bottomY += addressLines.length * 3.2 + 1.2;
  }
  if (clinic.contact_phone) {
    drawPhone(cardX + 6, bottomY);
    doc.text(sanitizeStr(clinic.contact_phone), cardX + 11, bottomY + 2.5);
    bottomY += 4.5;
  }
  if (clinic.contact_email) {
    drawEnvelope(cardX + 6, bottomY);
    doc.text(sanitizeStr(clinic.contact_email), cardX + 11, bottomY + 2.5);
    bottomY += 4.5;
  }
  if (clinic.working_hours) {
    drawClock(cardX + 6, bottomY);
    const sanitizedHours = sanitizeStr(clinic.working_hours);
    const hoursLines = doc.splitTextToSize(sanitizedHours, W_card - 18);
    doc.text(hoursLines, cardX + 11, bottomY + 2.5);
    bottomY += hoursLines.length * 3.2 + 1.2;
  }

  // Validated stamp in back card
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(170, 180, 190);
  doc.text(vText, cardX + (W_card - vTextW) / 2, backY + 50);


  // ==========================================
  // 3. FOLDING/CUTTING DOTTED GUIDE LINE
  // ==========================================
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(0, 74, 105, 74); // Exact center line in landscape-cut folding orientation
  doc.setLineDashPattern([], 0);


  // Save PDF
  const nameSlug = sanitizeStr(clinic.short_name) || 'clinic';
  doc.save(`PatientCard-${patient.patient_id || patient.formatted_patient_id || patient.id}-${nameSlug}.pdf`);
}
