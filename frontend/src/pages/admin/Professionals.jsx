import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Rating from '../../components/ui/Rating';
import './Professionals.css';

export default function AdminProfessionals() {
    const { salon } = useAuth();
    const [professionals, setProfessionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ open: false, data: null });
    const [form, setForm] = useState({ name: '', email: '', phone: '', specialty: '', bio: '' });

    useEffect(() => { loadData(); }, [salon]);

    const loadData = async () => {
        if (!salon?.id) return;
        try {
            const res = await api.get(`/professionals?salon_id=${salon.id}`);
            setProfessionals(res.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        try {
            if (modal.data?.id) {
                await api.put(`/professionals/${modal.data.id}`, form);
            } else {
                await api.post('/professionals', { ...form, salon_id: salon.id });
            }
            setModal({ open: false, data: null });
            loadData();
        } catch (e) { console.error(e); }
    };

    const openEdit = (prof) => { setForm(prof || { name: '', email: '', phone: '', specialty: '', bio: '' }); setModal({ open: true, data: prof }); };

    return (
        <div className="admin-professionals">
            <div className="page-header">
                <h2>Equipe</h2>
                <Button onClick={() => openEdit(null)}>+ Adicionar Profissional</Button>
            </div>
            <div className="professionals-grid">
                {loading ? <p>Carregando...</p> : professionals.map(p => (
                    <Card key={p.id} className="professional-card">
                        <div className="prof-avatar">{p.name[0]}</div>
                        <h3>{p.name}</h3>
                        <span className="prof-specialty">{p.specialty}</span>
                        <Rating.Display value={p.average_rating} count={p.total_reviews} size="sm" />
                        <div className="prof-actions">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>Editar</Button>
                        </div>
                    </Card>
                ))}
            </div>
            <Modal isOpen={modal.open} onClose={() => setModal({ open: false, data: null })} title={modal.data?.id ? 'Editar Profissional' : 'Novo Profissional'}>
                <div className="form-grid">
                    <Input label="Nome" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    <Input label="Telefone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} mask="phone" />
                    <Input label="Especialidade" value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} />
                </div>
                <Button variant="primary" fullWidth onClick={handleSave}>Salvar</Button>
            </Modal>
        </div>
    );
}
