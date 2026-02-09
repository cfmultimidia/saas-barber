import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './Reports.css';

export default function AdminReports() {
    const { salon } = useAuth();
    const [period, setPeriod] = useState('month');
    const [tab, setTab] = useState('revenue');

    const stats = { revenue: { total: 12500, avg: 416.67, byService: [{ name: 'Corte + Barba', count: 120, total: 5400 }, { name: 'Corte Simples', count: 80, total: 2800 }] } };

    return (
        <div className="admin-reports">
            <div className="page-header">
                <h2>Relatórios</h2>
                <div className="period-selector">
                    {['week', 'month', 'year'].map(p => <button key={p} className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>{p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Ano'}</button>)}
                </div>
            </div>
            <div className="tabs">
                {['revenue', 'clients', 'performance'].map(t => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t === 'revenue' ? '💰 Faturamento' : t === 'clients' ? '👥 Clientes' : '🎯 Performance'}</button>)}
            </div>
            {tab === 'revenue' && (
                <div className="report-content">
                    <div className="stats-row">
                        <Card className="stat-card"><span className="stat-label">Total no Período</span><span className="stat-value">R$ {stats.revenue.total.toFixed(2)}</span></Card>
                        <Card className="stat-card"><span className="stat-label">Média Diária</span><span className="stat-value">R$ {stats.revenue.avg.toFixed(2)}</span></Card>
                    </div>
                    <Card className="table-card">
                        <h3>Por Serviço</h3>
                        <table><thead><tr><th>Serviço</th><th>Qtd</th><th>Total</th></tr></thead>
                            <tbody>{stats.revenue.byService.map((s, i) => <tr key={i}><td>{s.name}</td><td>{s.count}</td><td>R$ {s.total.toFixed(2)}</td></tr>)}</tbody></table>
                    </Card>
                    <Button variant="outline">📥 Exportar CSV</Button>
                </div>
            )}
            {tab === 'clients' && <Card><p className="empty">Relatório de clientes em breve</p></Card>}
            {tab === 'performance' && <Card><p className="empty">Relatório de performance em breve</p></Card>}
        </div>
    );
}
