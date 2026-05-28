import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Activity, UserPlus, ArrowLeft, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePublicClinicId } from "@/hooks/useClinic";
import ClinicLink from "@/components/ClinicLink";
import { useClinicContext } from "@/hooks/useClinicContext";

const validateEmail = (email: string) => {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address";
  return null;
};

const getPasswordStrength = (pw: string): { label: string; color: string } => {
  if (!pw || pw.length < 8) return { label: "Weak", color: "bg-destructive" };
  if (/[0-9]/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) return { label: "Strong", color: "bg-green-500" };
  return { label: "Fair", color: "bg-yellow-500" };
};

const Register = () => {
  const clinicId = usePublicClinicId();
  const { clinic } = useClinicContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [form, setForm] = useState({ fullName: "", age: "", gender: "", phone: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const emailDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const set = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
    if (formError) setFormError(null);

    if (field === "email") {
      setEmailStatus('idle');
      if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && emailRegex.test(value) && clinicId) {
        emailDebounceRef.current = setTimeout(async () => {
          setEmailStatus('checking');
          try {
            const response = await fetch(
              'https://swyyktpdjftxzazqedyx.supabase.co/functions/v1/check-email-availability',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: value.toLowerCase().trim(), clinic_id: clinicId })
              }
            );
            const result = await response.json();
            setEmailStatus(result.available ? 'available' : 'taken');
          } catch {
            setEmailStatus('idle');
          }
        }, 600);
      }
    }
  };

  const validateField = (field: string): string | null => {
    const v = form[field as keyof typeof form];
    switch (field) {
      case "fullName": {
        if (!v.trim()) return "Full name is required";
        if (v.trim().length < 3) return "Full name must be at least 3 characters";
        if (!/^[a-zA-Z\s.]+$/.test(v.trim())) return "Only standard alphabetic characters are allowed (no fancy fonts)";
        return null;
      }
      case "age": { const n = parseInt(v); return !v ? "Age is required" : (isNaN(n) || n < 1 || n > 120) ? "Please enter a valid age between 1 and 120" : null; }
      case "gender": return !v ? "Please select a gender" : null;
      case "phone": {
        if (!v.trim()) return "Phone is required";
        if (v.trim().length !== 10) return "Please enter exactly 10 digits after +92";
        return null;
      }
      case "email": return validateEmail(v);
      case "password": return !v ? "Password is required" : v.length < 8 ? "Password must be at least 8 characters" : null;
      case "confirmPassword": return !v ? "Please confirm your password" : v !== form.password ? "Passwords do not match" : null;
      default: return null;
    }
  };

  const handleBlur = (field: string) => {
    setErrors((p) => ({ ...p, [field]: validateField(field) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fields = ["fullName", "age", "gender", "phone", "email", "password", "confirmPassword"];
    const newErrors: Record<string, string | null> = {};
    fields.forEach((f) => { newErrors[f] = validateField(f); });
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;
    if (emailStatus === 'taken') {
      setFormError('This email is already registered. Please use a different email.');
      return;
    }
    if (emailStatus === 'checking') {
      setFormError('Please wait while we verify your email.');
      return;
    }
    setLoading(true);
    setFormError(null);
    const toTitleCase = (str: string) => {
      return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const formattedName = toTitleCase(form.fullName.trim());
    const formattedPhone = "+92 " + form.phone.trim();
    const normalizedEmail = form.email.toLowerCase().trim();

    // Check patients table for this clinic
    const { data: existingPatient } = await supabase
      .from("patients")
      .select("id")
      .eq("email", normalizedEmail)
      .eq("clinic_id", clinicId)
      .maybeSingle();

    if (existingPatient) {
      setFormError("This email is already registered with another account. Please use a different email or login instead.");
      setLoading(false);
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: form.password,
      options: {
        emailRedirectTo: undefined,
        data: { full_name: formattedName }
      },
    });

    // Handle existing unconfirmed users (identities is empty)
    if (authData?.user && authData.user.identities && authData.user.identities.length === 0) {
      setFormError("This email is already registered with another account. Please use a different email or login instead.");
      setLoading(false);
      return;
    }

    if (authError) {
      setLoading(false);
      let msg = authError.message;
      if (
        msg.toLowerCase().includes("already registered") ||
        msg.toLowerCase().includes("already exists") ||
        msg.toLowerCase().includes("user already")
      ) {
        msg = "This email is already registered with another account. Please use a different email or login instead.";
      }
      setFormError(msg);
      toast({ title: "Registration failed", description: msg, variant: "destructive" });
      return;
    }

    if (authData.user) {
      await supabase.from("patients").insert({
        clinic_id: clinicId, 
        user_id: authData.user.id, 
        full_name: formattedName,
        age: parseInt(form.age), 
        gender: form.gender, 
        phone: formattedPhone,
        email: normalizedEmail
      });

      const { data: patient } = await supabase
        .from('patients')
        .select('formatted_patient_id')
        .eq('user_id', authData.user.id)
        .single();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: form.password,
      });

      if (!signInError) {
        navigate('/patient-card');
      }

      setLoading(false);
      return;
    }
    setLoading(false);
  };

  const pwStrength = getPasswordStrength(form.password);
  const hasEmailError = !!errors.email;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left sidebar - Brand Hero */}
      <div className="hidden w-1/2 bg-slate-950 relative lg:flex lg:items-center lg:justify-center overflow-hidden border-r border-border/20">
        {/* Animated ambient backgrounds */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              x: [0, 30, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl opacity-50"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              x: [0, -20, 0],
              y: [0, 40, 0],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl opacity-35"
          />
          {/* Subtle Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-md text-center px-10 py-12 bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl relative z-10 mx-6"
        >
          {clinic?.logo_url ? (
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-primary/25 rounded-2xl blur-md" />
              <img src={clinic.logo_url} alt={clinic.clinic_name} className="relative h-20 w-20 rounded-2xl object-cover border border-white/15 shadow-xl" loading="lazy" />
            </div>
          ) : (
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-emerald-500 shadow-xl border border-white/10">
              <span className="font-display text-3xl font-bold text-white">{clinic?.clinic_name?.charAt(0) || 'C'}</span>
            </div>
          )}
          <h2 className="mb-4 font-display text-3xl font-bold text-white tracking-tight">Join {clinic?.clinic_name || 'ClinicFlow'}</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Register as a patient to receive your unique digital identity health card, book secure consultations, and access validated records.
          </p>
        </motion.div>
      </div>

      {/* Right panel - Form Card */}
      <div className="relative flex w-full items-center justify-center p-6 lg:w-1/2 bg-background overflow-hidden py-12">
        {/* Ambient Glowing background orbs */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-40 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-1/4 left-1/4 w-[450px] h-[450px] bg-emerald-500/5 rounded-full blur-3xl opacity-40" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-card/65 backdrop-blur-xl border border-border/80 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl relative my-auto"
        >
          <div className="mb-6 text-center lg:text-left">
            <ClinicLink to="/" className="mb-4 inline-flex items-center gap-2.5 lg:hidden">
              {clinic?.logo_url ? (
                <img src={clinic.logo_url} alt={clinic.clinic_name} className="h-9 w-9 rounded-xl object-cover shadow-sm border border-border/50" loading="lazy" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-emerald-500 text-white font-bold text-sm shadow">
                  {clinic?.clinic_name?.charAt(0) || 'C'}
                </div>
              )}
              <span className="font-display text-xl font-bold text-foreground tracking-tight">{clinic?.clinic_name || 'ClinicFlow'}</span>
            </ClinicLink>
            <h1 className="mb-1.5 font-display text-2xl font-bold text-foreground tracking-tight">Create Account</h1>
            <p className="text-sm text-muted-foreground">Register as a new clinic patient</p>
          </div>

          {formError && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold px-4.5 py-3 rounded-xl flex items-center gap-2"
            >
              <span>❌</span>
              <span>{formError}</span>
            </motion.div>
          )}

          <form className="space-y-3" onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div className="space-y-1">
              <Label htmlFor="fullName" className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider">Full Name</Label>
              <Input 
                id="fullName" 
                placeholder="Your full name" 
                maxLength={100} 
                value={form.fullName} 
                onChange={(e) => set("fullName", e.target.value)} 
                onBlur={() => handleBlur("fullName")} 
                className="rounded-xl bg-background/50 border-border/80 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 py-4.5"
              />
              {errors.fullName && <p className="text-[10px] font-semibold text-destructive mt-0.5">{errors.fullName}</p>}
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="age" className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider">Age</Label>
                <Input 
                  id="age" 
                  type="number" 
                  placeholder="Age" 
                  min={1} 
                  max={120} 
                  value={form.age} 
                  onChange={(e) => set("age", e.target.value)} 
                  onBlur={() => handleBlur("age")} 
                  className="rounded-xl bg-background/50 border-border/80 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 py-4.5"
                />
                {errors.age && <p className="text-[10px] font-semibold text-destructive mt-0.5">{errors.age}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider">Gender</Label>
                <Select value={form.gender} onValueChange={(v) => { set("gender", v); setErrors((p) => ({ ...p, gender: null })); }}>
                  <SelectTrigger className="rounded-xl bg-background/50 border-border/80 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 py-4.5 text-muted-foreground"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="rounded-xl bg-popover border-border">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-[10px] font-semibold text-destructive mt-0.5">{errors.gender}</p>}
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider">Phone Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center justify-center rounded-xl border border-border bg-muted px-4 text-xs font-bold text-primary">
                  +92
                </div>
                <Input 
                  id="phone" 
                  placeholder="3001234567" 
                  maxLength={10} 
                  value={form.phone} 
                  onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))} 
                  onBlur={() => handleBlur("phone")} 
                  className="rounded-xl bg-background/50 border-border/80 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 py-4.5"
                />
              </div>
              {errors.phone && <p className="text-[10px] font-semibold text-destructive mt-0.5">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="regEmail" className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider">Email Address</Label>
              <Input 
                id="regEmail" 
                type="email" 
                placeholder="you@example.com" 
                maxLength={255} 
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                className={`rounded-xl bg-background/50 border-border/80 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 py-4.5 ${errors.email ? "border-destructive focus:ring-destructive/20 focus:border-destructive" : ""}`}
              />
              {errors.email && <p className="text-[10px] font-semibold text-destructive mt-0.5">{errors.email}</p>}
              {emailStatus === 'checking' && (
                <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-[10px] font-semibold">Checking availability...</span>
                </div>
              )}
              {emailStatus === 'available' && (
                <div className="flex items-center gap-1.5 mt-1 text-emerald-600">
                  <Check className="h-3 w-3" />
                  <span className="text-[10px] font-bold">Email is available</span>
                </div>
              )}
              {emailStatus === 'taken' && (
                <div className="flex items-center gap-1.5 mt-1 text-destructive">
                  <X className="h-3 w-3" />
                  <span className="text-[10px] font-bold">This email is already taken.</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="regPassword" className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider">Password</Label>
              <Input 
                id="regPassword" 
                type="password" 
                placeholder="••••••••" 
                maxLength={128} 
                value={form.password} 
                onChange={(e) => set("password", e.target.value)} 
                onBlur={() => handleBlur("password")} 
                className="rounded-xl bg-background/50 border-border/80 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 py-4.5"
              />
              {form.password && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: pwStrength.label === "Weak" ? "33%" : pwStrength.label === "Fair" ? "66%" : "100%",
                        backgroundColor: pwStrength.label === "Weak" ? "#ef4444" : pwStrength.label === "Fair" ? "#f59e0b" : "#10b981"
                      }}
                      transition={{ duration: 0.3 }}
                      className="absolute top-0 left-0 bottom-0 rounded-full"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{pwStrength.label}</span>
                </div>
              )}
              {errors.password && <p className="text-[10px] font-semibold text-destructive mt-0.5">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder="••••••••" 
                maxLength={128} 
                value={form.confirmPassword} 
                onChange={(e) => set("confirmPassword", e.target.value)} 
                onBlur={() => handleBlur("confirmPassword")} 
                className="rounded-xl bg-background/50 border-border/80 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 py-4.5"
              />
              {errors.confirmPassword && <p className="text-[10px] font-semibold text-destructive mt-0.5">{errors.confirmPassword}</p>}
            </div>

            <Button variant="hero" className="w-full rounded-2xl py-6 font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01] mt-2" type="submit" disabled={loading}>
              <UserPlus className="mr-2 h-4 w-4" />
              {loading ? "Registering..." : "Register"}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <ClinicLink to="/login" className="font-semibold text-primary hover:text-primary/80 hover:underline">Sign in</ClinicLink>
            </p>
            <div className="w-full border-t border-border/50 my-1" />
            <ClinicLink to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Home
            </ClinicLink>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
