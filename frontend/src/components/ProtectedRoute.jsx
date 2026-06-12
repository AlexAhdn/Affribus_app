import { Navigate } from 'react-router-dom';
import { getSessionContext, getSessionUser, logout } from '../utils/auth';

const ProtectedRoute = ({ children, roleRequired }) => {
    const user = getSessionUser();
    const token = localStorage.getItem('token');
    const context = getSessionContext();
    const isCompanyAdmin = !!user?.company_id && ['admin', 'company'].includes(user?.role);
    const isReservationUser = !!user?.company_id && user?.role === 'company_reservation';
    const hasRequiredRole =
        !roleRequired ||
        (roleRequired === 'company' && isCompanyAdmin) ||
        (roleRequired === 'companyReservation' && (isCompanyAdmin || isReservationUser)) ||
        (roleRequired === 'client' && !user?.company_id && user?.role === 'client') ||
        (roleRequired === 'admin' && !user?.company_id && user?.role === 'admin') ||
        (roleRequired === 'admin' && user?.role === 'super_admin');

    // Si pas de token, retour au login
    if (!token || !user) {
        return <Navigate to={roleRequired === 'client' ? '/login' : '/admin/login'} replace />;
    }

    // Si un rôle spécifique est requis et ne correspond pas
    if (!hasRequiredRole) {
        if (roleRequired === 'client') {
            logout();
            return <Navigate to="/login" replace />;
        }

        if (['company', 'companyReservation', 'admin'].includes(roleRequired) && context === 'client') {
            logout();
            return <Navigate to="/admin/login" replace />;
        }

        // Redirige selon le rôle réel pour éviter de rester bloqué
        return <Navigate to={isReservationUser ? '/company/reservations' : (user.company_id ? '/company/dashboard' : (user.role === 'client' ? '/voyageur' : '/admin/dashboard'))} replace />;
    }

    return children;
};

export default ProtectedRoute;
