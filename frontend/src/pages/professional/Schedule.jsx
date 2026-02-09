import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './Schedule.css';

export default function ProfessionalSchedule() {
    const { professional } = useAuth();
    const [date, setDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, [professional, date]);

    const loadData = async () => {
        if (!professional?.id) return;
        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const res = await api.get(`/appointments?professional_id=${professional.id}&date=${dateStr}`);
            setAppointments(res.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
    const statusColors = { scheduled: 'var(--color-success)', in_progress: 'var(--color-warning)', completed: 'var(--color-info)', cancelled: 'var(--color-danger)' };

    return (
        <div className="prof-schedule">
            <h1>Minha Agenda</h1>
            <div className="days-nav">
                {days.map(d => (
                    <button key={d.toISOString()} className={`day-btn ${format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') ? 'active' : ''}`} onClick={() => setDate(d)}>
                        <span className="day-name">{format(d, 'EEE', { locale: ptBR })}</span>
                        <span className="day-num">{format(d, 'd')}</span>
                    </button>
                ))}
            </div>
            <div className="schedule-date">{format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}</div>
            {loading ? <p>Carregando...</p> : appointments.length > 0 ? (
                <div className="schedule-list">
                    {appointments.map(apt => (
                        <Card key={apt.id} className="schedule-item" style={{ borderLeftColor: statusColors[apt.status] }}>
                            <span className="item-time">{apt.scheduled_time}</span>
                            <div className="item-info"><span className="item-service">{apt.service_name}</span><span className="item-client">{apt.client_name}</span></div>
                            <span className="item-duration">{apt.duration_minutes} min</span>
                        </Card>
                    ))}
                </div>
            ) : <Card className="empty">Nenhum agendamento para este dia</Card>}
        </div>
    );
}
