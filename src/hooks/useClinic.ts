import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// For now, use a default clinic ID since subdomain routing isn't fully wired yet
const DEFAULT_CLINIC_ID = "a0000000-0000-0000-0000-000000000001";

export function getClinicId(): string {
  // In production: extract from subdomain
  // const hostname = window.location.hostname;
  // const subdomain = hostname.split('.')[0];
  // Then look up clinic by subdomain
  return DEFAULT_CLINIC_ID;
}

export function useClinicDoctors() {
  const [doctors, setDoctors] = useState<{ id: string; name: string; specialization: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const clinicId = getClinicId();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("doctors")
        .select("id, name, specialization, status")
        .eq("clinic_id", clinicId)
        .eq("status", "active");
      setDoctors((data as any[]) || []);
      setLoading(false);
    };
    fetch();
  }, [clinicId]);

  return { doctors, loading, clinicId };
}
