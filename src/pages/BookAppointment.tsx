import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  User,
  Download,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClinicContext } from "@/hooks/useClinicContext";
import ClinicLink from "@/components/ClinicLink";
import { toast } from "sonner";
import { generateAppointmentPDF } from "@/lib/appointmentPdf";

const formatTime12 = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const generateSlots = (
  startTime: string,
  endTime: string,
  durationMin: number
): string[] => {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;
  while (current + durationMin <= end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
    );
    current += durationMin;
  }
  return slots;
};

const BookAppointment = () => {
  const { clinic, clinicId } = useClinicContext();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedAppointment, setBookedAppointment] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [loading, setLoading] = useState(true);

  // Patient info
  const [session, setSession] = useState<any>(null);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [formattedPatientId, setFormattedPatientId] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session: s },
      } = await supabase.auth.getSession();
      setSession(s);
      setIsLoggedIn(!!s?.user);

      if (s?.user && clinicId) {
        const { data } = await supabase
          .from("patients")
          .select("full_name, phone, formatted_patient_id")
          .eq("user_id", s.user.id)
          .eq("clinic_id", clinicId)
          .single();
        if (data) {
          setPatientName(data.full_name || "");
          setPatientPhone(data.phone || "");
          setFormattedPatientId(data.formatted_patient_id || "");
        }
      }

      const { data: doctorsData } = await supabase
        .from("doctors")
        .select("id, name, specialization")
        .eq("clinic_id", clinicId)
        .eq("status", "active")
        .order("name");
      setDoctors(doctorsData || []);
      setLoading(false);
    };
    if (clinicId) init();
  }, [clinicId]);

  const fetchAvailableSlots = useCallback(
    async (date: string) => {
      if (!date || !selectedDoctor) return;

      const dayOfWeek = new Date(date).getDay();

      const { data: schedule } = await supabase
        .from("doctor_schedules")
        .select("*")
        .eq("clinic_id", clinicId)
        .eq("doctor_id", selectedDoctor)
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true)
        .maybeSingle();

      if (!schedule) {
        setAvailableSlots([]);
        return;
      }

      const { data: blocked } = await supabase
        .from("blocked_dates")
        .select("id")
        .eq("clinic_id", clinicId)
        .eq("blocked_date", date)
        .or(`doctor_id.eq.${selectedDoctor},doctor_id.is.null`)
        .maybeSingle();

      if (blocked) {
        setAvailableSlots([]);
        return;
      }

      const { data: booked } = await supabase
        .from("appointments")
        .select("appointment_time")
        .eq("clinic_id", clinicId)
        .eq("doctor_id", selectedDoctor)
        .eq("appointment_date", date)
        .not("status", "eq", "cancelled");

      const bookedTimes =
        booked?.map((b) => b.appointment_time.slice(0, 5)) || [];

      const allSlots = generateSlots(
        schedule.start_time,
        schedule.end_time,
        schedule.slot_duration_minutes
      );
      const available = allSlots.filter((s) => !bookedTimes.includes(s));
      setAvailableSlots(available);
    },
    [clinicId, selectedDoctor]
  );

  const handleBookAppointment = async () => {
    setIsBooking(true);
    try {
      const {
        data: { session: s },
      } = await supabase.auth.getSession();

      const { data: schedule } = await supabase
        .from("doctor_schedules")
        .select("slot_duration_minutes")
        .eq("clinic_id", clinicId)
        .eq("doctor_id", selectedDoctor)
        .maybeSingle();

      const duration = schedule?.slot_duration_minutes || 30;
      const [h, m] = selectedSlot.split(":").map(Number);
      const endMinutes = h * 60 + m + duration;
      const endTime = `${Math.floor(endMinutes / 60)
        .toString()
        .padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;

      const { data: ref } = await supabase.rpc("generate_appointment_ref", {
        p_clinic_id: clinicId,
      });

      const { data: newApt, error } = await supabase
        .from("appointments")
        .insert({
          clinic_id: clinicId,
          doctor_id: selectedDoctor,
          patient_id: s?.user?.id || null,
          formatted_patient_id: formattedPatientId || null,
          patient_name: patientName,
          patient_phone: patientPhone || null,
          patient_email: s?.user?.email || null,
          appointment_date: selectedDate,
          appointment_time: selectedSlot,
          slot_end_time: endTime,
          appointment_ref: ref,
          status: "pending",
          is_walkin: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Attach doctor data
      const doctorData = doctors.find((d) => d.id === selectedDoctor);
      setBookedAppointment({ ...newApt, doctors: doctorData });
      setShowSuccessModal(true);
    } catch (e: any) {
      toast.error("Booking failed: " + e.message);
    } finally {
      setIsBooking(false);
    }
  };

  const handleDownloadAppointmentPDF = async () => {
    if (!bookedAppointment || !clinic) return;
    try {
      await generateAppointmentPDF(
        bookedAppointment,
        clinic,
        clinic?.short_name || clinic?.clinic_name?.slice(0, 5) || "CLN"
      );
      toast.success("Appointment slip downloaded!");
    } catch {
      toast.error("Failed to generate PDF");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Not logged in — show login gate
  if (!isLoggedIn) {
    return (
      <div className="container py-16 max-w-md mx-auto">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-6 text-center space-y-4">
          <Calendar size={36} className="mx-auto text-amber-500" />
          <h2 className="text-lg font-bold">Login Required</h2>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            To book an appointment, please log in or register as a patient first.
          </p>
          <div className="flex gap-3 justify-center">
            <ClinicLink
              to="/login"
              className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-5 py-2.5 rounded-lg font-semibold transition-colors"
            >
              Login
            </ClinicLink>
            <ClinicLink
              to="/register"
              className="border border-amber-400 text-amber-700 dark:text-amber-300 text-sm px-5 py-2.5 rounded-lg font-semibold hover:bg-amber-100 transition-colors"
            >
              Register
            </ClinicLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 border border-border rounded-2xl shadow-lg p-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s
                    ? "bg-purple-600 text-white"
                    : step > s
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                }`}
              >
                {step > s ? "✓" : s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-0.5 w-8 ${
                    step > s ? "bg-green-400" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1 — Doctor Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center">Select Your Doctor</h2>
            {doctors.length === 0 && (
              <p className="text-center text-gray-400 py-8">
                No doctors available.
              </p>
            )}
            {doctors.map((doc) => (
              <button
                key={doc.id}
                onClick={() => {
                  setSelectedDoctor(doc.id);
                  setSelectedDate("");
                  setSelectedSlot("");
                  setAvailableSlots([]);
                  setStep(2);
                }}
                className="w-full flex items-center gap-4 p-4 border-2 hover:border-purple-400 rounded-xl transition-all text-left"
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <User size={24} className="text-purple-500" />
                </div>
                <div>
                  <p className="font-semibold">{doc.name}</p>
                  <p className="text-sm text-gray-400">{doc.specialization}</p>
                </div>
                <ChevronRight size={18} className="ml-auto text-gray-300" />
              </button>
            ))}
          </div>
        )}

        {/* STEP 2 — Date + Time */}
        {step === 2 && (
          <div className="space-y-5">
            <button
              onClick={() => setStep(1)}
              className="text-sm text-purple-500 flex items-center gap-1 hover:underline"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <h2 className="text-xl font-bold">Choose Date & Time</h2>

            <div>
              <label className="text-sm font-medium block mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot("");
                  fetchAvailableSlots(e.target.value);
                }}
                min={new Date().toISOString().split("T")[0]}
                className="w-full border-2 rounded-xl px-4 py-3 text-sm focus:border-purple-400 outline-none bg-background"
              />
            </div>

            {selectedDate && (
              <div>
                <label className="text-sm font-medium block mb-2">
                  Available Time Slots
                </label>
                {availableSlots.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 border rounded-xl">
                    <CalendarX
                      size={32}
                      className="mx-auto mb-2 opacity-40"
                    />
                    <p className="text-sm">No slots available on this date</p>
                    <p className="text-xs mt-1">Please choose a different date</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                          selectedSlot === slot
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        {formatTime12(slot)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => selectedSlot && setStep(3)}
              disabled={!selectedSlot}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Continue →
            </button>
          </div>
        )}

        {/* STEP 3 — Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <button
              onClick={() => setStep(2)}
              className="text-sm text-purple-500 flex items-center gap-1 hover:underline"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <h2 className="text-xl font-bold">Confirm Appointment</h2>

            {/* Summary card */}
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Doctor</span>
                <span className="font-medium">
                  {doctors.find((d) => d.id === selectedDoctor)?.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="font-medium">
                  {new Date(selectedDate).toLocaleDateString("en-PK", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Time</span>
                <span className="font-medium">{formatTime12(selectedSlot)}</span>
              </div>
            </div>

            {/* Patient info */}
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm">
                <span className="text-gray-400 text-xs block mb-1">
                  Patient Name
                </span>
                <span className="font-semibold">
                  {patientName || "Please register/login"}
                </span>
                {formattedPatientId && (
                  <span className="ml-2 text-xs text-gray-400">
                    ({formattedPatientId})
                  </span>
                )}
              </div>
              {patientPhone && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-sm">
                  <span className="text-gray-400 text-xs block mb-1">Phone</span>
                  <span className="font-semibold">{patientPhone}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleBookAppointment}
              disabled={isBooking || !patientName}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {isBooking ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Calendar size={18} />
              )}
              {isBooking ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && bookedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            {/* Appointment card */}
            <div
              id="appointment-card"
              className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-6 text-center"
            >
              <p className="text-xs uppercase tracking-widest opacity-80 mb-1">
                Appointment Confirmed
              </p>
              <p className="text-3xl font-black mb-1">
                {bookedAppointment.appointment_ref}
              </p>
              <p className="font-semibold">{bookedAppointment.patient_name}</p>
              <p className="text-sm opacity-80 mt-1">
                {doctors.find((d) => d.id === selectedDoctor)?.name}
              </p>
              <div className="mt-3 bg-white/20 rounded-lg px-4 py-2 inline-block">
                <p className="text-sm font-semibold">
                  {new Date(bookedAppointment.appointment_date).toLocaleDateString(
                    "en-PK",
                    { weekday: "short", day: "numeric", month: "short" }
                  )}{" "}
                  · {formatTime12(bookedAppointment.appointment_time)}
                </p>
              </div>
              <p className="text-xs opacity-60 mt-2">{clinic?.clinic_name}</p>
            </div>

            <div className="p-5 space-y-3">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  📋 Please save or download this confirmation slip. Present it at
                  the clinic reception on your appointment day.
                </p>
              </div>

              <button
                onClick={handleDownloadAppointmentPDF}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Download size={18} />
                Download Appointment Slip (PDF)
              </button>

              <ClinicLink
                to="/my-appointments"
                onClick={() => setShowSuccessModal(false)}
                className="block w-full text-center border border-purple-300 text-purple-600 font-semibold py-3 rounded-xl hover:bg-purple-50 transition-colors"
              >
                View My Appointments
              </ClinicLink>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full border border-gray-300 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
