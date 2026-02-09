import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Get all salons (public)
router.get('/', optionalAuth, (req, res, next) => {
    try {
        const { niche, search, rating_min } = req.query;
        let query = 'SELECT * FROM salons WHERE 1=1';
        const params = [];

        if (niche) {
            query += ' AND niche = ?';
            params.push(niche);
        }

        if (search) {
            query += ' AND (name LIKE ? OR address LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (rating_min) {
            query += ' AND average_rating >= ?';
            params.push(parseFloat(rating_min));
        }

        query += ' ORDER BY average_rating DESC';

        const salons = db.prepare(query).all(...params);

        res.json({
            success: true,
            data: salons
        });
    } catch (error) {
        next(error);
    }
});

// Get salon by ID (public)
router.get('/:id', optionalAuth, (req, res, next) => {
    try {
        const salon = db.prepare('SELECT * FROM salons WHERE id = ?').get(req.params.id);

        if (!salon) {
            throw new AppError('Salão não encontrado', 404);
        }

        // Get professionals
        const professionals = db.prepare(`
      SELECT p.*, COUNT(r.id) as review_count
      FROM professionals p
      LEFT JOIN reviews r ON r.professional_id = p.id
      WHERE p.salon_id = ? AND p.is_active = 1
      GROUP BY p.id
    `).all(req.params.id);

        // Get services
        const services = db.prepare(`
      SELECT * FROM services WHERE salon_id = ? AND is_active = 1 ORDER BY category, name
    `).all(req.params.id);

        // Get recent reviews
        const reviews = db.prepare(`
      SELECT r.*, c.name as client_name
      FROM reviews r
      JOIN clients c ON r.client_id = c.id
      WHERE r.salon_id = ?
      ORDER BY r.created_at DESC
      LIMIT 5
    `).all(req.params.id);

        res.json({
            success: true,
            data: {
                ...salon,
                professionals,
                services,
                reviews
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get my salon (for salon owner)
router.get('/my/salon', authenticate, authorize('salon'), (req, res, next) => {
    try {
        const salon = db.prepare('SELECT * FROM salons WHERE owner_id = ?').get(req.user.userId);

        if (!salon) {
            throw new AppError('Salão não encontrado', 404);
        }

        res.json({
            success: true,
            data: salon
        });
    } catch (error) {
        next(error);
    }
});

// Update salon
router.put('/:id', authenticate, authorize('salon'), (req, res, next) => {
    try {
        const salon = db.prepare('SELECT * FROM salons WHERE id = ? AND owner_id = ?')
            .get(req.params.id, req.user.userId);

        if (!salon) {
            throw new AppError('Salão não encontrado ou sem permissão', 404);
        }

        const {
            name, address, phone, email, instagram, whatsapp,
            opening_hours, closing_hours, logo_url, cover_photo_url, bio
        } = req.body;

        db.prepare(`
      UPDATE salons SET
        name = COALESCE(?, name),
        address = COALESCE(?, address),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        instagram = COALESCE(?, instagram),
        whatsapp = COALESCE(?, whatsapp),
        opening_hours = COALESCE(?, opening_hours),
        closing_hours = COALESCE(?, closing_hours),
        logo_url = COALESCE(?, logo_url),
        cover_photo_url = COALESCE(?, cover_photo_url),
        bio = COALESCE(?, bio),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
            name, address, phone, email, instagram, whatsapp,
            opening_hours, closing_hours, logo_url, cover_photo_url, bio,
            req.params.id
        );

        const updated = db.prepare('SELECT * FROM salons WHERE id = ?').get(req.params.id);

        res.json({
            success: true,
            data: updated
        });
    } catch (error) {
        next(error);
    }
});

// Get salon services
router.get('/:id/services', optionalAuth, (req, res, next) => {
    try {
        const services = db.prepare(`
      SELECT s.*, GROUP_CONCAT(p.name) as professional_names
      FROM services s
      LEFT JOIN professional_services ps ON s.id = ps.service_id
      LEFT JOIN professionals p ON ps.professional_id = p.id
      WHERE s.salon_id = ? AND s.is_active = 1
      GROUP BY s.id
      ORDER BY s.category, s.name
    `).all(req.params.id);

        res.json({
            success: true,
            data: services
        });
    } catch (error) {
        next(error);
    }
});

// Get salon professionals
router.get('/:id/professionals', optionalAuth, (req, res, next) => {
    try {
        const professionals = db.prepare(`
      SELECT p.*, GROUP_CONCAT(s.name) as service_names
      FROM professionals p
      LEFT JOIN professional_services ps ON p.id = ps.professional_id
      LEFT JOIN services s ON ps.service_id = s.id
      WHERE p.salon_id = ? AND p.is_active = 1
      GROUP BY p.id
    `).all(req.params.id);

        res.json({
            success: true,
            data: professionals
        });
    } catch (error) {
        next(error);
    }
});

// Get salon stats (for owner)
router.get('/:id/stats', authenticate, authorize('salon'), (req, res, next) => {
    try {
        const salon = db.prepare('SELECT * FROM salons WHERE id = ? AND owner_id = ?')
            .get(req.params.id, req.user.userId);

        if (!salon) {
            throw new AppError('Salão não encontrado', 404);
        }

        const today = new Date().toISOString().split('T')[0];
        const firstOfMonth = `${today.substring(0, 7)}-01`;

        // Today's appointments
        const todayAppts = db.prepare(`
      SELECT COUNT(*) as count FROM appointments 
      WHERE salon_id = ? AND scheduled_date = ? AND status != 'cancelled'
    `).get(req.params.id, today);

        // Today's revenue
        const todayRevenue = db.prepare(`
      SELECT COALESCE(SUM(price), 0) as total FROM appointments 
      WHERE salon_id = ? AND scheduled_date = ? AND status = 'completed'
    `).get(req.params.id, today);

        // Month revenue
        const monthRevenue = db.prepare(`
      SELECT COALESCE(SUM(price), 0) as total FROM appointments 
      WHERE salon_id = ? AND scheduled_date >= ? AND status = 'completed'
    `).get(req.params.id, firstOfMonth);

        // New clients this month
        const newClients = db.prepare(`
      SELECT COUNT(DISTINCT client_id) as count FROM appointments 
      WHERE salon_id = ? AND scheduled_date >= ?
    `).get(req.params.id, firstOfMonth);

        // Attendance rate
        const totalAppts = db.prepare(`
      SELECT COUNT(*) as total FROM appointments 
      WHERE salon_id = ? AND scheduled_date < ? AND status IN ('completed', 'no_show')
    `).get(req.params.id, today);

        const completedAppts = db.prepare(`
      SELECT COUNT(*) as total FROM appointments 
      WHERE salon_id = ? AND scheduled_date < ? AND status = 'completed'
    `).get(req.params.id, today);

        const attendanceRate = totalAppts.total > 0
            ? Math.round((completedAppts.total / totalAppts.total) * 100)
            : 100;

        res.json({
            success: true,
            data: {
                today_appointments: todayAppts.count,
                today_revenue: todayRevenue.total,
                month_revenue: monthRevenue.total,
                new_clients: newClients.count,
                average_rating: salon.average_rating,
                attendance_rate: attendanceRate
            }
        });
    } catch (error) {
        next(error);
    }
});

export default router;
