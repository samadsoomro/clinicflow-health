import { Outlet } from "react-router-dom";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";
import { useClinicContext } from "@/hooks/useClinicContext";

const ClinicNotFound = () => (
  <div className="flex min-h-[60vh] items-center justify-center px-4">
    <div className="text-center max-w-md">
      <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
        <span className="font-display text-3xl font-bold text-muted-foreground">?</span>
      </div>
      <h1 className="mb-3 font-display text-2xl font-bold text-foreground">Clinic not found</h1>
      <p className="text-muted-foreground">
        The clinic you are looking for does not exist or may have been deactivated.
      </p>
    </div>
  </div>
);

const PublicLayout = () => {
  const { error, loading } = useClinicContext();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <PublicNavbar />
      <main className="flex-1">
        {loading ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <ClinicNotFound />
        ) : (
          <Outlet />
        )}
      </main>
      <PublicFooter />
    </div>
  );
};

export default PublicLayout;
