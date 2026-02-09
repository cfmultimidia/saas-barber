import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './Dashboard.css';

export default function AdminDashboard() {
    const { salon } = useAuth();
    const [stats, setStats] = useState({ todayAppointments: 0, todayRevenue: 0, monthRevenue: 0, newClients: 0, avgRating: 0, presence: 0 });
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [salon]);

    const loadData = async () => {
        if (!salon?.id) return;
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const [statsRes, aptsRes] = await Promise.all([
                api.get(`/salons/${salon.id}/stats`),
                api.get(`/appointments?salon_id=${salon.id}&date=${today}`),
            ]);
            setStats(statsRes.data || stats);
            setAppointments(aptsRes.data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const widgets = [
        { label: 'Agendamentos Hoje', value: stats.todayAppointments || appointments.length, icon: '📅' },
        { label: 'Receita Hoje', value: `R$ ${(stats.todayRevenue || 0).toFixed(2)}`, icon: '💰' },
        { label: 'Faturamento Mês', value: `R$ ${(stats.monthRevenue || 0).toFixed(2)}`, icon: '💵' },
        { label: 'Novos Clientes', value: stats.newClients || 0, icon: '👤' },
        { label: 'Avaliação Média', value: (stats.avgRating || salon?.average_rating || 0).toFixed(1), icon: '⭐' },
        { label: 'Taxa de Presença', value: `${stats.presence || 95}%`, icon: '🎯' },
    ];

    const statusMap = { scheduled: { label: 'Agendado', color: 'success' }, in_progress: { label: 'Em Atendimento', color: 'warning' }, completed: { label: 'Concluído', color: 'info' }, cancelled: { label: 'Cancelado', color: 'danger' } };

    return (
        <div className="admin-dashboard">
            <div className="widgets-grid">
                {widgets.map((w, i) => (
                    <Card key={i} className="widget-card">
                        <span className="widget-icon">{w.icon}</span>
                        <span className="widget-value">{w.value}</span>
                        <span className="widget-label">{w.label}</span>
                    </Card>
                ))}
            </div>
            <section className="section">
                <h2>Próximos Agendamentos</h2>
                {loading ? <p>Carregando...</p> : appointments.length > 0 ? (
                    <div className="appointments-table">
                        <table>
                            <thead><tr><th>Horário</th><th>Cliente</th><th>Profissional</th><th>Serviço</th><th>Status</th><th>Ações</th></tr></thead>
                            <tbody>
                                {appointments.slice(0, 5).map(apt => (
                                    <tr key={apt.id}>
                                        <td>{apt.scheduled_time}</td>
                                        <td>{apt.client_name}</td>
                                        <td>{apt.professional_name}</td>
                                        <td>{apt.service_name}</td>
                                        <td><span className={`badge badge-${statusMap[apt.status]?.color || 'info'}`}>{statusMap[apt.status]?.label || apt.status}</span></td>
                                        <td><Button size="sm" variant="ghost">Ver</Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="empty">Nenhum agendamento para hoje</p>}
            </section>
        </div>
    );
}
