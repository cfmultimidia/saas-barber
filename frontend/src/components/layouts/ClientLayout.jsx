import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Toast from '../ui/Toast';
import './ClientLayout.css';

export default function ClientLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated } = useAuth();

    const navItems = [
        { path: '/cliente', label: 'Início', icon: '🏠' },
        { path: '/cliente/buscar', label: 'Buscar', icon: '🔍' },
        { path: '/cliente/perfil', label: 'Perfil', icon: '👤' },
    ];

    const isActive = (path) => {
        if (path === '/cliente') {
            return location.pathname === '/cliente';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="client-layout">
            <header className="client-header">
                <div className="container">
                    <div className="header-content">
                        <div className="logo" onClick={() => navigate('/cliente')}>
                            <span className="logo-icon">✂️</span>
                            <span className="logo-text">AgendaFácil</span>
                        </div>
                        {isAuthenticated ? (
                            <div className="header-user" onClick={() => navigate('/cliente/perfil')}>
                                <span className="user-name">{user?.name?.split(' ')[0]}</span>
                                <div className="user-avatar">
                                    {user?.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.name} />
                                    ) : (
                                        <span>{user?.name?.[0] || '?'}</span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <button className="header-login" onClick={() => navigate('/login')}>
                                Entrar
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="client-main">
                <Outlet />
            </main>

            <nav className="client-nav">
                {navItems.map((item) => (
                    <button
                        key={item.path}
                        className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </button>
                ))}
            </nav>

            <Toast />
        </div>
    );
}
