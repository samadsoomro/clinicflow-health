import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const role = localStorage.getItem("clinictoken_role");
  if (role !== "admin") {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default AdminRoute;
