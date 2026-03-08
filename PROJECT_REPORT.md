# ClinicToken CMS Pro — Full Project Report

> **Generated:** 2026-03-08  
> **Purpose:** Comprehensive handoff document for AI system (AntiGravity) to connect and deploy this project with Supabase.

---

## 1. Project Overview

| Field | Value |
|-------|-------|
| **Project Name** | ClinicToken CMS Pro |
| **Framework** | React 18 + Vite + TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui components |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Deployment** | Vercel (SPA) |
| **State Management** | React Context + TanStack React Query |
| **Animation** | Framer Motion |
| **PDF Generation** | pdf-lib (patient cards), jspdf + jspdf-autotable (token exports) |
| **Spreadsheet** | xlsx |
| **URL Pattern** | `{clinic-subdomain}.health.vercel.app` |

**Purpose:** A multi-tenant SaaS platform for medical clinics to manage doctors, patients, live consultation tokens, notifications, and public-facing clinic websites — all isolated per clinic via subdomain.

---

## 2. URL & Routing Structure

### Public Routes (wrapped in `PublicLayout`)

| Route | Purpose | Access Level |
|-------|---------|-------------|
| `/` | Clinic homepage (hero, stats, doctors, certifications, notifications, contact, footer) | Public |
| `/tokens` | Live token display — shows current serving/waiting tokens per doctor in real-time | Public |
| `/notifications` | Public notifications/announcements page | Public |
| `/location` | Clinic location with Google Maps embed | Public |
| `/contact` | Contact Us form (submits to `contact_messages` table) | Public |
| `/patient-card` | Patient health ID card preview & PDF download | Authenticated patient |

### Standalone Public Routes

| Route | Purpose | Access Level |
|-------|---------|-------------|
| `/token` | Full-screen token display (TV/kiosk mode) | Public |
| `/login` | Email/password login page | Public |
| `/register` | Patient registration page (creates auth user + patient record + role) | Public |

### Admin Routes (wrapped in `AdminRoute` guard + `AdminDashboard` layout with sidebar)

| Route | Purpose | Access Level |
|-------|---------|-------------|
| `/admin` | Admin dashboard overview (stats cards + recent activity) | `clinic_admin` |
| `/admin/homepage` | Homepage CMS editor (7 sections + SEO) | `clinic_admin` |
| `/admin/doctors` | Doctor CRUD management | `clinic_admin` |
| `/admin/tokens` | Token issuance, management, receipt printing, export | `clinic_admin` |
| `/admin/patients` | Patient records table | `clinic_admin` |
| `/admin/notifications` | Notification CRUD (broadcast alerts) | `clinic_admin` |
| `/admin/cards` | Patient card management & PDF generation | `clinic_admin` |
| `/admin/location` | Location settings | `clinic_admin` |
| `/admin/contact-messages` | Contact form submissions inbox | `clinic_admin` |
| `/admin/settings` | Clinic identity, theme, QR config, legal, logo, maps | `clinic_admin` |

### Super Admin Routes (wrapped in `SuperAdminLayout`)

| Route | Purpose | Access Level |
|-------|---------|-------------|
| `/superadmin` | Platform-wide overview & statistics | `super_admin` |
| `/superadmin/clinics` | Create/edit/toggle/delete clinics | `super_admin` |
| `/superadmin/admins` | Create clinic admins, view all admins, delete accounts | `super_admin` |
| `/superadmin/settings` | Super admin settings | `super_admin` |

### Catch-all

| Route | Purpose |
|-------|---------|
| `*` | 404 Not Found page |

---

## 3. Super Admin Details

| Field | Value |
|-------|-------|
| **Login Route** | `/login` (same login page for all roles) |
| **Role Detection** | After login, `useAuth` hook fetches `user_roles` table; if role is `super_admin`, UI shows super admin navigation |
| **Default Credentials** | No hardcoded credentials. Super admin must be manually inserted into `user_roles` table with `role = 'super_admin'` |

### Super Admin Capabilities

1. **Create new clinics** — name, subdomain, contact email, phone, address, domain name
2. **Edit existing clinics** — all fields
3. **Toggle clinic active/inactive** — `is_active` boolean
4. **Delete clinics** — with confirmation dialog
5. **Search clinics** — by name or subdomain
6. **Create clinic admins** — via Edge Function `create-clinic-admin` (creates Supabase Auth user + assigns `clinic_admin` role + links to clinic)
7. **View all admins** — table showing name, email, role, assigned clinic
8. **Delete admin accounts** — removes from `user_roles`
9. **View platform-wide statistics** — across all clinics

### How Super Admin Creates a Clinic

1. Navigate to `/superadmin/clinics`
2. Click "Add Clinic"
3. Fill: clinic name, subdomain (validated: lowercase + numbers + hyphens only, max 30 chars), contact email, phone, address
4. System shows live URL preview: `{subdomain}.health.vercel.app`
5. Saves to `clinics` table
6. Success toast shows full public + admin URLs

### How Super Admin Creates a Clinic Admin

1. Navigate to `/superadmin/admins`
2. Click "Add Admin"
3. Fill: full name, email, password, select clinic from dropdown
4. System calls Edge Function `create-clinic-admin` which:
   - Verifies caller is `super_admin` (via JWT)
   - Creates user via `auth.admin.createUser()` with email auto-confirmed
   - Inserts `clinic_admin` role in `user_roles` with `clinic_id`
   - Profile is auto-created by `handle_new_user` database trigger

---

## 4. Clinic Admin Details

| Field | Value |
|-------|-------|
| **Login Route** | `/login` |
| **Creation Method** | Created by super admin via Edge Function |
| **clinic_id Assignment** | Stored in `user_roles.clinic_id` — set during admin creation |
| **clinic_id Resolution** | `useClinicId()` hook reads `clinic_id` from the authenticated user's `clinic_admin` role in `user_roles` |

### Clinic Admin Capabilities

1. Manage doctors (CRUD)
2. Issue, manage, and print tokens
3. View and manage patients
4. Create/edit/toggle notifications
5. Edit all 7 homepage CMS sections + SEO metadata
6. Generate and manage patient cards
7. View contact form submissions (mark read, delete)
8. Configure clinic settings (identity, theme, QR, legal, logo, maps)
9. Export token data (PDF, Excel)
10. Configure website URL for token receipts

---

## 5. Patient Details

### Registration

| Field | Details |
|-------|---------|
| **Route** | `/register` |
| **Fields** | Full Name, Age, Gender (Male/Female/Other), Phone, Email, Password |
| **Auth** | Supabase Auth `signUp()` with email verification required |

### Patient Unique ID Generation

```
Gender Prefix: M (male), F (female), O (other)
Sequence: Count of existing patients in that clinic + 1
Format: {prefix}-{number}
Examples: M-1, F-2, M-3, F-4
```

The system queries: `SELECT COUNT(*) FROM patients WHERE clinic_id = ?` then formats as `{genderPrefix}-{count+1}`.

**Note:** This is a clinic-wide sequential number, NOT gender-specific sequential.

### Patient Registration Flow

1. User fills form at `/register`
2. `supabase.auth.signUp()` creates auth user
3. System generates `formatted_patient_id` (e.g., `M-1`)
4. Inserts into `patients` table with `user_id`, `clinic_id`, all fields
5. Inserts `patient` role into `user_roles` with `clinic_id`
6. Redirects to `/login` with "check email" message

### Patient Features

- **Login:** `/login` → standard email/password
- **Patient Card:** `/patient-card` — shows card preview with clinic branding, patient details, QR placeholder, terms & conditions; PDF download via `pdf-lib`
- **Patient Card PDF:** A4 portrait, top half = dark background with patient info, bottom half = white with terms & contact info

---

## 6. Multi-Clinic Architecture

### Subdomain Detection (`useClinicContext.tsx`)

```javascript
function extractSubdomain() {
  const hostname = window.location.hostname;
  
  // Skip for: localhost, IP addresses, lovable.app previews
  
  // Pattern: *.health.vercel.app (4 parts)
  // e.g. "zahidaclinic.health.vercel.app" → "zahidaclinic"
  if (parts.length === 4 && parts[2] === "vercel" && parts[3] === "app") {
    return parts[0]; // unless it equals the project name or "www"
  }
  
  // Custom domains: first segment
  return parts[0];
}
```

### Clinic Resolution Flow

1. Extract subdomain from hostname
2. Check `?clinic=` query parameter (override)
3. If subdomain found → query `clinics` WHERE `subdomain = ?`
4. If no subdomain (localhost/preview) → try `DEFAULT_CLINIC_ID` (`a0000000-0000-0000-0000-000000000001`)
5. If default not found → fetch first active clinic
6. If nothing found → set `error = "Clinic not found"`

### ClinicProvider Context

Provides to all components:
- `clinic` — full clinic data object
- `clinicId` — UUID string
- `loading` — boolean
- `error` — string or null
- `refreshClinic()` — re-fetches clinic data

### Data Isolation

- **Frontend:** All Supabase queries include `.eq("clinic_id", clinicId)`
- **Backend (RLS):** Row Level Security policies use `has_clinic_role(auth.uid(), 'clinic_admin', clinic_id)` to restrict admin access
- **Public reads:** Some tables allow public SELECT (doctors, clinics, tokens, homepage_sections, certifications)
- **Admin writes:** Restricted to the admin's assigned clinic via RLS

---

## 7. All Admin Dashboard Modules

### 7.1 Overview (`/admin`)

| Detail | Value |
|--------|-------|
| **Component** | `AdminOverview.tsx` |
| **Tables Read** | `patients`, `doctors`, `tokens`, `notifications` |
| **Features** | 4 stat cards (total patients, active doctors, tokens today, active notifications), recent activity feed (last 5 tokens) |

### 7.2 Doctors (`/admin/doctors`)

| Detail | Value |
|--------|-------|
| **Component** | `AdminDoctors.tsx` |
| **Table** | `doctors` |
| **Features** | CRUD doctors (name, specialization, image, status), toggle active/inactive, image upload to `clinic-assets` storage bucket |

### 7.3 Token Management (`/admin/tokens`)

| Detail | Value |
|--------|-------|
| **Component** | `AdminTokens.tsx` |
| **Tables** | `tokens`, `doctors`, `clinics` |
| **Features** | Issue tokens, manage statuses, auto-progression, receipt printing, PDF/Excel export, website URL field, daily reset |

(See Section 8 for full token logic)

### 7.4 Patients (`/admin/patients`)

| Detail | Value |
|--------|-------|
| **Component** | `AdminPatients.tsx` |
| **Table** | `patients` |
| **Features** | View all clinic patients, search, patient details |

### 7.5 Notifications (`/admin/notifications`)

| Detail | Value |
|--------|-------|
| **Component** | `AdminNotifications.tsx` |
| **Table** | `notifications` |
| **Features** | CRUD notifications (title, message, priority: normal/urgent), toggle active/inactive |

### 7.6 Homepage Editor (`/admin/homepage`)

| Detail | Value |
|--------|-------|
| **Component** | `AdminHomepage.tsx` |
| **Table** | `homepage_sections` |
| **Features** | Edit 7 sections (hero, stats, doctors, certifications, notifications, contact, footer), enable/disable sections, SEO metadata |

(See Section 10 for full CMS details)

### 7.7 Patient Cards (`/admin/cards`)

| Detail | Value |
|--------|-------|
| **Component** | `AdminPatientCards.tsx` |
| **Tables** | `patients`, `clinics` |
| **Features** | View patient cards, generate PDFs for patients |

### 7.8 Location (`/admin/location`)

| Detail | Value |
|--------|-------|
| **Component** | `AdminLocation.tsx` |
| **Table** | `clinics` |
| **Features** | Configure location details, Google Maps embed URL |

### 7.9 Contact Messages (`/admin/contact-messages`)

| Detail | Value |
|--------|-------|
| **Component** | `AdminContactMessages.tsx` |
| **Table** | `contact_messages` |
| **Features** | View submitted contact forms, mark as read, delete messages |

### 7.10 Settings (`/admin/settings`)

| Detail | Value |
|--------|-------|
| **Component** | `AdminSettings.tsx` |
| **Table** | `clinics` |
| **Sections** | Clinic Identity, QR Configuration, Website Theme, Google Maps Embed, Legal |

(See Section 13 for full settings details)

---

## 8. Token System — Full Logic

### Token Issuance

1. Admin selects doctor from dropdown (only active doctors shown)
2. Optionally enters patient name (walk-in support)
3. System calculates next token number: `MAX(token_number) + 1` from today's tokens for that clinic
4. Inserts into `tokens` table: `{clinic_id, doctor_id, token_number, patient_name, status: 'waiting'}`
5. Success toast with "Print Token" action button

### Token Number Sequence

- **Scope:** Clinic-wide (not per-doctor)
- **Reset:** Daily (queries only today's tokens using `created_at` date filter)
- **Calculation:** `Math.max(...todayTokens.map(t => t.token_number)) + 1` or `1` if no tokens today

### Token Statuses

| Status | Color | Meaning |
|--------|-------|---------|
| `waiting` | Yellow/Orange | Patient is in queue |
| `serving` | Green | Patient is currently being seen |
| `unavailable` | Red/Gray | Patient was not present, permanently skipped |
| `completed` | Muted Gray | Consultation finished |

### Actions by Status

| Current Status | Available Actions |
|---------------|-------------------|
| `waiting` | Mark Serving, Mark Unavailable, Print |
| `serving` | Mark Completed, Mark Unavailable, Print |
| `unavailable` | Print |
| `completed` | Print |

### Auto-Progression Logic

When admin clicks **Mark Completed** on a serving token:

```
1. Query next waiting token for same doctor_id, same clinic_id, today only,
   ordered by token_number ASC, LIMIT 1
2. Update current token → status = 'completed'
3. If next waiting token exists → update it → status = 'serving'
```

This means:
- Admin clicks "Mark Serving" only ONCE (for the first token of the day)
- Every subsequent "Mark Completed" automatically promotes the next waiting token
- Unavailable tokens are skipped (query filters `status = 'waiting'` only)

### Mark Serving Logic

When admin clicks Mark Serving:
1. Find any currently serving tokens for the same doctor
2. Auto-complete them (set to `completed`)
3. Set the clicked token to `serving`

### Website URL Field

- Editable field at top of Token Management page
- Pre-filled from `clinics.qr_base_url`
- Save button updates `clinics.qr_base_url`
- Inline success/error feedback
- Same field also editable in Admin Settings (single source of truth)

### Token Export

- **Excel:** Uses `xlsx` library, exports today's tokens as `.xlsx`
- **PDF:** Uses `jspdf` + `jspdf-autotable`, exports as table PDF
- **Filename format:** `Today's Tokens - {ClinicShortName} - {DD-MM-YYYY HH:MM}.{ext}`

### Daily Reset

- "Reset Today" button deletes all of today's tokens (with confirmation dialog)

---

## 9. Live Token Page Logic

| Field | Value |
|-------|-------|
| **Route** | `/tokens` (public, within `PublicLayout`) |
| **Component** | `LiveTokens.tsx` |
| **Clinic Detection** | `usePublicClinicId()` → from `ClinicProvider` subdomain context |

### Queue Display Logic (per doctor)

```javascript
getQueueState(doctorId) {
  servingToken = tokens.find(status === 'serving')
  waitingTokens = tokens.filter(status === 'waiting')  // ordered by token_number
  nextWaiting = waitingTokens[0]
  unavailableTokens = tokens.filter(status === 'unavailable')
}
```

### Display States

| State | What Shows |
|-------|-----------|
| Serving + Waiting exist | Green "NOW SERVING" box (serving token) + Yellow "GET READY" box (next waiting) |
| Only Waiting (no serving) | Orange "WAITING" box (first waiting token) |
| Only Unavailable (no serving/waiting) | "No active tokens. Queue is clear." |
| Nothing at all | "No tokens issued yet" |
| Unavailable tokens exist | Small dimmed red cards at bottom showing skipped tokens |

### Realtime Updates

```javascript
// Primary: Supabase realtime subscription
supabase.channel('live-tokens-' + clinicId)
  .on('postgres_changes', { event: '*', table: 'tokens', filter: `clinic_id=eq.${clinicId}` }, fetchData)
  .subscribe()

// Fallback: 5-second polling if realtime connection drops
```

---

## 10. Homepage CMS

### Sections (stored in `homepage_sections` table)

| Section Name | Editor Component | Content JSON Fields |
|-------------|-----------------|-------------------|
| `hero` | `HeroEditor.tsx` | title, subtitle, image_url, cta_text, cta_link |
| `stats` | `StatsEditor.tsx` | Array of stat objects (label, value, icon) |
| `doctors` | `DoctorsEditor.tsx` | show_on_homepage flag, display_limit |
| `certifications` | `CertificationsEditor.tsx` | Managed via `certifications` table |
| `notifications` | `NotificationsPreview.tsx` | Preview of active notifications |
| `contact` | `ContactPreview.tsx` | phone, address, working_hours, email (local overrides) |
| `footer` | `FooterEditor.tsx` | social_links, copyright_text, additional_links |

### Storage Structure

Each section is a row in `homepage_sections`:
```
id, clinic_id, section_name, content_json (JSONB), is_enabled (boolean), display_order (integer)
```

### SEO Metadata

Stored directly on `clinics` table:
- `seo_title` — page title
- `seo_description` — meta description
- `og_image_url` — Open Graph image

---

## 11. Patient Card System

### Card Layout

- **Top half:** Dark gradient background with clinic name, patient name, patient ID (large colored text), age, gender, registration date, QR code placeholder
- **Bottom half:** White background with Terms & Conditions text, clinic contact details (address, phone, email, working hours, emergency contact)
- **Footer:** "Generated by {clinic name} — ClinicToken CMS Pro"

### Fields on Card

| Field | Source |
|-------|--------|
| Clinic Name | `clinics.clinic_name` |
| Patient Name | `patients.full_name` |
| Patient ID | `patients.formatted_patient_id` (e.g., M-1) |
| Age | `patients.age` |
| Gender | `patients.gender` |
| Registration Date | `patients.created_at` |
| Terms & Conditions | `clinics.terms_conditions` |
| Address | `clinics.address` |
| Phone | `clinics.contact_phone` |
| Email | `clinics.contact_email` |
| Working Hours | `clinics.working_hours` |
| Emergency Contact | `clinics.emergency_contact` |

### QR Code

- Placeholder rectangle drawn on PDF
- URL format: `{clinics.qr_base_url}/patient/{formatted_patient_id}`

### PDF Generation

- Library: `pdf-lib`
- Format: A4 portrait (595.28 x 841.89 points)
- Fonts: Helvetica, Helvetica-Bold (standard PDF fonts)
- Colors: Teal primary, dark background top, white bottom

---

## 12. Contact Us Module

### Public Form (`/contact`)

| Field | Required |
|-------|---------|
| Name | Yes |
| Email | Yes |
| Subject | Yes |
| Message | Yes |

Submits to `contact_messages` table with `clinic_id`.

### Admin Module (`/admin/contact-messages`)

- Table view of all messages for the clinic
- Mark as read/unread (`is_read` boolean)
- Delete messages
- Realtime enabled on `contact_messages` table

### RLS

- Public can INSERT (anyone can submit)
- Only `clinic_admin` for that clinic can SELECT, UPDATE, DELETE

---

## 13. Settings Module (`/admin/settings`)

### Clinic Identity Section

| Field | Column |
|-------|--------|
| Clinic Name | `clinic_name` |
| Short Name / Logo Label | `short_name` (max 10 chars) |
| Subdomain | `subdomain` |
| Clinic Logo | `logo_url` (uploaded to `clinic-assets/{clinic_id}/logo/`) |
| Navbar Preview | Live preview of logo + short name + clinic name |

### QR Configuration Section

| Field | Column |
|-------|--------|
| QR Base URL | `qr_base_url` |
| Example link preview | Shows `{qr_base_url}/patient/123` |

### Website Theme Section

| Field | Column |
|-------|--------|
| Primary Theme Color | `theme_color` (color picker + hex input) |
| Secondary Theme Color | `secondary_theme_color` (color picker + hex input) |

### Google Maps Embed Section

| Field | Column |
|-------|--------|
| Google Maps Embed URL | `maps_embed_url` |
| Validation | Must start with `https://www.google.com/maps/embed` |
| Preview | Live iframe preview |

### Legal Section

| Field | Column |
|-------|--------|
| Terms & Conditions | `terms_conditions` (textarea) |

### Logo Upload

- Uploads to Supabase Storage bucket `clinic-assets`
- Path: `{clinic_id}/logo/logo-{timestamp}.{ext}`
- Updates `clinics.logo_url` with public URL
- Calls `refreshClinic()` to update navbar immediately

---

## 14. Token Receipt / Printout

### When It Appears

1. **After token issuance:** "Print Token" button in success toast
2. **In Today's Tokens table:** Print button on every token row (all statuses)

### Receipt Component

`src/components/admin/TokenReceipt.tsx` — modal with receipt preview

### Fields on Receipt

| Field | Source |
|-------|--------|
| Clinic Logo | `clinics.logo_url` |
| Clinic Name | `clinics.clinic_name` |
| Website URL | `clinics.qr_base_url` |
| Token Number | `tokens.token_number` (displayed as `#N`, `text-3xl font-bold`) |
| Patient Name | `tokens.patient_name` (or `—` if empty) |
| Doctor Name | `doctors.name` |
| Specialization | `doctors.specialization` |
| Date & Time | `tokens.created_at` → `DD-MM-YYYY  HH:MM AM/PM` (single line) |
| Status | `tokens.status` |
| Contact Phone | `homepage_sections.contact.phone` → fallback `clinics.contact_phone` → `'Not provided'` |
| Address | `homepage_sections.contact.address` → fallback `clinics.address` → `'Not provided'` |
| Working Hours | `homepage_sections.contact.working_hours` → fallback `clinics.working_hours` → `''` |

### Contact Info Source Priority

1. Homepage Editor Contact section (`homepage_sections` WHERE `section_name = 'contact'` → `content_json.phone/address/working_hours`)
2. Clinics table (`contact_phone`, `address`, `working_hours`)
3. Default string (`'Not provided'`)

### Waiting Message

```
Please wait for your token
number to be called.

Check live token status at:
{clinics.qr_base_url}
```
If `qr_base_url` is empty, only the first two lines show.

### Design

- Width: fixed `300px`
- Font: monospace (`font-mono`)
- Dividers: dashed borders
- Text size: `text-[11px]` body, `text-3xl` token number, `text-sm` clinic name
- Colors: pure black on white (thermal printer optimized)
- Footer: "Powered by ClinicToken CMS" (fixed, non-removable)

### Print

```css
@media print {
  body * { visibility: hidden !important; }
  .receipt-printable, .receipt-printable * { visibility: visible !important; }
  .receipt-printable { position: absolute; left: 0; top: 0; width: 80mm; padding: 4px; font-size: 11px; }
  .receipt-no-print { display: none !important; }
}
```

### Download PDF

Opens new window with receipt HTML, triggers `window.print()`.  
Filename: `Token-{number}-{PatientName}-{DD-MM-YYYY}.pdf`

---

## 15. Supabase Database Tables

### `clinics`

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `clinic_name` | text | No | — | Display name |
| `subdomain` | text | No | — | Unique subdomain identifier |
| `short_name` | text | Yes | `''` | Short label for navbar |
| `domain_name` | text | Yes | — | Custom domain |
| `logo_url` | text | Yes | `''` | Clinic logo URL |
| `theme_color` | text | Yes | `'#0ea5e9'` | Primary theme color |
| `secondary_theme_color` | text | Yes | `'#1e293b'` | Secondary theme color |
| `qr_base_url` | text | Yes | `''` | Base URL for QR codes and receipts |
| `maps_embed_url` | text | Yes | `''` | Google Maps embed URL |
| `address` | text | Yes | `''` | Clinic address |
| `contact_phone` | text | Yes | `''` | Phone number |
| `contact_email` | text | Yes | `''` | Email address |
| `working_hours` | text | Yes | `''` | Working hours text |
| `emergency_contact` | text | Yes | `''` | Emergency contact |
| `terms_conditions` | text | Yes | `''` | Terms & conditions text |
| `card_background_color` | text | Yes | `'#1e293b'` | Patient card background |
| `hero_title` | text | Yes | `''` | Homepage hero title |
| `hero_subtitle` | text | Yes | `''` | Homepage hero subtitle |
| `seo_title` | text | Yes | `''` | SEO page title |
| `seo_description` | text | Yes | `''` | SEO meta description |
| `og_image_url` | text | Yes | `''` | Open Graph image |
| `latitude` | float8 | Yes | `0` | Map latitude |
| `longitude` | float8 | Yes | `0` | Map longitude |
| `is_active` | boolean | Yes | `true` | Active/inactive toggle |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |

### `profiles`

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `id` | uuid | No | — | FK → `auth.users.id` (PK) |
| `full_name` | text | No | `''` | User's display name |
| `email` | text | Yes | `''` | Email (denormalized) |
| `phone` | text | Yes | `''` | Phone number |
| `avatar_url` | text | Yes | `''` | Profile picture URL |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |

**Auto-created** by `handle_new_user()` trigger on `auth.users` INSERT.

### `user_roles`

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | No | — | FK → `auth.users.id` |
| `role` | `app_role` enum | No | — | `super_admin`, `clinic_admin`, or `patient` |
| `clinic_id` | uuid | Yes | — | FK → `clinics.id` (null for super_admin) |

### `doctors`

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `clinic_id` | uuid | No | — | FK → `clinics.id` |
| `name` | text | No | — | Doctor's full name |
| `specialization` | text | No | — | Medical specialization |
| `image_url` | text | Yes | `''` | Profile photo URL |
| `status` | text | Yes | `'active'` | `active` or `inactive` |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |

### `patients`

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `clinic_id` | uuid | No | — | FK → `clinics.id` |
| `user_id` | uuid | Yes | — | FK → `auth.users.id` (nullable for walk-ins) |
| `full_name` | text | No | — | Patient's name |
| `age` | integer | No | `0` | Age |
| `gender` | text | No | `'male'` | `male`, `female`, `other` |
| `email` | text | Yes | `''` | Email |
| `phone` | text | Yes | `''` | Phone |
| `formatted_patient_id` | text | No | — | Unique ID like `M-1`, `F-2` |
| `created_at` | timestamptz | Yes | `now()` | Registration date |

### `tokens`

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `clinic_id` | uuid | No | — | FK → `clinics.id` |
| `doctor_id` | uuid | No | — | FK → `doctors.id` |
| `token_number` | integer | No | — | Sequential daily number |
| `patient_name` | text | No | — | Patient name (can be empty string for walk-ins) |
| `status` | text | Yes | `'waiting'` | `waiting`, `serving`, `unavailable`, `completed` |
| `created_at` | timestamptz | Yes | `now()` | Issuance timestamp |

### `notifications`

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `clinic_id` | uuid | No | — | FK → `clinics.id` |
| `title` | text | No | — | Notification title |
| `message` | text | No | — | Notification body |
| `priority` | text | Yes | `'normal'` | `normal` or `urgent` |
| `is_active` | boolean | Yes | `true` | Active/inactive toggle |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |

### `homepage_sections`

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `clinic_id` | uuid | No | — | FK → `clinics.id` |
| `section_name` | text | No | — | `hero`, `stats`, `doctors`, `certifications`, `notifications`, `contact`, `footer` |
| `content_json` | jsonb | No | `'{}'` | Section configuration data |
| `is_enabled` | boolean | No | `true` | Show/hide section |
| `display_order` | integer | No | `0` | Sort order |
| `updated_at` | timestamptz | Yes | `now()` | Last update |

### `certifications`

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `clinic_id` | uuid | No | — | FK → `clinics.id` |
| `title` | text | No | `''` | Certification title |
| `image_url` | text | No | — | Certificate image URL |
| `sort_order` | integer | Yes | `0` | Display order |
| `created_at` | timestamptz | Yes | `now()` | Creation timestamp |

### `contact_messages`

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| `id` | uuid | No | `gen_random_uuid()` | Primary key |
| `clinic_id` | uuid | No | — | FK → `clinics.id` |
| `name` | text | No | — | Sender name |
| `email` | text | No | — | Sender email |
| `subject` | text | No | — | Message subject |
| `message` | text | No | — | Message body |
| `is_read` | boolean | No | `false` | Read/unread status |
| `created_at` | timestamptz | No | `now()` | Submission timestamp |

---

## 16. Database Enums

```sql
CREATE TYPE public.app_role AS ENUM ('super_admin', 'clinic_admin', 'patient');
```

## 17. Database Functions

| Function | Purpose | Security |
|----------|---------|----------|
| `has_role(_user_id, _role)` | Check if user has a specific role | SECURITY DEFINER |
| `has_clinic_role(_user_id, _role, _clinic_id)` | Check if user has role for specific clinic | SECURITY DEFINER |
| `handle_new_user()` | Trigger function: auto-creates profile on auth signup | SECURITY DEFINER |
| `extract_date(ts)` | Extract date from timestamp | IMMUTABLE |

## 18. Database Trigger

```sql
-- On auth.users INSERT → auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 19. RLS Policies Summary

| Table | Public Read | Admin Write | Notes |
|-------|-----------|-------------|-------|
| `clinics` | Yes (all) | Super admin: ALL, Clinic admin: UPDATE own | |
| `profiles` | Own only | Own UPDATE only, System INSERT | No DELETE |
| `user_roles` | Own only | Super admin: ALL | |
| `doctors` | Yes (all) | Clinic admin: ALL (own clinic) | Also: authenticated INSERT/UPDATE |
| `patients` | Own record | Clinic admin: SELECT/UPDATE/DELETE (own clinic) | Super admin: SELECT/DELETE all |
| `tokens` | Yes (all) | Clinic admin: ALL (own clinic) | Also: authenticated INSERT/UPDATE |
| `notifications` | Active only | Clinic admin: ALL (own clinic) | Super admin: ALL |
| `homepage_sections` | Yes (all) | Clinic admin: ALL (own clinic) | Super admin: ALL |
| `certifications` | Yes (all) | Clinic admin: ALL (own clinic) | |
| `contact_messages` | — | Clinic admin: SELECT/UPDATE/DELETE (own clinic) | Public: INSERT only |

---

## 20. Realtime-Enabled Tables

| Table | Realtime Enabled |
|-------|-----------------|
| `tokens` | ✅ Yes |
| `notifications` | ✅ Yes |
| `contact_messages` | ✅ Yes |

---

## 21. Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `clinic-assets` | Yes | Clinic logos, doctor images, certifications, hero images |

### Folder Structure

```
clinic-assets/
  {clinic_id}/
    logo/          — Clinic logo images
    hero/          — Homepage hero images
    certifications/ — Certification images
    doctors/       — Doctor profile photos
```

---

## 22. Edge Functions

### `create-clinic-admin`

| Field | Value |
|-------|-------|
| **Path** | `supabase/functions/create-clinic-admin/index.ts` |
| **Purpose** | Create a new clinic admin user (auth + role assignment) |
| **Auth** | Requires `super_admin` role (verified via JWT) |
| **Input** | `{ full_name, email, password, clinic_id }` |
| **Process** | 1. Verify caller is super_admin, 2. Create user via `auth.admin.createUser()`, 3. Insert `clinic_admin` role |
| **Uses** | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` secrets |

---

## 23. Environment Variables Required

| Variable | Purpose | Where Set |
|----------|---------|-----------|
| `VITE_SUPABASE_URL` | Supabase project URL | `.env` (auto-managed) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | `.env` (auto-managed) |

### Edge Function Secrets (already configured)

| Secret | Purpose |
|--------|---------|
| `SUPABASE_URL` | Used in edge functions |
| `SUPABASE_ANON_KEY` | Used in edge functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin operations in edge functions |
| `SUPABASE_DB_URL` | Direct database connection |
| `SUPABASE_PUBLISHABLE_KEY` | Public anon key |
| `LOVABLE_API_KEY` | Lovable platform integration |

---

## 24. Vercel Deployment Configuration

### Project Name

```
health
```

This gives base domain: `health.vercel.app`

### `vercel.json`

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### Wildcard Domain

Configure in Vercel project Settings → Domains:
```
*.health.vercel.app
```

### Environment Variables (Vercel)

```
VITE_SUPABASE_URL = {supabase_project_url}
VITE_SUPABASE_PUBLISHABLE_KEY = {supabase_anon_key}
```

---

## 25. Project File Structure

```
├── index.html
├── package.json
├── vercel.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── components.json                    # shadcn/ui config
├── supabase/
│   ├── config.toml                    # Supabase project config
│   └── functions/
│       └── create-clinic-admin/
│           └── index.ts               # Edge function
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
└── src/
    ├── App.tsx                        # Root component, all routes
    ├── App.css
    ├── index.css                      # Tailwind + design tokens + print CSS
    ├── main.tsx                       # Entry point
    ├── assets/
    │   └── hero-pattern.jpg
    ├── integrations/supabase/
    │   ├── client.ts                  # Auto-generated Supabase client
    │   └── types.ts                   # Auto-generated TypeScript types
    ├── hooks/
    │   ├── useAuth.tsx                # Auth context + RBAC
    │   ├── useClinicContext.tsx        # Clinic provider + subdomain detection
    │   ├── useClinic.ts               # Clinic hooks (useClinicId, usePublicClinicId, useClinicDoctors)
    │   ├── use-mobile.tsx             # Mobile breakpoint hook
    │   └── use-toast.ts               # Toast hook
    ├── lib/
    │   ├── utils.ts                   # cn() utility
    │   └── patientCardPdf.ts          # PDF generation for patient cards
    ├── components/
    │   ├── AdminRoute.tsx             # Route guard for admin routes
    │   ├── NavLink.tsx                # Navigation link component
    │   ├── ThemeToggle.tsx            # Dark/light mode toggle
    │   ├── layout/
    │   │   ├── PublicLayout.tsx        # Public pages layout (navbar + footer + outlet)
    │   │   ├── PublicNavbar.tsx        # Public navigation bar
    │   │   └── PublicFooter.tsx        # Public footer
    │   ├── admin/
    │   │   ├── TokenReceipt.tsx        # Thermal receipt modal
    │   │   └── homepage/
    │   │       ├── HeroEditor.tsx
    │   │       ├── StatsEditor.tsx
    │   │       ├── DoctorsEditor.tsx
    │   │       ├── CertificationsEditor.tsx
    │   │       ├── NotificationsPreview.tsx
    │   │       ├── ContactPreview.tsx
    │   │       └── FooterEditor.tsx
    │   └── ui/                        # shadcn/ui components (30+ files)
    └── pages/
        ├── Index.tsx                  # Homepage
        ├── LiveTokens.tsx             # Live token display
        ├── TokenDisplay.tsx           # Full-screen token display
        ├── Contact.tsx                # Contact form
        ├── Location.tsx               # Location page
        ├── Notifications.tsx          # Notifications page
        ├── PatientCard.tsx            # Patient card page
        ├── Login.tsx                  # Login page
        ├── Register.tsx               # Registration page
        ├── NotFound.tsx               # 404 page
        ├── admin/
        │   ├── AdminDashboard.tsx      # Admin layout with sidebar
        │   ├── AdminOverview.tsx       # Dashboard overview
        │   ├── AdminDoctors.tsx        # Doctor management
        │   ├── AdminTokens.tsx         # Token management
        │   ├── AdminPatients.tsx       # Patient management
        │   ├── AdminNotifications.tsx  # Notification management
        │   ├── AdminHomepage.tsx       # Homepage CMS
        │   ├── AdminPatientCards.tsx   # Patient card management
        │   ├── AdminLocation.tsx       # Location settings
        │   ├── AdminContactMessages.tsx # Contact inbox
        │   ├── AdminSettings.tsx       # Clinic settings
        │   └── AdminPlaceholder.tsx    # Placeholder page
        └── superadmin/
            ├── SuperAdminLayout.tsx    # Super admin layout
            ├── SuperAdminOverview.tsx  # Platform overview
            ├── SuperAdminClinics.tsx   # Clinic management
            ├── SuperAdminAdmins.tsx    # Admin management
            └── SuperAdminSettings.tsx  # Super admin settings
```

---

## 26. Current Known Issues / Incomplete Features

1. **Patient ID sequence** — Uses `COUNT(*)` which may produce duplicates if patients are deleted; a proper database sequence or `MAX(formatted_patient_id)` would be more robust
2. **QR Code on Patient Card** — Currently rendered as a placeholder rectangle in the PDF, not an actual scannable QR code
3. **Theme colors** — `theme_color` and `secondary_theme_color` are stored but not dynamically applied to the frontend CSS variables at runtime
4. **Token Display page** (`/token`) — Exists as a route but the component may be a simplified version of LiveTokens for TV/kiosk mode
5. **Role-based login redirect** — After login, there's no automatic redirect based on role (super_admin → /superadmin, clinic_admin → /admin, patient → /patient-card)
6. **Email verification** — Patient registration requires email verification, but clinic admins created via edge function have auto-confirmed emails
7. **Patient dashboard** — No dedicated patient dashboard exists; patients only have the `/patient-card` page

---

## 27. Instructions for AntiGravity

This is a **React + Vite + TypeScript** project with a **Supabase** backend. The project is currently connected to a Lovable Cloud Supabase instance and should be migrated to a standalone Supabase project.

### Steps to Complete

1. **Create Supabase Project** named `health-cms-pro`
2. **Run all SQL migrations** to create:
   - The `app_role` enum
   - All 9 tables (`clinics`, `profiles`, `user_roles`, `doctors`, `patients`, `tokens`, `notifications`, `homepage_sections`, `certifications`, `contact_messages`)
   - All RLS policies (see Section 19)
   - All database functions (`has_role`, `has_clinic_role`, `handle_new_user`, `extract_date`)
   - The `handle_new_user` trigger on `auth.users`
3. **Enable Realtime** on tables: `tokens`, `notifications`, `contact_messages`
4. **Create Storage Bucket:** `clinic-assets` (public)
5. **Deploy Edge Function:** `create-clinic-admin`
6. **Set Edge Function Secrets:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
7. **Create initial super admin:**
   - Create user via Supabase Auth dashboard
   - Insert into `user_roles`: `{ user_id, role: 'super_admin', clinic_id: null }`
8. **Push code to GitHub** and connect the repo
9. **Update environment variables** in `.env` and Vercel:
   - `VITE_SUPABASE_URL` = new Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = new Supabase anon key
10. **Deploy on Vercel:**
    - Project name: `health`
    - Add wildcard domain: `*.health.vercel.app`
    - Set environment variables
11. **Verify all modules** connect correctly to the new Supabase project
12. **Create first clinic** via super admin panel at `health.vercel.app/superadmin`

The codebase does NOT need modification — only the Supabase backend needs to be provisioned and the environment variables updated.
