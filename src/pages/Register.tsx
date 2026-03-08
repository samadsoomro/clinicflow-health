import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, UserPlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePublicClinicId } from "@/hooks/useClinic";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !age || !gender || !phone.trim() || !email.trim() || !password) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Weak password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setLoading(true);

    // 1. Sign up via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim() },
      },
    });

    if (authError) {
      setLoading(false);
      toast({ title: "Registration failed", description: authError.message, variant: "destructive" });
      return;
    }

    if (authData.user) {
      const clinicId = getClinicId();
      const genderPrefix = gender === "male" ? "M" : gender === "female" ? "F" : "O";

      // Get next patient number for this clinic
      const { count } = await supabase
        .from("patients")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId);

      const patientNum = (count || 0) + 1;
      const formattedId = `${genderPrefix}-${patientNum}`;

      // 2. Insert patient record
      await supabase.from("patients").insert({
        clinic_id: clinicId,
        user_id: authData.user.id,
        full_name: fullName.trim(),
        age: parseInt(age),
        gender,
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        formatted_patient_id: formattedId,
      });

      // 3. Assign patient role
      await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        role: "patient" as const,
        clinic_id: clinicId,
      });
    }

    setLoading(false);
    toast({ title: "Registration successful!", description: "Please check your email to verify your account, then sign in." });
    navigate("/login");
  };

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
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="Your full name" maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" placeholder="Age" min={1} max={150} value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+92 300 1234567" maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regEmail">Email</Label>
              <Input id="regEmail" type="email" placeholder="you@example.com" maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regPassword">Password</Label>
              <Input id="regPassword" type="password" placeholder="••••••••" maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button variant="hero" className="w-full" type="submit" disabled={loading}>
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
