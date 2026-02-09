import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import './Clients.css';

export default function AdminClients() {
    const { salon } = useAuth();
    const [clients, setClients] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ open: false, client: null });

    useEffect(() => { loadData(); }, [salon]);

    const loadData = async () => {
        if (!salon?.id) return;
        try { const res = await api.get(`/clients?salon_id=${salon.id}`); setClients(res.data || []); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const filtered = clients.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));

    const openWhatsApp = (phone) => { window.open(`https://wa.me/55${phone?.replace(/\D/g, '')}`, '_blank'); };

    return (
        <div className="admin-clients">
            <div className="page-header">
                <h2>Clientes</h2>
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." style={{ maxWidth: 300 }} />
            </div>
            <div className="clients-table">
                <table>
                    <thead><tr><th>Nome</th><th>Telefone</th><th>Agendamentos</th><th>Último</th><th>Ações</th></tr></thead>
                    <tbody>
                        {filtered.map(c => (
                            <tr key={c.id}>
                                <td>{c.name}</td>
                                <td>{c.phone}</td>
                                <td>{c.total_appointments || 0}</td>
                                <td>{c.last_appointment || '-'}</td>
                                <td>
                                    <Button size="sm" variant="ghost" onClick={() => setModal({ open: true, client: c })}>Ver</Button>
                                    <Button size="sm" variant="ghost" onClick={() => openWhatsApp(c.phone)}>💬</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={modal.open} onClose={() => setModal({ open: false, client: null })} title="Perfil do Cliente">
                {modal.client && (<div className="client-profile">
                    <div className="client-avatar">{modal.client.name?.[0]}</div>
                    <h3>{modal.client.name}</h3>
                    <p>{modal.client.phone}</p>
                    <p>{modal.client.email}</p>
                </div>)}
            </Modal>
        </div>
    );
}
