import { Doctor, Patient, Token, Notification } from "@/types/clinic";

export const mockDoctors: Doctor[] = [
  { id: "1", name: "Dr. Sarah Ahmed", specialization: "General Physician", imageUrl: "", status: "active", createdAt: "2026-01-15" },
  { id: "2", name: "Dr. Khalid Raza", specialization: "Cardiologist", imageUrl: "", status: "active", createdAt: "2026-01-20" },
  { id: "3", name: "Dr. Fatima Khan", specialization: "Pediatrician", imageUrl: "", status: "active", createdAt: "2026-02-01" },
  { id: "4", name: "Dr. Ali Hassan", specialization: "Dermatologist", imageUrl: "", status: "inactive", createdAt: "2026-02-10" },
];

export const mockPatients: Patient[] = [
  { id: "p1", fullName: "Ahmad Raza", age: 34, gender: "male", email: "ahmad@email.com", phone: "+92 300 1111111", formattedPatientId: "M-001", createdAt: "2026-02-20" },
  { id: "p2", fullName: "Fatima Bibi", age: 28, gender: "female", email: "fatima@email.com", phone: "+92 300 2222222", formattedPatientId: "F-002", createdAt: "2026-02-21" },
  { id: "p3", fullName: "Usman Ali", age: 45, gender: "male", email: "usman@email.com", phone: "+92 300 3333333", formattedPatientId: "M-003", createdAt: "2026-02-22" },
  { id: "p4", fullName: "Ayesha Siddiqui", age: 22, gender: "female", email: "ayesha@email.com", phone: "+92 300 4444444", formattedPatientId: "F-004", createdAt: "2026-02-23" },
  { id: "p5", fullName: "Bilal Khan", age: 50, gender: "male", email: "bilal@email.com", phone: "+92 300 5555555", formattedPatientId: "M-005", createdAt: "2026-02-24" },
];

export const mockTokens: Token[] = [
  { id: "t1", doctorId: "1", doctorName: "Dr. Sarah Ahmed", tokenNumber: 23, patientName: "Ahmad Raza", isWalkin: false, status: "active", createdAt: "2026-02-27T09:00:00" },
  { id: "t2", doctorId: "1", doctorName: "Dr. Sarah Ahmed", tokenNumber: 24, patientName: "Walk-In Patient", isWalkin: true, status: "active", createdAt: "2026-02-27T09:15:00" },
  { id: "t3", doctorId: "2", doctorName: "Dr. Khalid Raza", tokenNumber: 15, patientName: "Fatima Bibi", isWalkin: false, status: "completed", createdAt: "2026-02-27T08:30:00" },
  { id: "t4", doctorId: "3", doctorName: "Dr. Fatima Khan", tokenNumber: 8, patientName: "Usman Ali", isWalkin: false, status: "active", createdAt: "2026-02-27T10:00:00" },
];

export const mockNotifications: Notification[] = [
  { id: "n1", title: "Emergency Closure", message: "Clinic will remain closed on Friday due to maintenance.", priority: "urgent", isActive: true, createdAt: "2026-02-27" },
  { id: "n2", title: "New Doctor Joining", message: "Dr. Ayesha Siddiqui (ENT Specialist) joins starting March 1st.", priority: "normal", isActive: true, createdAt: "2026-02-25" },
  { id: "n3", title: "Vaccination Drive", message: "Free flu vaccination camp this Saturday from 9 AM to 2 PM.", priority: "normal", isActive: true, createdAt: "2026-02-23" },
  { id: "n4", title: "System Maintenance", message: "Token system briefly unavailable tonight 11 PM – 1 AM.", priority: "urgent", isActive: false, createdAt: "2026-02-22" },
];
