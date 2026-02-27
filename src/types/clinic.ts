export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  imageUrl: string;
  status: "active" | "inactive";
  createdAt: string;
}

export interface Patient {
  id: string;
  fullName: string;
  age: number;
  gender: "male" | "female" | "other";
  email: string;
  phone: string;
  formattedPatientId: string;
  createdAt: string;
}

export interface Token {
  id: string;
  doctorId: string;
  doctorName: string;
  tokenNumber: number;
  patientName: string;
  isWalkin: boolean;
  status: "active" | "completed" | "closed";
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  priority: "normal" | "urgent";
  isActive: boolean;
  createdAt: string;
}

export interface Clinic {
  id: string;
  clinicName: string;
  subdomain: string;
  logoUrl: string;
  themeColor: string;
  address: string;
  latitude: number;
  longitude: number;
  contactPhone: string;
  contactEmail: string;
  workingHours: string;
  emergencyContact: string;
  termsConditions: string;
  cardBackgroundColor: string;
  qrBaseUrl: string;
}
