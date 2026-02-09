import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [additionalData, setAdditionalData] = useState({});

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            loadUser();
        } else {
            setLoading(false);
        }
    }, []);

    const loadUser = async () => {
        try {
            const response = await api.get('/auth/me');
            if (response.data.success) {
                setUser(response.data.data.user);
                setAdditionalData({
                    salon: response.data.data.salon,
                    professional: response.data.data.professional,
                    client: response.data.data.client,
                });
            }
        } catch (error) {
            console.error('Error loading user:', error);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.success) {
            const { user, accessToken, refreshToken, salon, professional, client } = response.data.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            setUser(user);
            setAdditionalData({ salon, professional, client });
            return user;
        }
        throw new Error(response.data.message || 'Login failed');
    };

    const register = async (data) => {
        const response = await api.post('/auth/register', data);
        if (response.data.success) {
            const { user, accessToken, refreshToken } = response.data.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            setUser(user);
            return user;
        }
        throw new Error(response.data.message || 'Registration failed');
    };

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            await api.post('/auth/logout', { refreshToken });
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
            setAdditionalData({});
        }
    };

    const updateProfile = async (data) => {
        const response = await api.put('/auth/profile', data);
        if (response.data.success) {
            setUser(response.data.data.user);
            return response.data.data.user;
        }
        throw new Error(response.data.message || 'Update failed');
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        salon: additionalData.salon,
        professional: additionalData.professional,
        client: additionalData.client,
        login,
        register,
        logout,
        updateProfile,
        loadUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
