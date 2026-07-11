import { useState, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClinicId } from "@/hooks/useClinic";
import { toast } from "sonner";

const ScheduleSettings = () => {
  const { clinicId } = useClinicId();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [schedules, setSchedules] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [slotDuration, setSlotDuration] = useState(30);
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data } = await supabase
        .from("doctors")
        .select("id, name, specialization")
        .eq("clinic_id", clinicId)
        .eq("status", "active")
        .order("name");
      setDoctors(data || []);
    };
    if (clinicId) fetchDoctors();
  }, [clinicId]);

  const fetchSchedules = useCallback(async () => {
    if (!selectedDoctor) return;
    const { data } = await supabase
      .from("doctor_schedules")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("doctor_id", selectedDoctor)
      .order("day_of_week");
    setSchedules(data || []);
    if (data && data.length > 0) {
      setSlotDuration(data[0].slot_duration_minutes || 30);
    }
  }, [clinicId, selectedDoctor]);

  const fetchBlockedDates = useCallback(async () => {
    if (!selectedDoctor) return;
    const { data } = await supabase
      .from("blocked_dates")
      .select("*")
      .eq("clinic_id", clinicId)
      .gte("blocked_date", new Date().toISOString().split("T")[0])
      .order("blocked_date");
    setBlockedDates(data || []);
  }, [clinicId, selectedDoctor]);

  useEffect(() => {
    if (selectedDoctor) {
      fetchSchedules();
      fetchBlockedDates();
    } else {
      setSchedules([]);
      setBlockedDates([]);
    }
  }, [selectedDoctor, fetchSchedules, fetchBlockedDates]);

  const handleToggleDay = async (dayIndex: number, active: boolean) => {
    const existing = schedules.find((s) => s.day_of_week === dayIndex);
    if (existing) {
      await supabase
        .from("doctor_schedules")
        .update({ is_active: active })
        .eq("id", existing.id);
    } else {
      await supabase.from("doctor_schedules").insert({
        clinic_id: clinicId,
        doctor_id: selectedDoctor,
        day_of_week: dayIndex,
        start_time: "09:00",
        end_time: "17:00",
        slot_duration_minutes: slotDuration,
        max_per_slot: 1,
        is_active: true,
      });
    }
    await fetchSchedules();
  };

  const handleUpdateTime = async (
    dayIndex: number,
    field: string,
    value: string
  ) => {
    const existing = schedules.find((s) => s.day_of_week === dayIndex);
    if (existing) {
      await supabase
        .from("doctor_schedules")
        .update({ [field]: value })
        .eq("id", existing.id);
      await fetchSchedules();
    }
  };

  const handleUpdateMaxPerSlot = async (dayIndex: number, val: number) => {
    const existing = schedules.find((s) => s.day_of_week === dayIndex);
    if (existing) {
      await supabase
        .from("doctor_schedules")
        .update({ max_per_slot: val })
        .eq("id", existing.id);
      await fetchSchedules();
    }
  };

  const handleBlockDate = async () => {
    if (!blockDate) return;
    await supabase.from("blocked_dates").insert({
      clinic_id: clinicId,
      doctor_id: selectedDoctor,
      blocked_date: blockDate,
      reason: blockReason || null,
    });
    setBlockDate("");
    setBlockReason("");
    await fetchBlockedDates();
  };

  const handleUnblockDate = async (id: string) => {
    await supabase.from("blocked_dates").delete().eq("id", id);
    await fetchBlockedDates();
  };

  const handleSaveSchedule = async () => {
    await supabase
      .from("doctor_schedules")
      .update({ slot_duration_minutes: slotDuration })
      .eq("clinic_id", clinicId)
      .eq("doctor_id", selectedDoctor);
    toast.success("Schedule saved successfully");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Clock size={22} /> Schedule Settings
      </h2>

      {/* Doctor selector */}
      <div>
        <label className="text-sm font-medium block mb-2">Select Doctor</label>
        <select
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background"
        >
          <option value="">Choose a doctor...</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {selectedDoctor && (
        <>
          {/* Appointment duration */}
          <div className="p-4 border rounded-xl">
            <label className="text-sm font-medium block mb-2">
              Appointment Duration
            </label>
            <div className="flex gap-3 flex-wrap">
              {[15, 20, 30, 45, 60].map((min) => (
                <button
                  key={min}
                  onClick={() => setSlotDuration(min)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                    slotDuration === min
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700"
                      : "border-gray-200 text-gray-500 hover:border-purple-300"
                  }`}
                >
                  {min} min
                </button>
              ))}
            </div>
          </div>

          {/* Weekly schedule */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Weekly Availability</h3>
            {[
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ].map((day, index) => {
              const schedule = schedules.find((s) => s.day_of_week === index);
              return (
                <div
                  key={day}
                  className={`p-4 border rounded-xl ${
                    schedule?.is_active
                      ? "border-purple-200 bg-purple-50 dark:bg-purple-900/10"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{day}</span>
                    <input
                      type="checkbox"
                      checked={schedule?.is_active || false}
                      onChange={(e) =>
                        handleToggleDay(index, e.target.checked)
                      }
                      className="w-4 h-4 accent-purple-500"
                    />
                  </div>
                  {schedule?.is_active && (
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <input
                        type="time"
                        value={schedule.start_time || "09:00"}
                        onChange={(e) =>
                          handleUpdateTime(index, "start_time", e.target.value)
                        }
                        className="border rounded-lg px-3 py-1.5 text-sm bg-background"
                      />
                      <span className="text-gray-400">to</span>
                      <input
                        type="time"
                        value={schedule.end_time || "17:00"}
                        onChange={(e) =>
                          handleUpdateTime(index, "end_time", e.target.value)
                        }
                        className="border rounded-lg px-3 py-1.5 text-sm bg-background"
                      />
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={schedule.max_per_slot || 1}
                        onChange={(e) =>
                          handleUpdateMaxPerSlot(index, Number(e.target.value))
                        }
                        className="border rounded-lg px-3 py-1.5 text-sm w-16 bg-background"
                        title="Max patients per slot"
                      />
                      <span className="text-xs text-gray-400">per slot</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Block specific dates */}
          <div className="p-4 border rounded-xl">
            <h3 className="font-semibold text-sm mb-3">
              Block Dates (Holidays / Closed)
            </h3>
            <div className="flex gap-3 mb-3 flex-wrap">
              <input
                type="date"
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="border rounded-lg px-3 py-2 text-sm flex-1 bg-background"
              />
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Reason (optional)"
                className="border rounded-lg px-3 py-2 text-sm flex-1 bg-background"
              />
              <button
                onClick={handleBlockDate}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Block
              </button>
            </div>
            <div className="space-y-2">
              {blockedDates
                .filter((b) => b.doctor_id === selectedDoctor)
                .map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm">
                      {new Date(b.blocked_date).toLocaleDateString("en-PK", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {b.reason && (
                      <span className="text-xs text-gray-400">{b.reason}</span>
                    )}
                    <button
                      onClick={() => handleUnblockDate(b.id)}
                      className="text-red-400 hover:text-red-600 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              {blockedDates.filter((b) => b.doctor_id === selectedDoctor)
                .length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">
                  No blocked dates
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleSaveSchedule}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Save Schedule
          </button>
        </>
      )}
    </div>
  );
};

export default ScheduleSettings;
