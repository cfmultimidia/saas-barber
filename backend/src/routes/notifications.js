import { Router } from 'express';
import db from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get user notifications
router.get('/', authenticate, (req, res, next) => {
    try {
        const { unread_only, limit = 20 } = req.query;

        let query = 'SELECT * FROM notifications WHERE user_id = ?';
        const params = [req.user.userId];

        if (unread_only === 'true') {
            query += ' AND is_read = 0';
        }

        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const notifications = db.prepare(query).all(...params);

        // Get unread count
        const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0
    `).get(req.user.userId);

        res.json({
            success: true,
            data: notifications,
            unread_count: unreadCount.count
        });
    } catch (error) {
        next(error);
    }
});

// Mark notification as read
router.patch('/:id/read', authenticate, (req, res, next) => {
    try {
        db.prepare(`
      UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.user.userId);

        res.json({
            success: true,
            message: 'Notificação marcada como lida'
        });
    } catch (error) {
        next(error);
    }
});

// Mark all as read
router.patch('/read-all', authenticate, (req, res, next) => {
    try {
        db.prepare(`
      UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0
    `).run(req.user.userId);

        res.json({
            success: true,
            message: 'Todas notificações marcadas como lidas'
        });
    } catch (error) {
        next(error);
    }
});

// Delete notification
router.delete('/:id', authenticate, (req, res, next) => {
    try {
        db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?')
            .run(req.params.id, req.user.userId);

        res.json({
            success: true,
            message: 'Notificação removida'
        });
    } catch (error) {
        next(error);
    }
});

export default router;
