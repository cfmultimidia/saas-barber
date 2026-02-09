import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { format, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import './Booking.css';

export default function ClientBooking() {
    const { salonId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Data
    const [salon, setSalon] = useState(null);
    const [services, setServices] = useState([]);
    const [professionals, setProfessionals] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);

    // Form
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        serviceId: searchParams.get('service') || '',
        professionalId: '',
        date: '',
        time: '',
        notes: '',
        whatsappReminder: true,
    });

    useEffect(() => {
        loadSalonData();
    }, [salonId]);

    useEffect(() => {
        if (formData.serviceId && formData.professionalId && formData.date) {
            loadAvailableSlots();
        }
    }, [formData.serviceId, formData.professionalId, formData.date]);

    const loadSalonData = async () => {
        try {
            const [salonRes, servicesRes, professionalsRes] = await Promise.all([
                api.get(`/salons/${salonId}`),
                api.get(`/services?salon_id=${salonId}`),
                api.get(`/professionals?salon_id=${salonId}`),
            ]);
            setSalon(salonRes.data);
            setServices(servicesRes.data || []);
            setProfessionals(professionalsRes.data || []);
        } catch (error) {
            console.error('Error loading salon:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableSlots = async () => {
        try {
            const response = await api.get(
                `/appointments/available-slots?professional_id=${formData.professionalId}&date=${formData.date}&service_id=${formData.serviceId}`
            );
            setAvailableSlots(response.data || []);
        } catch (error) {
            console.error('Error loading slots:', error);
            setAvailableSlots([]);
        }
    };

    const handleSubmit = async () => {
        if (!isAuthenticated) {
            navigate('/cliente/login?redirect=' + encodeURIComponent(window.location.pathname));
            return;
        }

        setSubmitting(true);
        try {
            const response = await api.post('/appointments', {
                salon_id: salonId,
                service_id: formData.serviceId,
                professional_id: formData.professionalId,
                scheduled_date: formData.date,
                scheduled_time: formData.time,
                notes: formData.notes,
            });

            setStep(6); // Success step
        } catch (error) {
            console.error('Error creating appointment:', error);
            alert('Erro ao criar agendamento. Tente novamente.');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedService = services.find(s => s.id === formData.serviceId);
    const selectedProfessional = professionals.find(p => p.id === formData.professionalId);

    // Generate next 30 days
    const dates = Array.from({ length: 30 }, (_, i) => {
        const date = addDays(new Date(), i);
        return {
            value: format(date, 'yyyy-MM-dd'),
            label: format(date, "EEE, d 'de' MMM", { locale: ptBR }),
            isToday: i === 0,
        };
    });

    if (loading) {
        return (
            <div className="booking-page loading">
                <div className="skeleton-card" />
            </div>
        );
    }

    return (
        <div className="booking-page">
            <div className="container">
                {/* Progress */}
                <div className="booking-progress">
                    {[1, 2, 3, 4, 5].map(s => (
                        <div
                            key={s}
                            className={`progress-step ${step >= s ? 'active' : ''} ${step === s ? 'current' : ''}`}
                        >
                            {s}
                        </div>
                    ))}
                </div>

                {/* Step 1: Client Info */}
                {step === 1 && (
                    <div className="booking-step animate-slide-up">
                        <h2 className="step-title">Seus Dados</h2>
                        <div className="step-content">
                            <Input
                                label="Nome completo"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                required
                            />
                            <Input
                                label="Telefone (WhatsApp)"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                mask="phone"
                                required
                            />
                        </div>
                        <div className="step-actions">
                            <Button variant="ghost" onClick={() => navigate(-1)}>Voltar</Button>
                            <Button
                                variant="primary"
                                disabled={!formData.name || !formData.phone}
                                onClick={() => setStep(2)}
                            >
                                Próximo
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Select Service */}
                {step === 2 && (
                    <div className="booking-step animate-slide-up">
                        <h2 className="step-title">Escolha o Serviço</h2>
                        <div className="step-content">
                            <div className="services-grid">
                                {services.map(service => (
                                    <Card
                                        key={service.id}
                                        className="service-option"
                                        clickable
                                        selected={formData.serviceId === service.id}
                                        onClick={() => setFormData(prev => ({ ...prev, serviceId: service.id }))}
                                    >
                                        <span className="service-icon">{service.icon || '✂️'}</span>
                                        <span className="service-name">{service.name}</span>
                                        <span className="service-duration">{service.duration_minutes} min</span>
                                        <span className="service-price">R$ {service.price?.toFixed(2)}</span>
                                        {formData.serviceId === service.id && (
                                            <span className="check-icon">✓</span>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </div>
                        <div className="step-actions">
                            <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
                            <Button
                                variant="primary"
                                disabled={!formData.serviceId}
                                onClick={() => setStep(3)}
                            >
                                Próximo
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Select Professional */}
                {step === 3 && (
                    <div className="booking-step animate-slide-up">
                        <h2 className="step-title">Escolha o Profissional</h2>
                        <div className="step-content">
                            <div className="professionals-list">
                                <Card
                                    className="professional-option"
                                    clickable
                                    selected={formData.professionalId === 'any'}
                                    onClick={() => setFormData(prev => ({ ...prev, professionalId: 'any' }))}
                                >
                                    <div className="professional-avatar">?</div>
                                    <div className="professional-info">
                                        <span className="professional-name">Qualquer profissional</span>
                                        <span className="professional-specialty">Primeiro disponível</span>
                                    </div>
                                </Card>
                                {professionals.map(prof => (
                                    <Card
                                        key={prof.id}
                                        className="professional-option"
                                        clickable
                                        selected={formData.professionalId === prof.id}
                                        onClick={() => setFormData(prev => ({ ...prev, professionalId: prof.id }))}
                                    >
                                        <div className="professional-avatar">{prof.name[0]}</div>
                                        <div className="professional-info">
                                            <span className="professional-name">{prof.name}</span>
                                            <span className="professional-specialty">{prof.specialty}</span>
                                        </div>
                                        <span className="professional-rating">⭐ {prof.average_rating?.toFixed(1)}</span>
                                    </Card>
                                ))}
                            </div>
                        </div>
                        <div className="step-actions">
                            <Button variant="ghost" onClick={() => setStep(2)}>Voltar</Button>
                            <Button
                                variant="primary"
                                disabled={!formData.professionalId}
                                onClick={() => setStep(4)}
                            >
                                Próximo
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Select Date/Time */}
                {step === 4 && (
                    <div className="booking-step animate-slide-up">
                        <h2 className="step-title">Escolha Data e Horário</h2>
                        <div className="step-content">
                            <div className="date-selector">
                                <h4>Data</h4>
                                <div className="dates-scroll">
                                    {dates.map(date => (
                                        <button
                                            key={date.value}
                                            className={`date-option ${formData.date === date.value ? 'active' : ''}`}
                                            onClick={() => setFormData(prev => ({ ...prev, date: date.value, time: '' }))}
                                        >
                                            {date.isToday ? 'Hoje' : date.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {formData.date && (
                                <div className="time-selector">
                                    <h4>Horário</h4>
                                    {availableSlots.length > 0 ? (
                                        <div className="times-grid">
                                            {availableSlots.map(slot => (
                                                <button
                                                    key={slot}
                                                    className={`time-option ${formData.time === slot ? 'active' : ''}`}
                                                    onClick={() => setFormData(prev => ({ ...prev, time: slot }))}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="no-slots">Nenhum horário disponível nesta data</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="step-actions">
                            <Button variant="ghost" onClick={() => setStep(3)}>Voltar</Button>
                            <Button
                                variant="primary"
                                disabled={!formData.date || !formData.time}
                                onClick={() => setStep(5)}
                            >
                                Próximo
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 5: Review & Confirm */}
                {step === 5 && (
                    <div className="booking-step animate-slide-up">
                        <h2 className="step-title">Confirmar Agendamento</h2>
                        <div className="step-content">
                            <Card className="booking-summary">
                                <div className="summary-item">
                                    <span className="summary-label">Serviço</span>
                                    <span className="summary-value">{selectedService?.name}</span>
                                    <span className="summary-price">R$ {selectedService?.price?.toFixed(2)}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Profissional</span>
                                    <span className="summary-value">
                                        {formData.professionalId === 'any' ? 'Qualquer profissional' : selectedProfessional?.name}
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Data/Hora</span>
                                    <span className="summary-value highlight">
                                        {format(parseISO(formData.date), "EEEE, d 'de' MMMM", { locale: ptBR })} às {formData.time}
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Duração</span>
                                    <span className="summary-value">{selectedService?.duration_minutes} minutos</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Local</span>
                                    <span className="summary-value">{salon?.address}</span>
                                </div>
                            </Card>

                            <div className="notes-section">
                                <label>Observações (opcional)</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Ex: Gostaria de deixar o cabelo mais comprido na frente"
                                    maxLength={300}
                                    className="form-textarea"
                                />
                            </div>

                            <label className="reminder-checkbox">
                                <input
                                    type="checkbox"
                                    checked={formData.whatsappReminder}
                                    onChange={(e) => setFormData(prev => ({ ...prev, whatsappReminder: e.target.checked }))}
                                />
                                <span>Desejo receber lembretes via WhatsApp</span>
                            </label>
                        </div>
                        <div className="step-actions">
                            <Button variant="ghost" onClick={() => setStep(4)}>Voltar</Button>
                            <Button
                                variant="primary"
                                size="lg"
                                loading={submitting}
                                onClick={handleSubmit}
                            >
                                ✓ Confirmar Agendamento
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 6: Success */}
                {step === 6 && (
                    <div className="booking-step success animate-scale-in">
                        <div className="success-icon">🎉</div>
                        <h2 className="success-title">Agendamento Confirmado!</h2>
                        <p className="success-message">Seu agendamento foi realizado com sucesso</p>

                        <Card className="booking-summary success-summary">
                            <div className="summary-item">
                                <span className="summary-label">Serviço</span>
                                <span className="summary-value">{selectedService?.name}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Data/Hora</span>
                                <span className="summary-value highlight">
                                    {format(parseISO(formData.date), "dd/MM/yyyy")} às {formData.time}
                                </span>
                            </div>
                        </Card>

                        <div className="success-notifications">
                            <p>✅ Confirmação enviada para {formData.phone}</p>
                        </div>

                        <div className="step-actions">
                            <Button variant="primary" fullWidth onClick={() => navigate('/cliente')}>
                                Voltar para Home
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
