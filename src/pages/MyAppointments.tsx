import { useState, useEffect, useCallback } from "react";
import { CalendarDays, Calendar, Download, X, Loader2 } from "lucide-react";
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

const MyAppointments = () => {
  const { clinic, clinicId } = useClinicContext();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchAppointments = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("appointments")
        .select(`*, doctors(name, specialization)`)
        .eq("patient_id", userId)
        .eq("clinic_id", clinicId)
        .order("appointment_date", { ascending: false });
      setAppointments(data || []);
    },
    [clinicId]
  );

  useEffect(() => {
    const init = async () => {
      const {
        data: { session: s },
      } = await supabase.auth.getSession();
      setSession(s);
      setIsLoggedIn(!!s?.user);
      if (s?.user && clinicId) {
        await fetchAppointments(s.user.id);
      }
      setLoading(false);
    };
    if (clinicId) init();
  }, [clinicId, fetchAppointments]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (session?.user) await fetchAppointments(session.user.id);
    toast.success("Appointment cancelled");
    setCancellingId(null);
  };

  const handleDownloadPDF = async (apt: any) => {
    if (!clinic) return;
    try {
      await generateAppointmentPDF(
        apt,
        clinic,
        clinic?.short_name || clinic?.clinic_name?.slice(0, 5) || "CLN"
      );
      toast.success("Appointment slip downloaded!");
    } catch {
      toast.error("Failed to generate PDF");
    }
  };

  const isUpcoming = (apt: any) => {
    return new Date(apt.appointment_date) >= new Date(new Date().toDateString());
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="container py-16 max-w-md mx-auto">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-6 text-center space-y-4">
          <CalendarDays size={36} className="mx-auto text-amber-500" />
          <h2 className="text-lg font-bold">Login Required</h2>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Please log in to view your booked appointments.
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
    <div className="container py-10 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays size={24} className="text-purple-600" />
          My Appointments
        </h1>
        <ClinicLink
          to="/book-appointment"
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Calendar size={15} />
          Book New
        </ClinicLink>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border rounded-xl">
          <CalendarDays
            size={48}
            className="mx-auto mb-4 opacity-30"
          />
          <p className="font-semibold">No appointments yet</p>
          <p className="text-sm mt-1">
            Book your first appointment to see it here
          </p>
          <ClinicLink
            to="/book-appointment"
            className="inline-block mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Book Appointment
          </ClinicLink>
        </div>
      ) : (
        appointments.map((apt) => (
          <div
            key={apt.id}
            className="bg-white dark:bg-gray-800 border rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-black text-purple-600 text-lg tracking-tight">
                    {apt.appointment_ref}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      apt.status === "confirmed"
                        ? "bg-green-100 text-green-700"
                        : apt.status === "completed"
                        ? "bg-blue-100 text-blue-700"
                        : apt.status === "cancelled"
                        ? "bg-red-100 text-red-700"
                        : apt.status === "no_show"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {apt.status === "no_show" ? "No Show" : apt.status}
                  </span>
                  {apt.is_walkin && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">
                      Walk-in
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Dr. {apt.doctors?.name}
                </p>
                {apt.doctors?.specialization && (
                  <p className="text-xs text-gray-400">{apt.doctors.specialization}</p>
                )}

                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                  <span>
                    📅{" "}
                    {new Date(apt.appointment_date).toLocaleDateString("en-PK", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span>🕐 {formatTime12(apt.appointment_time)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDownloadPDF(apt)}
                  className="flex items-center gap-1.5 border border-purple-200 text-purple-600 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <Download size={13} />
                  Slip
                </button>
                {["pending", "confirmed"].includes(apt.status) &&
                  isUpcoming(apt) && (
                    <button
                      onClick={() => handleCancel(apt.id)}
                      disabled={cancellingId === apt.id}
                      className="flex items-center gap-1.5 border border-red-200 text-red-500 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {cancellingId === apt.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <X size={13} />
                      )}
                      Cancel
                    </button>
                  )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MyAppointments;
