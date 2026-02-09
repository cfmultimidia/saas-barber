import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

export function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError('Token expired', 401);
        }
        throw new AppError('Invalid token', 401);
    }
}

// Middleware to check user type
export function authorize(...allowedTypes) {
    return (req, res, next) => {
        if (!req.user) {
            throw new AppError('Not authenticated', 401);
        }

        if (!allowedTypes.includes(req.user.type)) {
            throw new AppError('Not authorized for this action', 403);
        }

        next();
    };
}

// Optional authentication (for public routes that can benefit from auth)
export function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // Ignore token errors, just continue without auth
        }
    }

    next();
}
