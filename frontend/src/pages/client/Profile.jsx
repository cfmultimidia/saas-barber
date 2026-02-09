import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import './Profile.css';

export default function ClientProfile() {
    const navigate = useNavigate();
    const { user, logout, updateProfile } = useAuth();
    const [editModal, setEditModal] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        email: user?.email || '',
    });
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            await updateProfile(formData);
            setEditModal(false);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/cliente/login');
    };

    return (
        <div className="profile-page">
            <div className="container">
                <Card className="profile-card">
                    <div className="profile-avatar">
                        <span>{user?.name?.[0] || '?'}</span>
                    </div>
                    <h2 className="profile-name">{user?.name}</h2>
                    <p className="profile-email">{user?.email}</p>
                    <Button variant="outline" onClick={() => setEditModal(true)}>
                        Editar Perfil
                    </Button>
                </Card>

                <div className="profile-menu">
                    <button className="menu-item" onClick={() => navigate('/cliente')}>
                        <span>📅</span><span>Meus Agendamentos</span><span>→</span>
                    </button>
                    <button className="menu-item">
                        <span>🔔</span><span>Notificações</span><span>→</span>
                    </button>
                    <button className="menu-item">
                        <span>🔒</span><span>Mudar Senha</span><span>→</span>
                    </button>
                </div>

                <Button variant="ghost" fullWidth onClick={handleLogout}>Sair</Button>
            </div>

            <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Editar Perfil">
                <Input label="Nome" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} />
                <Input label="Email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} />
                <Button variant="primary" loading={loading} onClick={handleUpdate}>Salvar</Button>
            </Modal>
        </div>
    );
}
