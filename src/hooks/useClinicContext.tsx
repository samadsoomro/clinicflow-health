import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
}

interface ClinicContextType {
  clinic: ClinicData | null;
  clinicId: string;
  loading: boolean;
  error: string | null;
  refreshClinic: () => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

/**
 * Extracts subdomain from hostname.
 * Supports patterns:
 *   - zahidaclinic.health.app → "zahidaclinic"
 *   - zahidaclinic.clinic.health → "zahidaclinic"
 *   - id-preview--xxx.lovable.app → null (preview URL, use fallback)
 *   - localhost → null
 */
function extractSubdomain(): string | null {
  const hostname = window.location.hostname;

  // Skip localhost and IP addresses
  if (hostname === "localhost" || hostname === "127.0.0.1" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  // Skip Lovable preview URLs (id-preview--xxx.lovable.app or xxx.lovableproject.com)
  if (hostname.includes("lovable.app") || hostname.includes("lovableproject.com")) {
    return null;
  }

  // Extract first part of hostname as subdomain
  // e.g. zahidaclinic.health.app → zahidaclinic
  // e.g. zahidaclinic.clinic.health → zahidaclinic
  const parts = hostname.split(".");
  if (parts.length >= 2) {
    const subdomain = parts[0];
    // Skip "www"
    if (subdomain === "www" && parts.length >= 3) {
      return parts[1];
    }
    return subdomain;
  }

  return null;
}

// Also check for ?clinic= query param (useful for testing)
function getClinicParam(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("clinic");
}

const DEFAULT_CLINIC_ID = "a0000000-0000-0000-0000-000000000001";

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolve = async () => {
      const clinicParam = getClinicParam();
      const subdomain = extractSubdomain();

      let query = supabase.from("clinics").select("*");

      if (clinicParam) {
        // Query param takes priority (for testing: ?clinic=zahidaclinic)
        query = query.eq("subdomain", clinicParam);
      } else if (subdomain) {
        // Try subdomain from hostname
        query = query.eq("subdomain", subdomain);
      } else {
        // Fallback: try loading by default ID, or load the first active clinic
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
        // If default ID didn't work, try loading the first active clinic
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
    };

    resolve();
  }, []);

  const clinicId = clinic?.id || DEFAULT_CLINIC_ID;

  return (
    <ClinicContext.Provider value={{ clinic, clinicId, loading, error }}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinicContext() {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error("useClinicContext must be used within ClinicProvider");
  return ctx;
}
