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

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

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
        navigate(`/admin${suffix}`);
      } else {
        toast({ title: "Welcome!", description: "Redirecting to your patient card..." });
        navigate(`/patient-card${suffix}`);
      }
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 gradient-hero lg:flex lg:items-center lg:justify-center">
        <div className="max-w-md text-center px-8">
          <ClinicLink to="/" className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10 backdrop-blur-sm">
            <Activity className="h-8 w-8 text-primary-foreground" />
          </ClinicLink>
          <h2 className="mb-3 font-display text-3xl font-bold text-primary-foreground">ClinicToken CMS Pro</h2>
          <p className="text-primary-foreground/70">Manage your clinic, track tokens, and care for patients — all in one place.</p>
        </div>
      </div>
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <ClinicLink to="/" className="mb-6 inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">ClinicToken</span>
            </ClinicLink>
            <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your account</p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button variant="hero" className="w-full" type="submit" disabled={loading}>
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <ClinicLink to="/register" className="font-medium text-primary hover:underline">Register</ClinicLink>
            </p>
            <ClinicLink to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
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
