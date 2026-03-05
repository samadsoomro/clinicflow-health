import { motion } from "framer-motion";
import { Activity, UserPlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";

const Register = () => (
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
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" placeholder="Your full name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" placeholder="Age" />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select>
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
            <Input id="phone" placeholder="+92 300 1234567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="regEmail">Email</Label>
            <Input id="regEmail" type="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="regPassword">Password</Label>
            <Input id="regPassword" type="password" placeholder="••••••••" />
          </div>
          <Button variant="hero" className="w-full">
            <UserPlus className="mr-2 h-4 w-4" />
            Register
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

export default Register;
