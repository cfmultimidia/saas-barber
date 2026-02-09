import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
    const { user, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [toasts, setToasts] = useState([]);

    // Initialize WebSocket connection
    useEffect(() => {
        if (isAuthenticated) {
            const token = localStorage.getItem('accessToken');
            const newSocket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3001', {
                auth: { token },
                transports: ['websocket', 'polling'],
            });

            newSocket.on('connect', () => {
                console.log('🔌 WebSocket connected');
            });

            newSocket.on('disconnect', () => {
                console.log('🔌 WebSocket disconnected');
            });

            // Listen for appointment events
            newSocket.on('appointment:created', (data) => {
                addToast('Novo agendamento criado!', 'success');
                // You can dispatch to a global state or callback here
            });

            newSocket.on('appointment:cancelled', (data) => {
                addToast('Agendamento cancelado', 'warning');
            });

            newSocket.on('appointment:rescheduled', (data) => {
                addToast('Agendamento remarcado', 'info');
            });

            newSocket.on('appointment:started', (data) => {
                addToast('Atendimento iniciado', 'info');
            });

            newSocket.on('appointment:completed', (data) => {
                addToast('Atendimento concluído!', 'success');
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        }
    }, [isAuthenticated]);

    // Toast management
    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // Join salon room (for admins and professionals)
    const joinSalonRoom = useCallback((salonId) => {
        if (socket) {
            socket.emit('join:salon', salonId);
        }
    }, [socket]);

    const leaveSalonRoom = useCallback((salonId) => {
        if (socket) {
            socket.emit('leave:salon', salonId);
        }
    }, [socket]);

    const joinProfessionalRoom = useCallback((professionalId) => {
        if (socket) {
            socket.emit('join:professional', professionalId);
        }
    }, [socket]);

    const value = {
        socket,
        notifications,
        unreadCount,
        toasts,
        addToast,
        removeToast,
        joinSalonRoom,
        leaveSalonRoom,
        joinProfessionalRoom,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}
