import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import './Services.css';

export default function AdminServices() {
    const { salon } = useAuth();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ open: false, data: null });
    const [form, setForm] = useState({ name: '', duration_minutes: 30, price: 0, category: '', description: '' });

    useEffect(() => { loadData(); }, [salon]);

    const loadData = async () => {
        if (!salon?.id) return;
        try { const res = await api.get(`/services?salon_id=${salon.id}`); setServices(res.data || []); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSave = async () => {
        try {
            if (modal.data?.id) { await api.put(`/services/${modal.data.id}`, form); }
            else { await api.post('/services', { ...form, salon_id: salon.id }); }
            setModal({ open: false, data: null }); loadData();
        } catch (e) { console.error(e); }
    };

    const openEdit = (s) => { setForm(s || { name: '', duration_minutes: 30, price: 0, category: '', description: '' }); setModal({ open: true, data: s }); };

    return (
        <div className="admin-services">
            <div className="page-header"><h2>Serviços</h2><Button onClick={() => openEdit(null)}>+ Novo Serviço</Button></div>
            <div className="services-table">
                <table>
                    <thead><tr><th>Nome</th><th>Duração</th><th>Preço</th><th>Categoria</th><th>Ações</th></tr></thead>
                    <tbody>
                        {services.map(s => (
                            <tr key={s.id}>
                                <td>{s.name}</td><td>{s.duration_minutes} min</td><td>R$ {s.price?.toFixed(2)}</td><td>{s.category}</td>
                                <td><Button size="sm" variant="ghost" onClick={() => openEdit(s)}>Editar</Button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={modal.open} onClose={() => setModal({ open: false, data: null })} title={modal.data?.id ? 'Editar Serviço' : 'Novo Serviço'}>
                <div className="form-grid">
                    <Input label="Nome" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    <Input label="Duração (min)" type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) }))} />
                    <Input label="Preço (R$)" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) }))} />
                    <Input label="Categoria" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                </div>
                <Button variant="primary" fullWidth onClick={handleSave}>Salvar</Button>
            </Modal>
        </div>
    );
}
