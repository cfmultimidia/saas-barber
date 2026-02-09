import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './Calendar.css';

export default function AdminCalendar() {
    const { salon } = useAuth();
    const [view, setView] = useState('day');
    const [date, setDate] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadAppointments(); }, [salon, date, view]);

    const loadAppointments = async () => {
        if (!salon?.id) return;
        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const res = await api.get(`/appointments?salon_id=${salon.id}&date=${dateStr}`);
            setAppointments(res.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const hours = Array.from({ length: 12 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);
    const statusColors = { scheduled: 'var(--color-success)', in_progress: 'var(--color-warning)', completed: 'var(--color-info)', cancelled: 'var(--color-danger)' };

    return (
        <div className="admin-calendar">
            <div className="calendar-header">
                <div className="view-tabs">
                    {['day', 'week', 'month'].map(v => <button key={v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>{v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}</button>)}
                </div>
                <div className="date-nav">
                    <Button variant="ghost" onClick={() => setDate(d => addDays(d, -1))}>←</Button>
                    <span className="current-date">{format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
                    <Button variant="ghost" onClick={() => setDate(d => addDays(d, 1))}>→</Button>
                </div>
            </div>
            <div className="calendar-grid">
                <div className="time-column">{hours.map(h => <div key={h} className="time-slot">{h}</div>)}</div>
                <div className="events-column">
                    {hours.map(h => {
                        const slotApts = appointments.filter(a => a.scheduled_time?.startsWith(h.split(':')[0]));
                        return (
                            <div key={h} className="event-slot">
                                {slotApts.map(apt => (
                                    <div key={apt.id} className="event-card" style={{ borderLeftColor: statusColors[apt.status] }}>
                                        <span className="event-time">{apt.scheduled_time}</span>
                                        <span className="event-service">{apt.service_name}</span>
                                        <span className="event-client">{apt.client_name}</span>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
