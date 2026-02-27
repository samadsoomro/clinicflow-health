import { motion } from "framer-motion";
import { Activity, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

const Login = () => (
  <div className="flex min-h-screen">
    <div className="hidden w-1/2 gradient-hero lg:flex lg:items-center lg:justify-center">
      <div className="max-w-md text-center px-8">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10 backdrop-blur-sm">
          <Activity className="h-8 w-8 text-primary-foreground" />
        </div>
        <h2 className="mb-3 font-display text-3xl font-bold text-primary-foreground">ClinicToken CMS Pro</h2>
        <p className="text-primary-foreground/70">Manage your clinic, track tokens, and care for patients — all in one place.</p>
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
          <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button className="text-xs text-primary hover:underline">Forgot password?</button>
            </div>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <Button variant="hero" className="w-full">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">Register</Link>
        </p>
      </motion.div>
    </div>
  </div>
);

export default Login;
