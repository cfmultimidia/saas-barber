import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useEffect } from 'react';
import Toast from '../ui/Toast';
import './ProfessionalLayout.css';

export default function ProfessionalLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, professional, logout } = useAuth();
    const { joinProfessionalRoom } = useApp();

    useEffect(() => { if (professional?.id) joinProfessionalRoom(professional.id); }, [professional?.id]);

    const navItems = [
        { path: '/profissional', label: 'Hoje', icon: '📊' },
        { path: '/profissional/agenda', label: 'Agenda', icon: '📅' },
        { path: '/profissional/avaliacoes', label: 'Avaliações', icon: '⭐' },
        { path: '/profissional/perfil', label: 'Perfil', icon: '👤' },
    ];

    const isActive = (path) => path === '/profissional' ? location.pathname === '/profissional' : location.pathname.startsWith(path);
    const handleLogout = async () => { await logout(); navigate('/profissional/login'); };

    return (
        <div className="prof-layout">
            <header className="prof-header">
                <div className="container">
                    <div className="header-content">
                        <div className="header-user">
                            <div className="user-avatar">{professional?.name?.[0] || user?.name?.[0] || '?'}</div>
                            <div className="user-info">
                                <span className="user-name">{professional?.name || user?.name}</span>
                                <span className="user-role">Profissional</span>
                            </div>
                        </div>
                        <button className="logout-btn" onClick={handleLogout}>Sair</button>
                    </div>
                </div>
            </header>
            <main className="prof-main"><div className="container"><Outlet /></div></main>
            <nav className="prof-nav">
                {navItems.map(item => (
                    <button key={item.path} className={`nav-item ${isActive(item.path) ? 'active' : ''}`} onClick={() => navigate(item.path)}>
                        <span className="nav-icon">{item.icon}</span><span className="nav-label">{item.label}</span>
                    </button>
                ))}
            </nav>
            <Toast />
        </div>
    );
}
