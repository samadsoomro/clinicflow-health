import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";
import { useClinicContext } from "@/hooks/useClinicContext";

const NotFound = () => {
  const location = useLocation();
  const { clinic } = useClinicContext();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Preserve clinic param if it exists
  const params = new URLSearchParams(location.search);
  const clinicParam = params.get("clinic") || (clinic as any)?.subdomain;
  const homeUrl = clinicParam ? `/?clinic=${clinicParam}` : "/";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-muted/30">
      <div className="mb-8 flex flex-col items-center">
        {clinic?.logo_url ? (
          <img 
            src={clinic.logo_url} 
            alt={clinic.clinic_name} 
            className="mb-6 h-20 w-20 rounded-2xl object-cover shadow-lg"
          />
        ) : (
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Search className="h-10 w-10" />
          </div>
        )}
        <h1 className="mb-2 font-display text-5xl font-extrabold text-foreground">404</h1>
        <h2 className="mb-4 font-display text-xl font-bold text-foreground md:text-2xl">Page Not Found</h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
      </div>
      
      <Link to={homeUrl}>
        <Button size="lg" className="px-8 shadow-soft hover:shadow-card transition-all">
          <Home className="mr-2 h-4 w-4" />
          Go Back to Home
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
