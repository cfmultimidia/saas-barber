import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedTypes = [] }) {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin" style={{
                    width: 40,
                    height: 40,
                    border: '3px solid var(--color-border)',
                    borderTopColor: 'var(--color-primary)',
                    borderRadius: '50%'
                }} />
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to appropriate login based on the route
        const path = window.location.pathname;
        if (path.startsWith('/admin')) {
            return <Navigate to="/admin/login" replace />;
        }
        if (path.startsWith('/profissional')) {
            return <Navigate to="/profissional/login" replace />;
        }
        return <Navigate to="/cliente/login" replace />;
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(user.type)) {
        // Redirect to appropriate portal based on user type
        if (user.type === 'salon') {
            return <Navigate to="/admin" replace />;
        }
        if (user.type === 'professional') {
            return <Navigate to="/profissional" replace />;
        }
        return <Navigate to="/cliente" replace />;
    }

    return children;
}
