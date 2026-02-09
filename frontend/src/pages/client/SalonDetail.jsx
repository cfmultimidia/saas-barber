import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Rating from '../../components/ui/Rating';
import './SalonDetail.css';

export default function ClientSalonDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [salon, setSalon] = useState(null);
    const [services, setServices] = useState([]);
    const [professionals, setProfessionals] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('services');

    useEffect(() => {
        loadSalonData();
    }, [id]);

    const loadSalonData = async () => {
        try {
            const [salonRes, servicesRes, professionalsRes, reviewsRes] = await Promise.all([
                api.get(`/salons/${id}`),
                api.get(`/services?salon_id=${id}`),
                api.get(`/professionals?salon_id=${id}`),
                api.get(`/reviews?salon_id=${id}`),
            ]);
            setSalon(salonRes.data);
            setServices(servicesRes.data || []);
            setProfessionals(professionalsRes.data || []);
            setReviews(reviewsRes.data || []);
        } catch (error) {
            console.error('Error loading salon:', error);
        } finally {
            setLoading(false);
        }
    };

    const openWhatsApp = () => {
        window.open(`https://wa.me/${salon.whatsapp}`, '_blank');
    };

    if (loading) {
        return (
            <div className="salon-detail loading">
                <div className="skeleton-header" />
                <div className="skeleton-content" />
            </div>
        );
    }

    if (!salon) {
        return (
            <div className="salon-detail not-found">
                <p>Salão não encontrado</p>
                <Button onClick={() => navigate('/cliente/buscar')}>Voltar à Busca</Button>
            </div>
        );
    }

    return (
        <div className="salon-detail">
            {/* Hero */}
            <div className="salon-hero">
                <div className="hero-overlay">
                    <div className="salon-avatar-large">
                        {salon.name[0]}
                    </div>
                    <h1 className="salon-name">{salon.name}</h1>
                    <Rating.Display value={salon.average_rating} count={salon.total_reviews} />
                </div>
            </div>

            <div className="container">
                {/* Info */}
                <Card className="salon-info-card">
                    <p className="salon-bio">{salon.bio}</p>
                    <div className="salon-details">
                        <div className="detail-item">
                            <span className="detail-icon">📍</span>
                            <span>{salon.address}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-icon">📞</span>
                            <a href={`tel:${salon.phone}`}>{salon.phone}</a>
                        </div>
                        {salon.instagram && (
                            <div className="detail-item">
                                <span className="detail-icon">📸</span>
                                <a href={`https://instagram.com/${salon.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                                    {salon.instagram}
                                </a>
                            </div>
                        )}
                    </div>
                    <div className="salon-actions">
                        <Button variant="primary" fullWidth onClick={() => navigate(`/cliente/agendar/${salon.id}`)}>
                            Agendar Serviço
                        </Button>
                        <Button variant="outline" fullWidth onClick={openWhatsApp}>
                            💬 WhatsApp
                        </Button>
                    </div>
                </Card>

                {/* Tabs */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'services' ? 'active' : ''}`}
                        onClick={() => setActiveTab('services')}
                    >
                        Serviços
                    </button>
                    <button
                        className={`tab ${activeTab === 'team' ? 'active' : ''}`}
                        onClick={() => setActiveTab('team')}
                    >
                        Equipe
                    </button>
                    <button
                        className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reviews')}
                    >
                        Avaliações
                    </button>
                </div>

                {/* Services Tab */}
                {activeTab === 'services' && (
                    <div className="services-list">
                        {services.map((service) => (
                            <Card key={service.id} className="service-item">
                                <div className="service-info">
                                    <span className="service-icon">{service.icon || '✂️'}</span>
                                    <div className="service-details">
                                        <h4 className="service-name">{service.name}</h4>
                                        <span className="service-duration">{service.duration_minutes} min</span>
                                    </div>
                                </div>
                                <div className="service-price-action">
                                    <span className="service-price">R$ {service.price?.toFixed(2)}</span>
                                    <Button
                                        size="sm"
                                        onClick={() => navigate(`/cliente/agendar/${salon.id}?service=${service.id}`)}
                                    >
                                        Agendar
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Team Tab */}
                {activeTab === 'team' && (
                    <div className="team-list">
                        {professionals.map((prof) => (
                            <Card key={prof.id} className="professional-item">
                                <div className="professional-avatar">{prof.name[0]}</div>
                                <div className="professional-info">
                                    <h4 className="professional-name">{prof.name}</h4>
                                    <span className="professional-specialty">{prof.specialty}</span>
                                    <Rating.Display value={prof.average_rating} count={prof.total_reviews} size="sm" />
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                    <div className="reviews-section">
                        <div className="reviews-summary">
                            <div className="rating-large">
                                <span className="rating-number">{salon.average_rating?.toFixed(1) || '0.0'}</span>
                                <Rating value={Math.round(salon.average_rating || 0)} readonly size="md" />
                                <span className="rating-count">{salon.total_reviews} avaliações</span>
                            </div>
                        </div>
                        <div className="reviews-list">
                            {reviews.slice(0, 10).map((review) => (
                                <Card key={review.id} className="review-item">
                                    <div className="review-header">
                                        <div className="review-author">
                                            <span className="author-avatar">{review.client_name?.[0] || '?'}</span>
                                            <span className="author-name">{review.client_name || 'Cliente'}</span>
                                        </div>
                                        <Rating value={review.rating} readonly size="sm" />
                                    </div>
                                    {review.comment && (
                                        <p className="review-comment">{review.comment}</p>
                                    )}
                                    <span className="review-date">
                                        {new Date(review.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Floating CTA */}
            <div className="floating-cta">
                <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => navigate(`/cliente/agendar/${salon.id}`)}
                >
                    Agendar Serviço
                </Button>
            </div>
        </div>
    );
}
