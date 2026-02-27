import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Activity, Users, Clock, Bell, Shield, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import heroPattern from "@/assets/hero-pattern.jpg";
const stats = [
  { label: "Active Clinics", value: "50+", icon: Building2 },
  { label: "Patients Served", value: "12K+", icon: Users },
  { label: "Tokens Today", value: "340", icon: Clock },
];

const features = [
  {
    icon: Clock,
    title: "Live Token Tracking",
    description: "Patients check their token number from anywhere in real-time. No more waiting in queues.",
  },
  {
    icon: Users,
    title: "Patient Card System",
    description: "Auto-generated patient IDs with downloadable A4 PDF cards including QR codes.",
  },
  {
    icon: Bell,
    title: "Instant Notifications",
    description: "Emergency alerts, closures, and updates pushed to all patients instantly.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Super Admin, Clinic Admin, and Patient roles with secure data isolation.",
  },
  {
    icon: Building2,
    title: "Multi-Clinic SaaS",
    description: "Each clinic gets its own subdomain, dashboard, and fully customizable settings.",
  },
  {
    icon: Activity,
    title: "Admin Dashboard",
    description: "Manage doctors, tokens, patients, notifications, and clinic settings from one place.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Index = () => {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32" style={{ backgroundImage: `url(${heroPattern})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 gradient-hero opacity-85" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary-foreground/80">
              <Activity className="h-4 w-4" />
              Modern Health CMS Platform
            </div>
            <h1 className="mb-6 font-display text-4xl font-extrabold leading-tight tracking-tight text-primary-foreground md:text-6xl">
              Smart Clinic Management,{" "}
              <span className="relative">
                Simplified
                <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full gradient-accent" />
              </span>
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-primary-foreground/70 md:text-xl">
              Real-time token tracking, patient cards, notifications, and multi-clinic management — all in one powerful platform built for modern healthcare.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link to="/register">
                <Button variant="accent" size="lg" className="px-8">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/tokens">
                <Button variant="outline" size="lg" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 px-8">
                  See Live Tokens
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mx-auto mt-16 grid max-w-2xl gap-4 sm:grid-cols-3"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1 rounded-xl border border-primary-foreground/10 bg-primary-foreground/5 p-4 backdrop-blur-sm">
                <stat.icon className="mb-1 h-5 w-5 text-primary-foreground/60" />
                <span className="font-display text-2xl font-bold text-primary-foreground">{stat.value}</span>
                <span className="text-xs text-primary-foreground/60">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              Everything Your Clinic Needs
            </h2>
            <p className="text-lg text-muted-foreground">
              A complete SaaS platform designed for hospitals and clinics of all sizes.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-1"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:gradient-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl rounded-3xl gradient-hero p-10 text-center md:p-16 shadow-elevated">
            <h2 className="mb-4 font-display text-3xl font-bold text-primary-foreground md:text-4xl">
              Ready to Modernize Your Clinic?
            </h2>
            <p className="mb-8 text-primary-foreground/70">
              Join hundreds of clinics already using ClinicToken CMS Pro for seamless patient management.
            </p>
            <Link to="/register">
              <Button variant="accent" size="lg" className="px-10">
                Start Free Today
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Index;
