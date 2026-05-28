import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, LogIn, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ClinicLink from "@/components/ClinicLink";
import { useClinicContext } from "@/hooks/useClinicContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { clinic } = useClinicContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast({ title: "Missing fields", description: "Please enter email and password.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      return;
    }

    if (data.user) {
      const params = new URLSearchParams(location.search);
      const clinic = params.get('clinic');
      const suffix = clinic ? `?clinic=${clinic}` : "";

      // Check roles to determine redirect
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      const roleList = roles?.map((r) => r.role) || [];

      if (roleList.includes("super_admin")) {
        toast({ title: "Welcome Super Admin!", description: "Redirecting to platform dashboard..." });
        navigate("/superadmin");
      } else if (roleList.includes("clinic_admin")) {
        toast({ title: "Welcome Admin!", description: "Redirecting to dashboard..." });
        navigate("/admin");
      } else {
        toast({ title: "Welcome!", description: "Redirecting to your home page..." });
        navigate(clinic ? `/?clinic=${clinic}` : "/");
      }
    }
  };

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
              <img src={clinic.logo_url} alt={clinic.clinic_name} className="relative h-20 w-20 rounded-2xl object-cover border border-white/15 shadow-xl" />
            </div>
          ) : (
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-emerald-500 shadow-xl border border-white/10">
              <span className="font-display text-3xl font-bold text-white">{clinic?.clinic_name?.charAt(0) || 'C'}</span>
            </div>
          )}
          <h2 className="mb-4 font-display text-3xl font-bold text-white tracking-tight">{clinic?.clinic_name || 'ClinicFlow'}</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Access appointments, track validated medical records, check real-time queue states, and manage your health information.
          </p>
        </motion.div>
      </div>

      {/* Right panel - Form Card */}
      <div className="relative flex w-full items-center justify-center p-6 lg:w-1/2 bg-background overflow-hidden">
        {/* Ambient Glowing background orbs */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-40 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl opacity-60" />
          <div className="absolute bottom-1/4 left-1/4 w-[450px] h-[450px] bg-emerald-500/5 rounded-full blur-3xl opacity-40" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-card/65 backdrop-blur-xl border border-border/80 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl relative"
        >
          <div className="mb-8 text-center lg:text-left">
            <ClinicLink to="/" className="mb-6 inline-flex items-center gap-2.5">
              {clinic?.logo_url ? (
                <img src={clinic.logo_url} alt={clinic.clinic_name} className="h-9 w-9 rounded-xl object-cover shadow-sm border border-border/50" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-emerald-500 text-white font-bold text-sm shadow">
                  {clinic?.clinic_name?.charAt(0) || 'C'}
                </div>
              )}
              <span className="font-display text-xl font-bold text-foreground tracking-tight">{clinic?.clinic_name || 'ClinicFlow'}</span>
            </ClinicLink>
            <h1 className="mb-1.5 font-display text-2xl font-bold text-foreground tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your secure patient account</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="rounded-xl bg-background/50 border-border/80 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 py-5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="rounded-xl bg-background/50 border-border/80 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 py-5"
              />
            </div>
            <Button variant="hero" className="w-full rounded-2xl py-6 font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01]" type="submit" disabled={loading}>
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <ClinicLink to="/register" className="font-semibold text-primary hover:text-primary/80 hover:underline">Register now</ClinicLink>
            </p>
            <div className="w-full border-t border-border/50 my-2" />
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

export default Login;
