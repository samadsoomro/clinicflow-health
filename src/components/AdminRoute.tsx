import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useClinicId } from "@/hooks/useClinic";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isSuperAdmin, isClinicAdmin } = useAuth();
  const { clinicId } = useClinicId();

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

  // Clinic admins trying /superadmin are handled by SuperAdminLayout
  // Super admins can access /admin too
  if (!isSuperAdmin && !isClinicAdmin(clinicId)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
