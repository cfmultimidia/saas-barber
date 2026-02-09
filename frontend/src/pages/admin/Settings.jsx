import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import './Settings.css';

export default function AdminSettings() {
    const { salon } = useAuth();
    const [tab, setTab] = useState('general');
    const [form, setForm] = useState({ name: salon?.name || '', address: salon?.address || '', phone: salon?.phone || '', email: salon?.email || '', instagram: salon?.instagram || '', whatsapp: salon?.whatsapp || '', bio: salon?.bio || '' });

    const handleSave = async () => { /* API call to update salon */ alert('Configurações salvas!'); };

    return (
        <div className="admin-settings">
            <h2>Configurações</h2>
            <div className="settings-tabs">
                {['general', 'notifications', 'billing'].map(t => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t === 'general' ? 'Geral' : t === 'notifications' ? 'Notificações' : 'Plano'}</button>)}
            </div>
            {tab === 'general' && (
                <Card className="settings-card">
                    <div className="form-grid">
                        <Input label="Nome do Salão" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                        <Input label="Endereço" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                        <Input label="Telefone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} mask="phone" />
                        <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                        <Input label="Instagram" value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} placeholder="@seusalao" />
                        <Input label="WhatsApp" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
                    </div>
                    <Button variant="primary" onClick={handleSave}>Salvar Alterações</Button>
                </Card>
            )}
            {tab === 'notifications' && (
                <Card className="settings-card">
                    <div className="toggle-list">
                        <label><input type="checkbox" defaultChecked /> Email para novos agendamentos</label>
                        <label><input type="checkbox" defaultChecked /> SMS 2h antes do agendamento</label>
                        <label><input type="checkbox" defaultChecked /> WhatsApp lembretes</label>
                        <label><input type="checkbox" /> Resumo diário por email</label>
                    </div>
                    <Button variant="primary">Salvar</Button>
                </Card>
            )}
            {tab === 'billing' && <Card className="settings-card"><p className="empty">Gerenciamento de plano em breve</p></Card>}
        </div>
    );
}
