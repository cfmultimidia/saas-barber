import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import './Dashboard.css';

export default function ClientDashboard() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [pastAppointments, setPastAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelModal, setCancelModal] = useState({ open: false, appointment: null });
    const [cancelReason, setCancelReason] = useState('');
    const [cancelNote, setCancelNote] = useState('');

    useEffect(() => {
        loadAppointments();
    }, [isAuthenticated]);

    const loadAppointments = async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            const today = new Date().toISOString().split('T')[0];

            // Get upcoming appointments
            const upcomingRes = await api.get(`/appointments?from_date=${today}&status=scheduled`);
            setUpcomingAppointments(upcomingRes.data || []);

            // Get past appointments
            const pastRes = await api.get(`/appointments?to_date=${today}&status=completed`);
            setPastAppointments((pastRes.data || []).slice(0, 5));
        } catch (error) {
            console.error('Error loading appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatAppointmentDate = (date, time) => {
        const dateObj = parseISO(date);
        if (isToday(dateObj)) return `Hoje às ${time}`;
        if (isTomorrow(dateObj)) return `Amanhã às ${time}`;
        return format(dateObj, "EEEE, d 'de' MMMM", { locale: ptBR }) + ` às ${time}`;
    };

    const handleCancel = async () => {
        if (!cancelReason) return;

        try {
            await api.patch(`/appointments/${cancelModal.appointment.id}/cancel`, {
                cancellation_reason: cancelReason,
                note: cancelNote,
            });
            setCancelModal({ open: false, appointment: null });
            loadAppointments();
        } catch (error) {
            console.error('Error cancelling:', error);
        }
    };

    const openWhatsApp = (appointment) => {
        const message = encodeURIComponent(
            `Olá! Tenho um agendamento marcado para ${format(parseISO(appointment.scheduled_date), "dd/MM/yyyy")} às ${appointment.scheduled_time} com ${appointment.professional_name} para ${appointment.service_name}. Gostaria de conversar sobre meu atendimento.`
        );
        window.open(`https://wa.me/${appointment.salon_whatsapp}?text=${message}`, '_blank');
    };

    const categories = [
        { icon: '✂️', label: 'Cabelo', niche: 'barbershop' },
        { icon: '🪒', label: 'Barba', niche: 'barbershop' },
        { icon: '💅', label: 'Manicure', niche: 'manicure' },
        { icon: '🦶', label: 'Pedicure', niche: 'manicure' },
        { icon: '✨', label: 'Estética', niche: 'aesthetics' },
        { icon: '💄', label: 'Maquiagem', niche: 'makeup' },
    ];

    const getStatusBadge = (status) => {
        const styles = {
            scheduled: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', label: 'Agendado' },
            in_progress: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', label: 'Em Atendimento' },
            completed: { bg: 'var(--color-info-bg)', color: 'var(--color-info)', label: 'Concluído' },
            cancelled: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', label: 'Cancelado' },
        };
        return styles[status] || styles.scheduled;
    };

    return (
        <div className="client-dashboard">
            <div className="container">
                {/* Welcome Section */}
                <section className="welcome-section">
                    <h1 className="welcome-title">
                        Olá{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
                    </h1>
                    <p className="welcome-subtitle">O que você quer agendar hoje?</p>
                </section>

                {/* Categories */}
                <section className="categories-section">
                    <div className="categories-grid">
                        {categories.map((cat) => (
                            <button
                                key={cat.label}
                                className="category-item"
                                onClick={() => navigate(`/cliente/buscar?niche=${cat.niche}`)}
                            >
                                <span className="category-icon">{cat.icon}</span>
                                <span className="category-label">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Upcoming Appointments */}
                {isAuthenticated && (
                    <section className="appointments-section">
                        <h2 className="section-title">Próximos Agendamentos</h2>

                        {loading ? (
                            <div className="loading-skeleton">
                                <div className="skeleton-card" />
                            </div>
                        ) : upcomingAppointments.length > 0 ? (
                            <div className="appointments-list">
                                {upcomingAppointments.map((apt) => (
                                    <Card key={apt.id} className="appointment-card">
                                        <div className="appointment-header">
                                            <span
                                                className="appointment-status"
                                                style={{
                                                    background: getStatusBadge(apt.status).bg,
                                                    color: getStatusBadge(apt.status).color
                                                }}
                                            >
                                                {getStatusBadge(apt.status).label}
                                            </span>
                                            <span className="appointment-id">#{apt.id.slice(0, 8)}</span>
                                        </div>

                                        <div className="appointment-time">
                                            {formatAppointmentDate(apt.scheduled_date, apt.scheduled_time)}
                                        </div>

                                        <div className="appointment-service">
                                            {apt.service_name} - R$ {apt.price?.toFixed(2)}
                                        </div>

                                        <div className="appointment-professional">
                                            <span className="professional-avatar">
                                                {apt.professional_name?.[0] || '?'}
                                            </span>
                                            <div className="professional-info">
                                                <span className="professional-name">{apt.professional_name}</span>
                                                <span className="professional-salon">{apt.salon_name}</span>
                                            </div>
                                        </div>

                                        <div className="appointment-actions">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => navigate(`/cliente/agendar/${apt.salon_id}?reschedule=${apt.id}`)}
                                            >
                                                🔄 Remarcar
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setCancelModal({ open: true, appointment: apt })}
                                            >
                                                ❌ Cancelar
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openWhatsApp(apt)}
                                            >
                                                💬 Mensagem
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="empty-state">
                                <p>Nenhum agendamento próximo</p>
                                <Button
                                    variant="primary"
                                    onClick={() => navigate('/cliente/buscar')}
                                >
                                    Agendar Agora
                                </Button>
                            </Card>
                        )}
                    </section>
                )}

                {/* Past Appointments */}
                {isAuthenticated && pastAppointments.length > 0 && (
                    <section className="appointments-section">
                        <h2 className="section-title">Histórico</h2>
                        <div className="history-list">
                            {pastAppointments.map((apt) => (
                                <div key={apt.id} className="history-item">
                                    <div className="history-info">
                                        <span className="history-date">
                                            {format(parseISO(apt.scheduled_date), "dd/MM/yyyy")}
                                        </span>
                                        <span className="history-service">{apt.service_name}</span>
                                        <span className="history-professional">{apt.professional_name}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate(`/cliente/agendar/${apt.salon_id}`)}
                                    >
                                        Remarcar
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Not authenticated */}
                {!isAuthenticated && (
                    <section className="cta-section">
                        <Card className="cta-card">
                            <h3>Crie sua conta grátis</h3>
                            <p>Agende seus atendimentos e acompanhe seu histórico</p>
                            <div className="cta-buttons">
                                <Button variant="primary" onClick={() => navigate('/cliente/cadastro')}>
                                    Criar Conta
                                </Button>
                                <Button variant="outline" onClick={() => navigate('/login')}>
                                    Entrar
                                </Button>
                            </div>
                        </Card>
                    </section>
                )}
            </div>

            {/* Cancel Modal */}
            <Modal
                isOpen={cancelModal.open}
                onClose={() => setCancelModal({ open: false, appointment: null })}
                title="Cancelar Agendamento"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setCancelModal({ open: false, appointment: null })}>
                            Voltar
                        </Button>
                        <Button variant="danger" onClick={handleCancel} disabled={!cancelReason}>
                            Confirmar Cancelamento
                        </Button>
                    </>
                }
            >
                <p style={{ marginBottom: 'var(--spacing-md)' }}>
                    Tem certeza que deseja cancelar este agendamento?
                </p>

                <div className="form-group">
                    <label>Por que está cancelando? *</label>
                    <select
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="form-select"
                    >
                        <option value="">Selecione um motivo</option>
                        <option value="change_of_plans">Mudança de planos</option>
                        <option value="found_another">Encontrei outro lugar</option>
                        <option value="time_issue">Problema com horário</option>
                        <option value="personal">Motivo pessoal</option>
                        <option value="other">Outro</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Observação (opcional)</label>
                    <textarea
                        value={cancelNote}
                        onChange={(e) => setCancelNote(e.target.value)}
                        placeholder="Algum comentário adicional..."
                        maxLength={200}
                        className="form-textarea"
                    />
                    <span className="char-count">{cancelNote.length}/200</span>
                </div>
            </Modal>
        </div>
    );
}
