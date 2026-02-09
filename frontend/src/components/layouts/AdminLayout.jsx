import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useEffect } from 'react';
import Toast from '../ui/Toast';
import './AdminLayout.css';

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, salon, logout } = useAuth();
    const { joinSalonRoom } = useApp();

    useEffect(() => {
        if (salon?.id) {
            joinSalonRoom(salon.id);
        }
    }, [salon?.id]);

    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: '📊' },
        { path: '/admin/agenda', label: 'Agenda', icon: '📅' },
        { path: '/admin/profissionais', label: 'Equipe', icon: '👥' },
        { path: '/admin/servicos', label: 'Serviços', icon: '✂️' },
        { path: '/admin/clientes', label: 'Clientes', icon: '👤' },
        { path: '/admin/relatorios', label: 'Relatórios', icon: '📈' },
        { path: '/admin/configuracoes', label: 'Configurações', icon: '⚙️' },
    ];

    const isActive = (path) => {
        if (path === '/admin') return location.pathname === '/admin';
        return location.pathname.startsWith(path);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <span className="sidebar-logo">✂️</span>
                    <span className="sidebar-title">AgendaFácil</span>
                </div>
                <div className="sidebar-salon">
                    <div className="salon-avatar">{salon?.name?.[0] || '?'}</div>
                    <div className="salon-info">
                        <span className="salon-name">{salon?.name || 'Meu Salão'}</span>
                        <span className="salon-role">Administrador</span>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <button key={item.path} className={`nav-item ${isActive(item.path) ? 'active' : ''}`} onClick={() => navigate(item.path)}>
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>🚪 Sair</button>
                </div>
            </aside>
            <main className="admin-main">
                <header className="admin-header">
                    <h1>{navItems.find(i => isActive(i.path))?.label || 'Dashboard'}</h1>
                    <div className="header-user">
                        <span>{user?.name}</span>
                    </div>
                </header>
                <div className="admin-content"><Outlet /></div>
            </main>
            <Toast />
        </div>
    );
}
