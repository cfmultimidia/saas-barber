import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import '../client/Login.css';

export default function ProfessionalLogin() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const user = await login(email, password);
            if (user.type === 'professional') { navigate('/profissional'); }
            else { setError('Esta conta não tem acesso ao portal do profissional'); }
        } catch (err) { setError(err.message || 'Credenciais inválidas'); }
        finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-logo">👨‍💼</div>
                    <h1 className="auth-title">Portal do Profissional</h1>
                    <p className="auth-subtitle">Acesse para gerenciar sua agenda</p>
                </div>
                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}
                    <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>Entrar</Button>
                </form>
                <div className="auth-portals" style={{ marginTop: 'var(--spacing-xl)' }}>
                    <Link to="/cliente/login" className="portal-link">Portal do Cliente</Link>
                    <span className="portal-divider">•</span>
                    <Link to="/admin/login" className="portal-link">Portal do Salão</Link>
                </div>
            </div>
        </div>
    );
}
