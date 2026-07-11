import { useState, useEffect, useCallback } from "react";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClinicId } from "@/hooks/useClinic";
import { toast } from "sonner";

const formatTime12 = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const AdminAppointments = () => {
  const { clinicId } = useClinicId();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchAppointments = useCallback(async () => {
    const { data } = await supabase
      .from("appointments")
      .select(`*, doctors(name, specialization)`)
      .eq("clinic_id", clinicId)
      .gte("appointment_date", new Date().toISOString().split("T")[0])
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });
    setAppointments(data || []);
  }, [clinicId]);

  useEffect(() => {
    if (clinicId) fetchAppointments();
  }, [clinicId, fetchAppointments]);

  const handleUpdateStatus = async (id: string, status: string) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    await fetchAppointments();
    toast.success(`Appointment marked as ${status}`);
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesDate = filterDate ? apt.appointment_date === filterDate : true;
    const matchesStatus =
      statusFilter === "all" ? true : apt.status === statusFilter;
    return matchesDate && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Calendar size={22} /> Appointments
        </h2>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-background"
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "confirmed", "completed", "cancelled", "no_show"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              statusFilter === s
                ? "bg-purple-600 text-white"
                : "border text-gray-500 hover:border-purple-300"
            }`}
          >
            {s === "no_show"
              ? "No Show"
              : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Appointments list */}
      {filteredAppointments.map((apt) => (
        <div
          key={apt.id}
          className="bg-white dark:bg-gray-800 border rounded-xl p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-bold text-purple-600 text-lg">
                  {apt.appointment_ref}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
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
                  {apt.status}
                </span>
                {apt.is_walkin && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    Walk-in
                  </span>
                )}
              </div>
              <p className="font-semibold">{apt.patient_name}</p>
              {apt.formatted_patient_id && (
                <p className="text-xs text-gray-400">{apt.formatted_patient_id}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">Dr. {apt.doctors?.name}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                <span>
                  📅{" "}
                  {new Date(apt.appointment_date).toLocaleDateString("en-PK", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <span>🕐 {formatTime12(apt.appointment_time)}</span>
                {apt.patient_phone && <span>📞 {apt.patient_phone}</span>}
              </div>
            </div>

            {/* Status actions */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              {apt.status === "pending" && (
                <button
                  onClick={() => handleUpdateStatus(apt.id, "confirmed")}
                  className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                >
                  Confirm
                </button>
              )}
              {["pending", "confirmed"].includes(apt.status) && (
                <button
                  onClick={() => handleUpdateStatus(apt.id, "completed")}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                >
                  Complete
                </button>
              )}
              {["pending", "confirmed"].includes(apt.status) && (
                <button
                  onClick={() => handleUpdateStatus(apt.id, "no_show")}
                  className="bg-orange-400 hover:bg-orange-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                >
                  No Show
                </button>
              )}
              {apt.status !== "cancelled" && apt.status !== "completed" && (
                <button
                  onClick={() => handleUpdateStatus(apt.id, "cancelled")}
                  className="border border-red-300 text-red-500 text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {filteredAppointments.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Calendar size={40} className="mx-auto mb-3 opacity-30" />
          <p>No appointments found</p>
        </div>
      )}
    </div>
  );
};

export default AdminAppointments;
