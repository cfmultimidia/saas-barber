import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Generate tokens
function generateTokens(user) {
    const accessToken = jwt.sign(
        { userId: user.id, email: user.email, type: user.type, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
}

// Register
router.post('/register', async (req, res, next) => {
    try {
        const { name, email, phone, password, type = 'client' } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !password) {
            throw new AppError('Nome, email, telefone e senha são obrigatórios', 400);
        }

        if (password.length < 6) {
            throw new AppError('Senha deve ter no mínimo 6 caracteres', 400);
        }

        // Check if email already exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            throw new AppError('Email já cadastrado', 400);
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const userId = uuidv4();
        db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, name, email, phone, passwordHash, type);

        // If client, also create client record
        if (type === 'client') {
            const clientId = uuidv4();
            db.prepare(`
        INSERT INTO clients (id, user_id, name, phone)
        VALUES (?, ?, ?, ?)
      `).run(clientId, userId, name, phone);
        }

        const user = db.prepare('SELECT id, name, email, phone, type, avatar_url FROM users WHERE id = ?').get(userId);
        const tokens = generateTokens(user);

        // Save refresh token
        db.prepare(`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES (?, ?, ?, datetime('now', '+7 days'))
    `).run(uuidv4(), userId, tokens.refreshToken);

        res.status(201).json({
            success: true,
            message: 'Conta criada com sucesso',
            data: {
                user,
                ...tokens
            }
        });
    } catch (error) {
        next(error);
    }
});

// Login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new AppError('Email e senha são obrigatórios', 400);
        }

        // Find user
        const user = db.prepare('SELECT * FROM users WHERE email = ? OR phone = ?').get(email, email);
        if (!user) {
            throw new AppError('Credenciais inválidas', 401);
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw new AppError('Credenciais inválidas', 401);
        }

        const tokens = generateTokens(user);

        // Save refresh token
        db.prepare(`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES (?, ?, ?, datetime('now', '+7 days'))
    `).run(uuidv4(), user.id, tokens.refreshToken);

        // Get additional info based on type
        let additionalData = {};
        if (user.type === 'salon') {
            const salon = db.prepare('SELECT * FROM salons WHERE owner_id = ?').get(user.id);
            additionalData.salon = salon;
        } else if (user.type === 'professional') {
            const professional = db.prepare('SELECT * FROM professionals WHERE user_id = ?').get(user.id);
            additionalData.professional = professional;
        } else if (user.type === 'client') {
            const client = db.prepare('SELECT * FROM clients WHERE user_id = ?').get(user.id);
            additionalData.client = client;
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    type: user.type,
                    avatar_url: user.avatar_url
                },
                ...additionalData,
                ...tokens
            }
        });
    } catch (error) {
        next(error);
    }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw new AppError('Refresh token é obrigatório', 400);
        }

        // Verify token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Check if token exists in database
        const storedToken = db.prepare(`
      SELECT * FROM refresh_tokens 
      WHERE user_id = ? AND token = ? AND expires_at > datetime('now')
    `).get(decoded.userId, refreshToken);

        if (!storedToken) {
            throw new AppError('Refresh token inválido ou expirado', 401);
        }

        // Get user
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
        if (!user) {
            throw new AppError('Usuário não encontrado', 404);
        }

        // Generate new tokens
        const tokens = generateTokens(user);

        // Delete old refresh token and save new one
        db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
        db.prepare(`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES (?, ?, ?, datetime('now', '+7 days'))
    `).run(uuidv4(), user.id, tokens.refreshToken);

        res.json({
            success: true,
            data: tokens
        });
    } catch (error) {
        next(error);
    }
});

// Logout
router.post('/logout', authenticate, (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
        }

        res.json({
            success: true,
            message: 'Logout realizado com sucesso'
        });
    } catch (error) {
        next(error);
    }
});

// Get current user
router.get('/me', authenticate, (req, res, next) => {
    try {
        const user = db.prepare(`
      SELECT id, name, email, phone, type, avatar_url, created_at
      FROM users WHERE id = ?
    `).get(req.user.userId);

        if (!user) {
            throw new AppError('Usuário não encontrado', 404);
        }

        let additionalData = {};
        if (user.type === 'salon') {
            const salon = db.prepare('SELECT * FROM salons WHERE owner_id = ?').get(user.id);
            additionalData.salon = salon;
        } else if (user.type === 'professional') {
            const professional = db.prepare('SELECT * FROM professionals WHERE user_id = ?').get(user.id);
            additionalData.professional = professional;
        } else if (user.type === 'client') {
            const client = db.prepare('SELECT * FROM clients WHERE user_id = ?').get(user.id);
            additionalData.client = client;
        }

        res.json({
            success: true,
            data: { user, ...additionalData }
        });
    } catch (error) {
        next(error);
    }
});

// Update profile
router.put('/profile', authenticate, async (req, res, next) => {
    try {
        const { name, phone, avatar_url } = req.body;
        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (phone) {
            updates.push('phone = ?');
            values.push(phone);
        }
        if (avatar_url !== undefined) {
            updates.push('avatar_url = ?');
            values.push(avatar_url);
        }

        if (updates.length > 0) {
            updates.push('updated_at = datetime("now")');
            values.push(req.user.userId);

            db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
        }

        const user = db.prepare('SELECT id, name, email, phone, type, avatar_url FROM users WHERE id = ?')
            .get(req.user.userId);

        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        next(error);
    }
});

// Change password
router.put('/password', authenticate, async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            throw new AppError('Senha atual e nova senha são obrigatórias', 400);
        }

        if (newPassword.length < 6) {
            throw new AppError('Nova senha deve ter no mínimo 6 caracteres', 400);
        }

        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId);
        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

        if (!isValidPassword) {
            throw new AppError('Senha atual incorreta', 401);
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?')
            .run(newPasswordHash, req.user.userId);

        res.json({
            success: true,
            message: 'Senha alterada com sucesso'
        });
    } catch (error) {
        next(error);
    }
});

export default router;
