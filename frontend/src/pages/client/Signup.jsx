import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import '../Login.css'; // Reuse unified login styles

export default function ClientSignup() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            await register({ ...formData, type: 'client' });
            navigate('/cliente');
        } catch (err) {
            setError(err.message || 'Erro ao criar conta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-logo">✂️</div>
                    <h1 className="auth-title">Criar Conta</h1>
                    <p className="auth-subtitle">Cadastre-se para agendar atendimentos</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && (
                        <div className="auth-error">{error}</div>
                    )}

                    <Input
                        label="Nome completo"
                        type="text"
                        value={formData.name}
                        onChange={handleChange('name')}
                        placeholder="Seu nome"
                        required
                    />

                    <Input
                        label="Telefone (WhatsApp)"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange('phone')}
                        placeholder="(21) 99999-9999"
                        mask="phone"
                        required
                    />

                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange('email')}
                        placeholder="seu@email.com"
                        required
                    />

                    <Input
                        label="Senha"
                        type="password"
                        value={formData.password}
                        onChange={handleChange('password')}
                        placeholder="Mínimo 6 caracteres"
                        helperText="Mínimo 6 caracteres"
                        required
                    />

                    <label className="auth-remember">
                        <input type="checkbox" required />
                        <span>Li e concordo com os termos de uso</span>
                    </label>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        loading={loading}
                    >
                        Criar Conta
                    </Button>
                </form>

                <div className="auth-footer" style={{ marginTop: 'var(--spacing-lg)' }}>
                    <p>Já tem conta?</p>
                    <Link to="/login" className="auth-link">
                        Faça login
                    </Link>
                </div>
            </div>
        </div>
    );
}
