import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useClinicContext } from "@/hooks/useClinicContext";

/**
 * For public pages: returns clinicId from subdomain context.
 */
export function usePublicClinicId(): string {
  const { clinicId } = useClinicContext();
  return clinicId;
}

/**
 * For admin pages: resolves clinic_id from the logged-in user's clinic_admin role.
 * Falls back to subdomain clinic context.
 */
export function useClinicId(): { clinicId: string; loading: boolean } {
  const { roles } = useAuth();
  const { clinicId: contextClinicId } = useClinicContext();
  
  const clinicAdminRole = roles.find((r) => r.role === "clinic_admin");
  const clinicId = clinicAdminRole?.clinic_id || contextClinicId;
  
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
