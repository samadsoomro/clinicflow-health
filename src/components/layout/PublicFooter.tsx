import { Activity, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const PublicFooter = () => (
  <footer className="border-t border-border bg-card">
    <div className="container py-12">
      <div className="grid gap-8 md:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Activity className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">ClinicToken</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Modern health management platform for clinics and hospitals.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-display font-semibold text-foreground">Quick Links</h4>
          <div className="flex flex-col gap-2">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">Home</Link>
            <Link to="/tokens" className="text-sm text-muted-foreground hover:text-primary transition-colors">Live Tokens</Link>
            <Link to="/notifications" className="text-sm text-muted-foreground hover:text-primary transition-colors">Notifications</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-display font-semibold text-foreground">Services</h4>
          <div className="flex flex-col gap-2">
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link>
            <Link to="/location" className="text-sm text-muted-foreground hover:text-primary transition-colors">Location</Link>
            <Link to="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors">Patient Registration</Link>
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-display font-semibold text-foreground">Contact</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <span>support@clinictoken.health</span>
            <span>+1 (555) 123-4567</span>
          </div>
        </div>
      </div>
      <div className="mt-8 flex items-center justify-center gap-1 border-t border-border pt-6 text-sm text-muted-foreground">
        Made with <Heart className="h-3.5 w-3.5 text-accent" /> by ClinicToken CMS Pro
      </div>
    </div>
  </footer>
);

export default PublicFooter;
