import { useEffect, useState } from "react";
import { Activity, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePublicClinicId } from "@/hooks/useClinic";

const PublicFooter = () => {
  const clinicId = usePublicClinicId();
  const [footer, setFooter] = useState<any>(null);
  const [clinic, setClinic] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [footerRes, clinicRes] = await Promise.all([
        supabase.from("homepage_sections").select("content_json, is_enabled").eq("clinic_id", clinicId).eq("section_name", "footer").single(),
        supabase.from("clinics").select("clinic_name, logo_url, contact_phone, contact_email, short_name").eq("id", clinicId).single(),
      ]);
      if (footerRes.data?.is_enabled) setFooter(footerRes.data.content_json);
      setClinic(clinicRes.data);
    };
    fetchData();
  }, [clinicId]);

  const f = footer || {};
  const name = clinic?.clinic_name || "ClinicToken";
  const shortName = (clinic as any)?.short_name || "";
  const logo = f.logo_override || clinic?.logo_url;
  const phone = f.phone || clinic?.contact_phone;
  const email = f.email || clinic?.contact_email;

  const socials = [
    { label: "Facebook", url: f.social_facebook },
    { label: "Instagram", url: f.social_instagram },
    { label: "WhatsApp", url: f.social_whatsapp },
    { label: "LinkedIn", url: f.social_linkedin },
  ].filter((s) => s.url);

  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {logo ? (
                <img src={logo} alt={name} className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
                  <Activity className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <span className="font-display text-lg font-bold text-foreground">{name}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {f.description || "Modern health management platform for clinics and hospitals."}
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-display font-semibold text-foreground">Quick Links</h4>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">Home</Link>
              <Link to="/tokens" className="text-sm text-muted-foreground hover:text-primary transition-colors">Live Tokens</Link>
              <Link to="/notifications" className="text-sm text-muted-foreground hover:text-primary transition-colors">Notifications</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-display font-semibold text-foreground">Services</h4>
            <div className="flex flex-col gap-2">
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link>
              <Link to="/location" className="text-sm text-muted-foreground hover:text-primary transition-colors">Location</Link>
              <Link to="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors">Patient Registration</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-display font-semibold text-foreground">Contact</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              {phone && <span>{phone}</span>}
              {email && <span>{email}</span>}
              {f.address && <span>{f.address}</span>}
            </div>
            {socials.length > 0 && (
              <div className="mt-3 flex gap-3">
                {socials.map((s) => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mt-8 flex items-center justify-center gap-1 border-t border-border pt-6 text-sm text-muted-foreground">
          {f.copyright || (<>Made with <Heart className="h-3.5 w-3.5 text-accent" /> by {name}</>)}
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
