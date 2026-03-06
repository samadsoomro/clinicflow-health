import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getClinicId } from "@/hooks/useClinic";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isSuperAdmin, isClinicAdmin } = useAuth();
  const clinicId = getClinicId();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isSuperAdmin && !isClinicAdmin(clinicId)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
