import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './Dashboard.css';

export default function ProfessionalDashboard() {
    const { professional } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ today: 0, revenue: 0, month: 0, rating: 0 });

    useEffect(() => { loadData(); }, [professional]);

    const loadData = async () => {
        if (!professional?.id) return;
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const res = await api.get(`/appointments?professional_id=${professional.id}&date=${today}`);
            setAppointments(res.data || []);
            setStats({ today: res.data?.length || 0, revenue: 0, month: 0, rating: professional.average_rating || 0 });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const updateStatus = async (id, status) => {
        try { await api.patch(`/appointments/${id}/status`, { status }); loadData(); }
        catch (e) { console.error(e); }
    };

    const statusMap = { scheduled: { label: 'Agendado', color: 'success', next: 'in_progress', action: 'Iniciar' }, in_progress: { label: 'Em Atendimento', color: 'warning', next: 'completed', action: 'Concluir' }, completed: { label: 'Concluído', color: 'info' } };

    return (
        <div className="prof-dashboard">
            <h1 className="page-title">Olá, {professional?.name?.split(' ')[0] || 'Profissional'}!</h1>
            <p className="date-today">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
            <div className="widgets-grid">
                <Card className="widget"><span className="widget-icon">📅</span><span className="widget-value">{stats.today}</span><span className="widget-label">Hoje</span></Card>
                <Card className="widget"><span className="widget-icon">💰</span><span className="widget-value">R$ 0</span><span className="widget-label">Receita</span></Card>
                <Card className="widget"><span className="widget-icon">⭐</span><span className="widget-value">{stats.rating.toFixed(1)}</span><span className="widget-label">Rating</span></Card>
            </div>
            <h2 className="section-title">Próximos Atendimentos</h2>
            {loading ? <p>Carregando...</p> : appointments.length > 0 ? (
                <div className="appointments-list">
                    {appointments.filter(a => a.status !== 'cancelled').map(apt => (
                        <Card key={apt.id} className="appointment-card">
                            <div className="apt-time">{apt.scheduled_time}</div>
                            <div className="apt-info">
                                <span className="apt-client">{apt.client_name}</span>
                                <span className="apt-service">{apt.service_name}</span>
                                <a href={`tel:${apt.client_phone}`} className="apt-phone">📞 {apt.client_phone}</a>
                            </div>
                            <div className="apt-status">
                                <span className={`badge badge-${statusMap[apt.status]?.color}`}>{statusMap[apt.status]?.label}</span>
                                {statusMap[apt.status]?.next && <Button size="sm" onClick={() => updateStatus(apt.id, statusMap[apt.status].next)}>{statusMap[apt.status].action}</Button>}
                            </div>
                        </Card>
                    ))}
                </div>
            ) : <Card className="empty">Nenhum atendimento hoje</Card>}
        </div>
    );
}
