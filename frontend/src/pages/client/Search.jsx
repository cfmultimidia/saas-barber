import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Rating from '../../components/ui/Rating';
import './Search.css';

export default function ClientSearch() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState('');
    const [salons, setSalons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        niche: searchParams.get('niche') || '',
        rating: '',
        priceRange: '',
    });

    useEffect(() => {
        loadSalons();
    }, [filters]);

    const loadSalons = async () => {
        setLoading(true);
        try {
            let url = '/salons?';
            if (filters.niche) url += `niche=${filters.niche}&`;
            if (search) url += `search=${search}&`;
            const response = await api.get(url);
            setSalons(response.data || []);
        } catch (error) {
            console.error('Error loading salons:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadSalons();
    };

    const niches = [
        { value: '', label: 'Todos' },
        { value: 'barbershop', label: 'Barbearia' },
        { value: 'hairdresser', label: 'Salão de Cabelo' },
        { value: 'manicure', label: 'Manicure/Pedicure' },
        { value: 'aesthetics', label: 'Estética/Depilação' },
        { value: 'makeup', label: 'Maquiagem' },
    ];

    return (
        <div className="search-page">
            <div className="container">
                {/* Search Bar */}
                <form className="search-form" onSubmit={handleSearch}>
                    <Input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar salão ou serviço..."
                        icon={<span>🔍</span>}
                    />
                </form>

                {/* Filters */}
                <div className="filters-section">
                    <div className="filter-chips">
                        {niches.map((niche) => (
                            <button
                                key={niche.value}
                                className={`filter-chip ${filters.niche === niche.value ? 'active' : ''}`}
                                onClick={() => setFilters(prev => ({ ...prev, niche: niche.value }))}
                            >
                                {niche.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results */}
                <div className="search-results">
                    {loading ? (
                        <div className="results-loading">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="skeleton-card" />
                            ))}
                        </div>
                    ) : salons.length > 0 ? (
                        <div className="salons-list">
                            {salons.map((salon) => (
                                <Card
                                    key={salon.id}
                                    className="salon-card"
                                    clickable
                                    onClick={() => navigate(`/cliente/salao/${salon.id}`)}
                                >
                                    <div className="salon-cover">
                                        <div className="salon-avatar">
                                            {salon.name[0]}
                                        </div>
                                    </div>
                                    <div className="salon-info">
                                        <h3 className="salon-name">{salon.name}</h3>
                                        <Rating.Display
                                            value={salon.average_rating}
                                            count={salon.total_reviews}
                                        />
                                        <p className="salon-bio">{salon.bio}</p>
                                        <div className="salon-meta">
                                            <span className="salon-address">📍 {salon.address?.split(',')[0]}</span>
                                        </div>
                                        <Button
                                            variant="primary"
                                            fullWidth
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/cliente/agendar/${salon.id}`);
                                            }}
                                        >
                                            Agendar Agora
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-results">
                            <p>Nenhum salão encontrado</p>
                            <Button variant="outline" onClick={() => setFilters({ niche: '', rating: '', priceRange: '' })}>
                                Limpar Filtros
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
