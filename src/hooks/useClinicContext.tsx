import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useLocation } from "react-router-dom";
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
  maps_embed_url: string | null;
  secondary_theme_color: string | null;
  second_branch_address?: string | null;
  second_branch_working_hours?: string | null;
  second_branch_maps_embed_url?: string | null;
  location_heading?: string | null;
}

interface ClinicContextType {
  clinic: ClinicData | null;
  clinicId: string;
  loading: boolean;
  error: string | null;
  refreshClinic: () => Promise<void>;
  clearClinicCache: () => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

function extractSubdomain(): string | null {
  const hostname = window.location.hostname;

  // Local development — no subdomain detection
  if (hostname === "localhost" || hostname === "127.0.0.1" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  // Lovable preview — no subdomain detection
  if (hostname.includes("lovable.app") || hostname.includes("lovableproject.com")) {
    return null;
  }

  const parts = hostname.split(".");

  // Handle *.health.vercel.app pattern (4 parts)
  // e.g. zahidaclinic.health.vercel.app → ["zahidaclinic", "health", "vercel", "app"]
  if (parts.length === 4 && parts[2] === "vercel" && parts[3] === "app") {
    const subdomain = parts[0];
    // If the subdomain IS the project name (e.g. "health"), it's the root — no clinic subdomain
    if (subdomain === parts[1] || subdomain === "www") {
      return null;
    }
    return subdomain;
  }

  // Handle custom domains: e.g. zahidaclinic.clinic.health or subdomain.example.com
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
    const urlParams = new URLSearchParams(window.location.search);
    const clinicParam = urlParams.get("clinic");
    const subdomain = extractSubdomain();

    let activeSubdomain = subdomain;

    if (clinicParam) {
      sessionStorage.setItem('clinic_subdomain', clinicParam);
      activeSubdomain = clinicParam;
    } else {
      const sessionSubdomain = sessionStorage.getItem('clinic_subdomain');
      if (sessionSubdomain) {
        activeSubdomain = sessionSubdomain;
      }
    }

    // --- OPT 4: sessionStorage cache ---
    const cacheKey = `clinic_data_${activeSubdomain || DEFAULT_CLINIC_ID}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        setClinic(JSON.parse(cached) as ClinicData);
        setLoading(false);
        return;
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }
    // ------------------------------------

    let query = supabase.from("clinics").select("*");

    if (activeSubdomain) {
      query = query.eq("subdomain", activeSubdomain);
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
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } else {
      const isCustomAccess = clinicParam || sessionStorage.getItem('clinic_subdomain') || subdomain;
      if (!isCustomAccess) {
        const { data: firstClinic } = await supabase
          .from("clinics")
          .select("*")
          .eq("is_active", true)
          .order("created_at")
          .limit(1)
          .maybeSingle();
        if (firstClinic) {
          setClinic(firstClinic as ClinicData);
          const fallbackKey = `clinic_data_${(firstClinic as ClinicData).subdomain}`;
          sessionStorage.setItem(fallbackKey, JSON.stringify(firstClinic));
        } else {
          setError("No clinic found");
        }
      } else {
        setError("Clinic not found");
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    resolveClinic();
  }, [resolveClinic]);

  // Inject clinic theme colors as CSS variables whenever clinic data changes
  useEffect(() => {
    if (clinic?.theme_color) {
      document.documentElement.style.setProperty('--theme-color', clinic.theme_color);
    }
    if (clinic?.secondary_theme_color) {
      document.documentElement.style.setProperty('--secondary-theme-color', clinic.secondary_theme_color);
    }
  }, [clinic?.theme_color, clinic?.secondary_theme_color]);

  const clearClinicCache = useCallback(() => {
    // Clear any cached clinic data so next load re-fetches fresh data
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith("clinic_data_"))
      .forEach((k) => sessionStorage.removeItem(k));
  }, []);

  const refreshClinic = useCallback(async () => {
    if (!clinic?.id) return;
    // Clear cache so refreshed data is persisted fresh
    clearClinicCache();
    const { data } = await supabase
      .from("clinics")
      .select("*")
      .eq("id", clinic.id)
      .single();
    if (data) {
      setClinic(data as ClinicData);
      const key = `clinic_data_${(data as ClinicData).subdomain}`;
      sessionStorage.setItem(key, JSON.stringify(data));
    }
  }, [clinic?.id, clearClinicCache]);

  const clinicId = clinic?.id || DEFAULT_CLINIC_ID;

  const location = useLocation();

  // Dynamic favicon and page title logic
  useEffect(() => {
    // 1. Determine Title
    let title = "ClinicToken CMS";

    if (location.pathname.startsWith('/superadmin')) {
      title = "Super Admin — ClinicToken CMS";
    } else if (location.pathname.startsWith('/admin')) {
      title = clinic ? `Admin — ${clinic.clinic_name}` : "Admin Clinic Dashboard";
    } else if (clinic) {
      title = clinic.clinic_name;
    }

    document.title = title;

    // 2. Determine Favicon
    const faviconUrl = clinic?.logo_url || "/favicon.ico";

    // Update main favicon
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
      || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'icon';
    link.href = faviconUrl;
    if (!link.parentNode) document.head.appendChild(link);

    // Update apple touch icon
    const appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement
      || document.createElement('link');
    appleLink.rel = 'apple-touch-icon';
    appleLink.href = faviconUrl;
    if (!appleLink.parentNode) document.head.appendChild(appleLink);

  }, [clinic, location.pathname]);

  return (
    <ClinicContext.Provider value={{ clinic, clinicId, loading, error, refreshClinic, clearClinicCache }}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinicContext() {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error("useClinicContext must be used within ClinicProvider");
  return ctx;
}
