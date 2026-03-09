import jsPDF from 'jspdf'

export const generatePatientCardPDF = async (patient: any, clinic: any) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85, 54]  // Standard ID card size (CR80)
  })

  const w = 85
  const h = 54

  // Top dark section background
  doc.setFillColor(20, 80, 70)
  doc.rect(0, 0, w, h * 0.55, 'F')

  // Bottom white section
  doc.setFillColor(255, 255, 255)
  doc.rect(0, h * 0.55, w, h * 0.45, 'F')

  // Clinic name top
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(clinic?.clinic_name || '', w / 2, 8, { align: 'center' })

  // Health Identity Card subtitle
  doc.setFontSize(6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 230, 220)
  doc.text('Health Identity Card', w / 2, 13, { align: 'center' })

  // Patient Name label
  doc.setFontSize(6)
  doc.setTextColor(180, 230, 220)
  doc.text('PATIENT NAME', 6, 20)

  // Patient ID label
  doc.text('PATIENT ID', w / 2 + 2, 20)

  // Patient Name value
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text(patient?.full_name || '', 6, 25)

  // Patient ID value (large teal)
  doc.setTextColor(100, 220, 200)
  doc.setFontSize(10)
  doc.text(patient?.formatted_patient_id || '', w / 2 + 2, 25)

  // Age label
  doc.setFontSize(6)
  doc.setTextColor(180, 230, 220)
  doc.setFont('helvetica', 'normal')
  doc.text('AGE', 6, 31)

  // Gender label
  doc.text('GENDER', w / 3, 31)

  // Registered label
  doc.text('REGISTERED', w / 3 * 2, 31)

  // Age value
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text(String(patient?.age || ''), 6, 36)

  // Gender value
  const gender = patient?.gender
    ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)
    : ''
  doc.text(gender, w / 3, 36)

  // Registered date value
  const regDate = patient?.created_at
    ? new Date(patient.created_at).toISOString().split('T')[0]
    : ''
  doc.text(regDate, w / 3 * 2, 36)

  // Divider line
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.2)
  doc.line(4, h * 0.55 + 1, w - 4, h * 0.55 + 1)

  // Terms & Conditions heading
  doc.setFontSize(6)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('Terms & Conditions', 4, h * 0.55 + 5)

  // Terms text
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5)
  doc.setTextColor(80, 80, 80)
  const terms = clinic?.terms_conditions || 'This card is NOT TRANSFERABLE.'
  const termLines = doc.splitTextToSize(terms, w - 8)
  doc.text(termLines.slice(0, 2), 4, h * 0.55 + 9)

  // Contact info at bottom
  doc.setFontSize(5)
  doc.setTextColor(80, 80, 80)
  const contactLine = [
    clinic?.contact_address,
    clinic?.contact_phone,
    clinic?.contact_email
  ].filter(Boolean).join('  |  ')
  doc.text(contactLine, 4, h - 3, { maxWidth: w - 8 })

  // Save file
  const filename = `PatientCard-${patient?.formatted_patient_id || 'card'}-${(clinic?.short_name || clinic?.clinic_name || 'clinic').replace(/\s+/g, '')}.pdf`
  doc.save(filename)
  return true
}
