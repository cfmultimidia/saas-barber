import jwt from 'jsonwebtoken';

// Store connected users by their user ID
const connectedUsers = new Map();

export function setupSocketHandlers(io) {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.userId;
                socket.userType = decoded.type;
                next();
            } catch (err) {
                // Allow anonymous connections for public data
                next();
            }
        } else {
            next();
        }
    });

    io.on('connection', (socket) => {
        console.log(`📱 Client connected: ${socket.id}`);

        // Join user-specific room if authenticated
        if (socket.userId) {
            socket.join(`user:${socket.userId}`);
            connectedUsers.set(socket.userId, socket.id);
            console.log(`👤 User ${socket.userId} joined their room`);
        }

        // Join salon room (for salon admins and professionals)
        socket.on('join:salon', (salonId) => {
            socket.join(`salon:${salonId}`);
            console.log(`🏪 Socket ${socket.id} joined salon room: ${salonId}`);
        });

        // Leave salon room
        socket.on('leave:salon', (salonId) => {
            socket.leave(`salon:${salonId}`);
            console.log(`🚪 Socket ${socket.id} left salon room: ${salonId}`);
        });

        // Join professional room
        socket.on('join:professional', (professionalId) => {
            socket.join(`professional:${professionalId}`);
            console.log(`💼 Socket ${socket.id} joined professional room: ${professionalId}`);
        });

        socket.on('disconnect', () => {
            console.log(`📴 Client disconnected: ${socket.id}`);
            if (socket.userId) {
                connectedUsers.delete(socket.userId);
            }
        });
    });
}

// Helper functions to emit events
export function emitToUser(io, userId, event, data) {
    io.to(`user:${userId}`).emit(event, data);
}

export function emitToSalon(io, salonId, event, data) {
    io.to(`salon:${salonId}`).emit(event, data);
}

export function emitToProfessional(io, professionalId, event, data) {
    io.to(`professional:${professionalId}`).emit(event, data);
}

export function emitAppointmentUpdate(io, appointment, event = 'appointment:updated') {
    // Notify the salon
    emitToSalon(io, appointment.salon_id, event, appointment);

    // Notify the professional
    emitToProfessional(io, appointment.professional_id, event, appointment);

    // Notify the client
    emitToUser(io, appointment.client_user_id, event, appointment);
}
