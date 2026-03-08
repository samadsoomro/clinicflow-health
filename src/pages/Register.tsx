import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Activity, UserPlus, ArrowLeft, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePublicClinicId } from "@/hooks/useClinic";

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
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({ fullName: "", age: "", gender: "", phone: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const set = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };

  // Debounced email check
  const checkEmail = useCallback(async (email: string) => {
    const normalized = email.toLowerCase().trim();
    const err = validateEmail(normalized);
    if (err) { setEmailStatus("idle"); return; }
    setEmailStatus("checking");
    const { data } = await supabase.from("patients").select("id").eq("email", normalized).eq("clinic_id", clinicId).maybeSingle();
    setEmailStatus(data ? "taken" : "available");
  }, [clinicId]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!form.email) { setEmailStatus("idle"); return; }
    debounceRef.current = setTimeout(() => checkEmail(form.email), 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [form.email, checkEmail]);

  const validateField = (field: string): string | null => {
    const v = form[field as keyof typeof form];
    switch (field) {
      case "fullName": return !v.trim() ? "Full name is required" : v.trim().length < 3 ? "Full name must be at least 3 characters" : null;
      case "age": { const n = parseInt(v); return !v ? "Age is required" : (isNaN(n) || n < 1 || n > 120) ? "Please enter a valid age between 1 and 120" : null; }
      case "gender": return !v ? "Please select a gender" : null;
      case "phone": return !v.trim() ? "Phone is required" : v.replace(/\D/g, "").length < 10 ? "Please enter a valid phone number" : null;
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
    if (emailStatus === "taken") { setErrors((p) => ({ ...p, email: "This email is already registered. Please login instead." })); return; }

    setLoading(true);
    const normalizedEmail = form.email.toLowerCase().trim();

    // Final duplicate check
    const { data: existing } = await supabase.from("patients").select("id").eq("email", normalizedEmail).eq("clinic_id", clinicId).maybeSingle();
    if (existing) { setLoading(false); setErrors((p) => ({ ...p, email: "This email is already registered with this clinic. Please login or use a different email." })); return; }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail, password: form.password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: form.fullName.trim() } },
    });

    if (authError) {
      setLoading(false);
      const msg = authError.message.toLowerCase().includes("already registered") ? "This email is already registered. Please login instead." : authError.message;
      toast({ title: "Registration failed", description: msg, variant: "destructive" });
      return;
    }

    if (authData.user) {
      const genderPrefix = form.gender === "male" ? "M" : form.gender === "female" ? "F" : "O";
      const { count } = await supabase.from("patients").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId);
      const formattedId = `${genderPrefix}-${(count || 0) + 1}`;

      await supabase.from("patients").insert({
        clinic_id: clinicId, user_id: authData.user.id, full_name: form.fullName.trim(),
        age: parseInt(form.age), gender: form.gender, phone: form.phone.trim(),
        email: normalizedEmail, formatted_patient_id: formattedId,
      });
      await supabase.from("user_roles").insert({ user_id: authData.user.id, role: "patient" as const, clinic_id: clinicId });

      setLoading(false);
      toast({ title: "✓ Registration successful!", description: `Your Patient ID is: ${formattedId}. Please check your email to verify, then sign in.` });
      setTimeout(() => navigate("/login"), 3000);
      return;
    }
    setLoading(false);
  };

  const pwStrength = getPasswordStrength(form.password);
  const hasEmailError = !!errors.email || emailStatus === "taken";

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 gradient-hero lg:flex lg:items-center lg:justify-center">
        <div className="max-w-md text-center px-8">
          <Link to="/" className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10 backdrop-blur-sm">
            <Activity className="h-8 w-8 text-primary-foreground" />
          </Link>
          <h2 className="mb-3 font-display text-3xl font-bold text-primary-foreground">Join ClinicToken</h2>
          <p className="text-primary-foreground/70">Register as a patient and get your unique health ID card instantly.</p>
        </div>
      </div>
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <Link to="/" className="mb-6 inline-flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">ClinicToken</span>
            </Link>
            <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Create Account</h1>
            <p className="text-sm text-muted-foreground">Register as a new patient</p>
          </div>
          <form className="space-y-3" onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div className="space-y-1">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="Your full name" maxLength={100} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} onBlur={() => handleBlur("fullName")} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" placeholder="Age" min={1} max={120} value={form.age} onChange={(e) => set("age", e.target.value)} onBlur={() => handleBlur("age")} />
                {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
              </div>
              <div className="space-y-1">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => { set("gender", v); setErrors((p) => ({ ...p, gender: null })); }}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-xs text-destructive">{errors.gender}</p>}
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+92 300 1234567" maxLength={20} value={form.phone} onChange={(e) => set("phone", e.target.value)} onBlur={() => handleBlur("phone")} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="regEmail">Email</Label>
              <Input id="regEmail" type="email" placeholder="you@example.com" maxLength={255} value={form.email}
                onChange={(e) => { set("email", e.target.value); setEmailStatus("idle"); }}
                onBlur={() => handleBlur("email")}
                className={hasEmailError ? "border-destructive" : emailStatus === "available" ? "border-green-500" : ""}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              {!errors.email && emailStatus === "checking" && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Checking availability...</p>
              )}
              {!errors.email && emailStatus === "available" && (
                <p className="flex items-center gap-1 text-xs text-green-600"><Check className="h-3 w-3" /> Email is available</p>
              )}
              {!errors.email && emailStatus === "taken" && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <X className="h-3 w-3" /> This email is already registered.{" "}
                  <Link to="/login" className="font-medium underline text-primary">Login here →</Link>
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="regPassword">Password</Label>
              <Input id="regPassword" type="password" placeholder="••••••••" maxLength={128} value={form.password} onChange={(e) => set("password", e.target.value)} onBlur={() => handleBlur("password")} />
              {form.password && (
                <div className="flex items-center gap-2 mt-1">
                  <div className={`h-1.5 flex-1 rounded-full ${pwStrength.color}`} />
                  <span className="text-[10px] text-muted-foreground">{pwStrength.label}</span>
                </div>
              )}
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" maxLength={128} value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} onBlur={() => handleBlur("confirmPassword")} />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>

            <Button variant="hero" className="w-full" type="submit" disabled={loading || emailStatus === "taken"}>
              <UserPlus className="mr-2 h-4 w-4" />
              {loading ? "Registering..." : "Register"}
            </Button>
          </form>
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
            </p>
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
