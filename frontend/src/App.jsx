import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

// Client Pages
import ClientLogin from './pages/client/Login';
import ClientSignup from './pages/client/Signup';
import ClientDashboard from './pages/client/Dashboard';
import ClientSearch from './pages/client/Search';
import ClientSalonDetail from './pages/client/SalonDetail';
import ClientBooking from './pages/client/Booking';
import ClientProfile from './pages/client/Profile';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminCalendar from './pages/admin/Calendar';
import AdminProfessionals from './pages/admin/Professionals';
import AdminServices from './pages/admin/Services';
import AdminClients from './pages/admin/Clients';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';

// Professional Pages
import ProfessionalLogin from './pages/professional/Login';
import ProfessionalDashboard from './pages/professional/Dashboard';
import ProfessionalSchedule from './pages/professional/Schedule';
import ProfessionalReviews from './pages/professional/Reviews';
import ProfessionalProfile from './pages/professional/Profile';

// Layouts
import ClientLayout from './components/layouts/ClientLayout';
import AdminLayout from './components/layouts/AdminLayout';
import ProfessionalLayout from './components/layouts/ProfessionalLayout';

// Protected Route
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppProvider>
                    <Routes>
                        {/* Home - Redirect to client portal */}
                        <Route path="/" element={<Navigate to="/cliente" replace />} />

                        {/* Client Portal */}
                        <Route path="/cliente/login" element={<ClientLogin />} />
                        <Route path="/cliente/cadastro" element={<ClientSignup />} />
                        <Route path="/cliente" element={<ClientLayout />}>
                            <Route index element={<ClientDashboard />} />
                            <Route path="buscar" element={<ClientSearch />} />
                            <Route path="salao/:id" element={<ClientSalonDetail />} />
                            <Route path="agendar/:salonId" element={<ClientBooking />} />
                            <Route path="perfil" element={
                                <ProtectedRoute allowedTypes={['client']}>
                                    <ClientProfile />
                                </ProtectedRoute>
                            } />
                        </Route>

                        {/* Admin Portal */}
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route path="/admin" element={
                            <ProtectedRoute allowedTypes={['salon']}>
                                <AdminLayout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<AdminDashboard />} />
                            <Route path="agenda" element={<AdminCalendar />} />
                            <Route path="profissionais" element={<AdminProfessionals />} />
                            <Route path="servicos" element={<AdminServices />} />
                            <Route path="clientes" element={<AdminClients />} />
                            <Route path="relatorios" element={<AdminReports />} />
                            <Route path="configuracoes" element={<AdminSettings />} />
                        </Route>

                        {/* Professional Portal */}
                        <Route path="/profissional/login" element={<ProfessionalLogin />} />
                        <Route path="/profissional" element={
                            <ProtectedRoute allowedTypes={['professional']}>
                                <ProfessionalLayout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<ProfessionalDashboard />} />
                            <Route path="agenda" element={<ProfessionalSchedule />} />
                            <Route path="avaliacoes" element={<ProfessionalReviews />} />
                            <Route path="perfil" element={<ProfessionalProfile />} />
                        </Route>

                        {/* 404 */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </AppProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
