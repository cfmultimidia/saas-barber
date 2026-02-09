import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Rating from '../../components/ui/Rating';
import './Reviews.css';

export default function ProfessionalReviews() {
    const { professional } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ avg: 0, total: 0, dist: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });

    useEffect(() => { loadData(); }, [professional]);

    const loadData = async () => {
        if (!professional?.id) return;
        try {
            const res = await api.get(`/reviews?professional_id=${professional.id}`);
            const data = res.data || [];
            setReviews(data);
            const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            data.forEach(r => { if (dist[r.rating] !== undefined) dist[r.rating]++; });
            const avg = data.length ? data.reduce((a, r) => a + r.rating, 0) / data.length : 0;
            setStats({ avg, total: data.length, dist });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    return (
        <div className="prof-reviews">
            <h1>Minhas Avaliações</h1>
            <Card className="reviews-summary">
                <div className="summary-main"><span className="avg-rating">{stats.avg.toFixed(1)}</span><Rating value={Math.round(stats.avg)} readonly /><span className="total-reviews">{stats.total} avaliações</span></div>
                <div className="rating-bars">{[5, 4, 3, 2, 1].map(r => (<div key={r} className="bar-row"><span>{r}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${stats.total ? (stats.dist[r] / stats.total) * 100 : 0}%` }} /></div><span>{stats.dist[r]}</span></div>))}</div>
            </Card>
            <h2>Últimas Avaliações</h2>
            {loading ? <p>Carregando...</p> : reviews.length > 0 ? (
                <div className="reviews-list">{reviews.slice(0, 20).map(r => (
                    <Card key={r.id} className="review-card">
                        <div className="review-header"><span className="reviewer">{r.client_name}</span><Rating value={r.rating} readonly size="sm" /></div>
                        {r.comment && <p className="review-comment">{r.comment}</p>}
                        <span className="review-date">{new Date(r.created_at).toLocaleDateString('pt-BR')}</span>
                    </Card>
                ))}</div>
            ) : <Card className="empty">Nenhuma avaliação ainda</Card>}
        </div>
    );
}
