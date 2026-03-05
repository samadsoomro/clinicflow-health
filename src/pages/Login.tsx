import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, LogIn, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAIL = "admin@clinictoken.com";
const ADMIN_PASSWORD = "admin123";

// Demo patient credentials (any mock patient can log in with password "patient123")
const PATIENT_CREDENTIALS: Record<string, string> = {
  "ahmad@email.com": "p1",
  "fatima@email.com": "p2",
  "usman@email.com": "p3",
  "ayesha@email.com": "p4",
  "bilal@email.com": "p5",
};
const PATIENT_PASSWORD = "patient123";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem("clinictoken_role", "admin");
      toast({ title: "Welcome Admin!", description: "Redirecting to dashboard..." });
      navigate("/admin");
    } else if (PATIENT_CREDENTIALS[email] && password === PATIENT_PASSWORD) {
      localStorage.setItem("clinictoken_role", "patient");
      localStorage.setItem("clinictoken_patient_id", PATIENT_CREDENTIALS[email]);
      toast({ title: "Welcome!", description: "Redirecting to your patient card..." });
      navigate("/patient-card");
    } else {
      toast({ title: "Invalid credentials", description: "Please check your email and password.", variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 gradient-hero lg:flex lg:items-center lg:justify-center">
        <div className="max-w-md text-center px-8">
          <Link to="/" className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10 backdrop-blur-sm">
            <Activity className="h-8 w-8 text-primary-foreground" />
          </Link>
          <h2 className="mb-3 font-display text-3xl font-bold text-primary-foreground">ClinicToken CMS Pro</h2>
          <p className="text-primary-foreground/70">Manage your clinic, track tokens, and care for patients — all in one place.</p>
        </div>
      </div>
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <Link to="/" className="mb-6 inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">ClinicToken</span>
            </Link>
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
                <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
              </div>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button variant="hero" className="w-full" type="submit">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </form>
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">Register</Link>
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

export default Login;
