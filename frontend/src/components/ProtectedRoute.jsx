import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute({ children, roles }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const rol = useAuthStore((state) => state.rol);

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    if (roles && !roles.includes(rol)) return <Navigate to="/" replace />;

    return children;
}
