import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// For now, use a default clinic ID since subdomain routing isn't fully wired yet
const DEFAULT_CLINIC_ID = "a0000000-0000-0000-0000-000000000001";

export function getClinicId(): string {
  return DEFAULT_CLINIC_ID;
}

/**
 * Hook that resolves the clinic_id from the logged-in user's clinic_admin role.
 * Falls back to DEFAULT_CLINIC_ID for public pages or patients.
 */
export function useClinicId(): { clinicId: string; loading: boolean } {
  const { user, roles } = useAuth();
  
  const clinicAdminRole = roles.find((r) => r.role === "clinic_admin");
  const clinicId = clinicAdminRole?.clinic_id || DEFAULT_CLINIC_ID;
  
  return { clinicId, loading: false };
}

export function useClinicDoctors() {
  const [doctors, setDoctors] = useState<{ id: string; name: string; specialization: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { clinicId } = useClinicId();

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
