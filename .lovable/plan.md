

## Plan: Enhance Homepage CMS Editor

### What exists now
- `/admin/home` route with `AdminHomepage.tsx` — sidebar-based editor for 6 sections (Hero, Stats, Doctors, Certifications, Notifications, Contact)
- Each section stored in `homepage_sections` table with `clinic_id` filtering
- Public `Index.tsx` renders sections dynamically
- `PublicFooter.tsx` is fully hardcoded (no CMS control)
- `AdminSettings.tsx` has "Homepage Content" (hero title/subtitle) that overlaps with the CMS — should be separated

### Changes

#### 1. Add Footer section to Homepage CMS

**Database**: Add a new default section `"footer"` with `display_order: 6` to the `DEFAULT_SECTIONS` array. No schema change needed — the existing `homepage_sections` table with `content_json` JSONB handles it.

**Footer content_json structure**:
```json
{
  "description": "",
  "phone": "",
  "email": "",
  "address": "",
  "copyright": "",
  "logo_override": "",
  "social_facebook": "",
  "social_instagram": "",
  "social_whatsapp": "",
  "social_linkedin": ""
}
```

**New component**: `src/components/admin/homepage/FooterEditor.tsx`
- Text fields for description, phone, email, address, copyright
- Social link inputs (Facebook, Instagram, WhatsApp, LinkedIn)
- Optional footer logo upload to `clinic-assets/{clinic_id}/footer`

#### 2. Update AdminHomepage.tsx
- Add `"footer"` to `DEFAULT_SECTIONS` and `SECTION_LABELS`
- Add `FooterEditor` rendering for `activeSection === "footer"`
- Change route from `/admin/home` to `/admin/homepage` in `App.tsx` and sidebar

#### 3. Enhance existing section editors

**DoctorsEditor** — Add `max_display` number input to control how many doctors show on homepage.

**NotificationsPreview** — Add `max_display` number input (default 3).

**ContactPreview** — Add editable fields for phone, email, address, working hours, and Google Maps embed URL directly in the CMS content_json (currently read-only from clinics table). These will override clinic defaults when set.

#### 4. Remove "Homepage Content" from AdminSettings
- Remove the hero title/subtitle card from `AdminSettings.tsx` since this is now managed in the Homepage CMS. Keep SEO fields in Settings.

#### 5. Update PublicFooter to be dynamic
- Refactor `PublicFooter.tsx` to accept props or fetch footer data from `homepage_sections`
- Load footer section content + clinic branding (logo, name) via `usePublicClinicId()`
- Render social links, custom copyright, contact info from CMS
- Fallback to clinic table data if no footer section configured

#### 6. Update Public Index.tsx
- Pass `max_display` from doctors section to limit rendered doctors
- Pass `max_display` from notifications section to limit rendered notifications
- Add Google Maps embed in contact section if URL provided

#### 7. Update sidebar route
- Change sidebar link from `/admin/home` to `/admin/homepage`
- Update `App.tsx` route accordingly

### Files to create
- `src/components/admin/homepage/FooterEditor.tsx`

### Files to modify
- `src/pages/admin/AdminHomepage.tsx` — add footer section + route label
- `src/pages/admin/AdminSettings.tsx` — remove Homepage Content card
- `src/pages/admin/AdminDashboard.tsx` — update sidebar path
- `src/App.tsx` — update route path
- `src/components/admin/homepage/DoctorsEditor.tsx` — add max_display
- `src/components/admin/homepage/NotificationsPreview.tsx` — add max_display
- `src/components/admin/homepage/ContactPreview.tsx` — add editable contact fields + maps URL
- `src/components/layout/PublicFooter.tsx` — dynamic footer from DB
- `src/pages/Index.tsx` — respect max_display, render maps embed

