import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Save, Eye, GripVertical, ToggleLeft, ToggleRight, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useClinicId } from "@/hooks/useClinic";
import { toast } from "sonner";
import { HeroEditor } from "@/components/admin/homepage/HeroEditor";
import { StatsEditor } from "@/components/admin/homepage/StatsEditor";
import { DoctorsEditor } from "@/components/admin/homepage/DoctorsEditor";
import { CertificationsEditor } from "@/components/admin/homepage/CertificationsEditor";
import { NotificationsPreview } from "@/components/admin/homepage/NotificationsPreview";
import { ContactPreview } from "@/components/admin/homepage/ContactPreview";
import { FooterEditor } from "@/components/admin/homepage/FooterEditor";

export interface SectionData {
  id?: string;
  section_name: string;
  content_json: any;
  is_enabled: boolean;
  display_order: number;
}

const DEFAULT_SECTIONS: SectionData[] = [
  { section_name: "hero", content_json: { title: "", subtitle: "", description: "", button_text: "Get Started", button_link: "/register", background_image: "" }, is_enabled: true, display_order: 0 },
  { section_name: "stats", content_json: { items: [] }, is_enabled: true, display_order: 1 },
  { section_name: "doctors", content_json: { title: "Meet Our Doctors", subtitle: "Our team of experienced professionals" }, is_enabled: true, display_order: 2 },
  { section_name: "certifications", content_json: { title: "Our Certifications", subtitle: "Recognized excellence in healthcare" }, is_enabled: true, display_order: 3 },
  { section_name: "notifications", content_json: { title: "Latest Updates", subtitle: "Stay informed about our clinic" }, is_enabled: true, display_order: 4 },
  { section_name: "contact", content_json: { title: "Contact Us", subtitle: "Get in touch with our team", phone: "", email: "", address: "", working_hours: "", maps_embed_url: "" }, is_enabled: true, display_order: 5 },
  { section_name: "footer", content_json: { description: "", phone: "", email: "", address: "", copyright: "", logo_override: "", social_facebook: "", social_instagram: "", social_whatsapp: "", social_linkedin: "" }, is_enabled: true, display_order: 6 },
];

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero Section",
  stats: "Clinic Statistics",
  doctors: "Meet Our Doctors",
  certifications: "Certifications & Achievements",
  notifications: "Notifications Preview",
  contact: "Contact Information",
  footer: "Footer",
};

const AdminHomepage = () => {
  const { clinicId } = useClinicId();
  const [sections, setSections] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  const fetchSections = useCallback(async () => {
    const { data } = await supabase
      .from("homepage_sections")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("display_order");

    if (data && data.length > 0) {
      const fetched = data.map((d: any) => ({
        id: d.id,
        section_name: d.section_name,
        content_json: d.content_json,
        is_enabled: d.is_enabled,
        display_order: d.display_order,
      }));
      // Merge any new default sections that don't exist in DB yet
      const fetchedNames = new Set(fetched.map((s: SectionData) => s.section_name));
      const missing = DEFAULT_SECTIONS.filter((ds) => !fetchedNames.has(ds.section_name));
      setSections([...fetched, ...missing]);
    } else {
      setSections(DEFAULT_SECTIONS);
    }
    setLoading(false);
  }, [clinicId]);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  const updateSection = (sectionName: string, updates: Partial<SectionData>) => {
    setSections((prev) =>
      prev.map((s) => s.section_name === sectionName ? { ...s, ...updates } : s)
    );
  };

  const updateContent = (sectionName: string, content: any) => {
    updateSection(sectionName, { content_json: content });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    for (const section of sections) {
      const payload = {
        clinic_id: clinicId,
        section_name: section.section_name,
        content_json: section.content_json,
        is_enabled: section.is_enabled,
        display_order: section.display_order,
        updated_at: new Date().toISOString(),
      };

      if (section.id) {
        await supabase.from("homepage_sections").update(payload).eq("id", section.id);
      } else {
        const { data } = await supabase.from("homepage_sections").insert(payload).select("id").single();
        if (data) section.id = data.id;
      }

      // Special case: Update clinics table for contact section to persist branch info
      if (section.section_name === "contact") {
        await supabase
          .from("clinics")
          .update({
            second_branch_address: section.content_json.second_branch_address || null,
            second_branch_working_hours: section.content_json.second_branch_working_hours || null,
          } as any)
          .eq("id", clinicId);
      }
    }
    toast.success("Homepage saved successfully!");
    setSaving(false);
  };

  const currentSection = sections.find((s) => s.section_name === activeSection);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Homepage Editor</h2>
          <p className="text-sm text-muted-foreground">Customize your clinic's public homepage</p>
        </div>
        <Button variant="hero" onClick={handleSaveAll} disabled={saving}>
          <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Section Sidebar */}
        <div className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-soft h-fit">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-3">Sections</p>
          {sections.map((s) => (
            <button
              key={s.section_name}
              onClick={() => setActiveSection(s.section_name)}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                activeSection === s.section_name
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-secondary"
              }`}
            >
              <span className="truncate">{SECTION_LABELS[s.section_name]}</span>
              <div onClick={(e) => { e.stopPropagation(); updateSection(s.section_name, { is_enabled: !s.is_enabled }); }}>
                {s.is_enabled ? (
                  <ToggleRight className={`h-4 w-4 ${activeSection === s.section_name ? "text-primary-foreground" : "text-primary"}`} />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Section Editor */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          {currentSection && (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {SECTION_LABELS[currentSection.section_name]}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {currentSection.is_enabled ? "Visible on homepage" : "Hidden from homepage"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="section-toggle" className="text-sm">Enabled</Label>
                  <Switch
                    id="section-toggle"
                    checked={currentSection.is_enabled}
                    onCheckedChange={(v) => updateSection(currentSection.section_name, { is_enabled: v })}
                  />
                </div>
              </div>

              {activeSection === "hero" && (
                <HeroEditor
                  content={currentSection.content_json}
                  onChange={(c) => updateContent("hero", c)}
                  clinicId={clinicId}
                />
              )}
              {activeSection === "stats" && (
                <StatsEditor
                  content={currentSection.content_json}
                  onChange={(c) => updateContent("stats", c)}
                />
              )}
              {activeSection === "doctors" && (
                <DoctorsEditor
                  content={currentSection.content_json}
                  onChange={(c) => updateContent("doctors", c)}
                  clinicId={clinicId}
                />
              )}
              {activeSection === "certifications" && (
                <CertificationsEditor
                  content={currentSection.content_json}
                  onChange={(c) => updateContent("certifications", c)}
                  clinicId={clinicId}
                />
              )}
              {activeSection === "notifications" && (
                <NotificationsPreview
                  content={currentSection.content_json}
                  onChange={(c) => updateContent("notifications", c)}
                  clinicId={clinicId}
                />
              )}
              {activeSection === "contact" && (
                <ContactPreview
                  content={currentSection.content_json}
                  onChange={(c) => updateContent("contact", c)}
                  clinicId={clinicId}
                />
              )}
              {activeSection === "footer" && (
                <FooterEditor
                  content={currentSection.content_json}
                  onChange={(c) => updateContent("footer", c)}
                  clinicId={clinicId}
                />
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminHomepage;
