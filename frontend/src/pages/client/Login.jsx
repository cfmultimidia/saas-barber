import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import './Login.css';

export default function ClientLogin() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await login(email, password);
            if (user.type === 'salon') {
                navigate('/admin');
            } else if (user.type === 'professional') {
                navigate('/profissional');
            } else {
                navigate('/cliente');
            }
        } catch (err) {
            setError(err.message || 'Email ou senha incorretos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-logo">✂️</div>
                    <h1 className="auth-title">AgendaFácil</h1>
                    <p className="auth-subtitle">Entre para agendar seu atendimento</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && (
                        <div className="auth-error">{error}</div>
                    )}

                    <Input
                        label="Email ou Telefone"
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                    />

                    <Input
                        label="Senha"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Sua senha"
                        required
                    />

                    <div className="auth-options">
                        <label className="auth-remember">
                            <input type="checkbox" />
                            <span>Lembrar-me</span>
                        </label>
                        <Link to="/cliente/recuperar" className="auth-forgot">
                            Esqueci minha senha
                        </Link>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        loading={loading}
                    >
                        Entrar
                    </Button>
                </form>

                <div className="auth-divider">
                    <span>ou</span>
                </div>

                <div className="auth-footer">
                    <p>Não tem conta?</p>
                    <Link to="/cliente/cadastro" className="auth-link">
                        Criar conta grátis
                    </Link>
                </div>

                <div className="auth-portals">
                    <Link to="/admin/login" className="portal-link">
                        Sou dono de salão
                    </Link>
                    <span className="portal-divider">•</span>
                    <Link to="/profissional/login" className="portal-link">
                        Sou profissional
                    </Link>
                </div>
            </div>
        </div>
    );
}
