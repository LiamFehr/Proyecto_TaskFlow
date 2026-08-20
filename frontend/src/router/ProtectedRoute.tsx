import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Props {
    roles?: string[];
    children?: React.ReactNode;
}

const ProtectedRoute = ({ roles, children }: Props) => {
    const token = useAuthStore((state) => state.token);
    const userRole = useAuthStore((state) => state.rol);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (roles && userRole && !roles.includes(userRole)) {
        return <Navigate to="/" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
