import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClinicData {
  id: string;
  clinic_name: string;
  subdomain: string;
  domain_name: string | null;
  address: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  working_hours: string | null;
  emergency_contact: string | null;
  terms_conditions: string | null;
  logo_url: string | null;
  theme_color: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  latitude: number | null;
  longitude: number | null;
  qr_base_url: string | null;
  card_background_color: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  is_active: boolean | null;
  short_name: string | null;
}

interface ClinicContextType {
  clinic: ClinicData | null;
  clinicId: string;
  loading: boolean;
  error: string | null;
  refreshClinic: () => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

function extractSubdomain(): string | null {
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }
  if (hostname.includes("lovable.app") || hostname.includes("lovableproject.com")) {
    return null;
  }
  const parts = hostname.split(".");
  if (parts.length >= 2) {
    const subdomain = parts[0];
    if (subdomain === "www" && parts.length >= 3) {
      return parts[1];
    }
    return subdomain;
  }
  return null;
}

function getClinicParam(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("clinic");
}

const DEFAULT_CLINIC_ID = "a0000000-0000-0000-0000-000000000001";

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolveClinic = useCallback(async () => {
    const clinicParam = getClinicParam();
    const subdomain = extractSubdomain();

    let query = supabase.from("clinics").select("*");

    if (clinicParam) {
      query = query.eq("subdomain", clinicParam);
    } else if (subdomain) {
      query = query.eq("subdomain", subdomain);
    } else {
      query = query.eq("id", DEFAULT_CLINIC_ID);
    }

    const { data, error: fetchError } = await query.maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    if (data) {
      setClinic(data as ClinicData);
    } else if (!clinicParam && !subdomain) {
      const { data: firstClinic } = await supabase
        .from("clinics")
        .select("*")
        .eq("is_active", true)
        .order("created_at")
        .limit(1)
        .maybeSingle();
      if (firstClinic) {
        setClinic(firstClinic as ClinicData);
      } else {
        setError("No clinic found");
      }
    } else {
      setError("Clinic not found");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    resolveClinic();
  }, [resolveClinic]);

  const refreshClinic = useCallback(async () => {
    if (!clinic?.id) return;
    const { data } = await supabase
      .from("clinics")
      .select("*")
      .eq("id", clinic.id)
      .single();
    if (data) {
      setClinic(data as ClinicData);
    }
  }, [clinic?.id]);

  const clinicId = clinic?.id || DEFAULT_CLINIC_ID;

  return (
    <ClinicContext.Provider value={{ clinic, clinicId, loading, error, refreshClinic }}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinicContext() {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error("useClinicContext must be used within ClinicProvider");
  return ctx;
}
