import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Rating from '../../components/ui/Rating';
import './Profile.css';

export default function ProfessionalProfile() {
    const navigate = useNavigate();
    const { professional, user, logout } = useAuth();
    const [editModal, setEditModal] = useState(false);
    const [form, setForm] = useState({ name: professional?.name || user?.name || '', phone: professional?.phone || '', specialty: professional?.specialty || '', bio: professional?.bio || '' });

    const handleSave = async () => { /* Update profile API call */ setEditModal(false); };
    const handleLogout = async () => { await logout(); navigate('/login'); };

    return (
        <div className="prof-profile">
            <Card className="profile-card">
                <div className="profile-avatar">{professional?.name?.[0] || user?.name?.[0] || '?'}</div>
                <h2 className="profile-name">{professional?.name || user?.name}</h2>
                <span className="profile-specialty">{professional?.specialty}</span>
                <Rating.Display value={professional?.average_rating} count={professional?.total_reviews} />
                <Button variant="outline" onClick={() => setEditModal(true)}>Editar Perfil</Button>
            </Card>
            <Card className="stats-card">
                <div className="stat"><span className="stat-value">{professional?.total_appointments || 0}</span><span className="stat-label">Atendimentos</span></div>
                <div className="stat"><span className="stat-value">{professional?.clients_served || 0}</span><span className="stat-label">Clientes</span></div>
                <div className="stat"><span className="stat-value">{((professional?.average_rating || 0) * 20).toFixed(0)}%</span><span className="stat-label">Satisfação</span></div>
            </Card>
            <div className="profile-menu">
                <button className="menu-item"><span>📅</span><span>Horários de Trabalho</span><span>→</span></button>
                <button className="menu-item"><span>🔔</span><span>Notificações</span><span>→</span></button>
                <button className="menu-item"><span>🔒</span><span>Mudar Senha</span><span>→</span></button>
            </div>
            <Button variant="ghost" fullWidth onClick={handleLogout}>Sair da Conta</Button>
            <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Editar Perfil">
                <div className="form-grid">
                    <Input label="Nome" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    <Input label="Telefone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} mask="phone" />
                    <Input label="Especialidade" value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} />
                </div>
                <Button variant="primary" fullWidth onClick={handleSave}>Salvar</Button>
            </Modal>
        </div>
    );
}
