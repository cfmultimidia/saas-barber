import { Router } from 'express';
import db from '../db.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Get clients (salon owner)
router.get('/', authenticate, authorize('salon'), (req, res, next) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const salon = db.prepare('SELECT id FROM salons WHERE owner_id = ?').get(req.user.userId);
        if (!salon) {
            throw new AppError('Salão não encontrado', 404);
        }

        let query = `
      SELECT DISTINCT c.*, 
        (SELECT COUNT(*) FROM appointments a WHERE a.client_id = c.id AND a.salon_id = ?) as total_appointments,
        (SELECT MAX(scheduled_date) FROM appointments a WHERE a.client_id = c.id AND a.salon_id = ?) as last_appointment
      FROM clients c
      WHERE EXISTS (SELECT 1 FROM appointments a WHERE a.client_id = c.id AND a.salon_id = ?)
    `;
        const params = [salon.id, salon.id, salon.id];

        if (search) {
            query += ' AND (c.name LIKE ? OR c.phone LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY last_appointment DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);

        const clients = db.prepare(query).all(...params);

        // Get total count
        const countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM clients c
      WHERE EXISTS (SELECT 1 FROM appointments a WHERE a.client_id = c.id AND a.salon_id = ?)
      ${search ? ' AND (c.name LIKE ? OR c.phone LIKE ?)' : ''}
    `;
        const countParams = search ? [salon.id, `%${search}%`, `%${search}%`] : [salon.id];
        const count = db.prepare(countQuery).get(...countParams);

        res.json({
            success: true,
            data: clients,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count.total,
                totalPages: Math.ceil(count.total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get client by ID
router.get('/:id', authenticate, authorize('salon'), (req, res, next) => {
    try {
        const salon = db.prepare('SELECT id FROM salons WHERE owner_id = ?').get(req.user.userId);

        const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
        if (!client) {
            throw new AppError('Cliente não encontrado', 404);
        }

        // Get appointment history
        const appointments = db.prepare(`
      SELECT a.*, s.name as service_name, p.name as professional_name
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN professionals p ON a.professional_id = p.id
      WHERE a.client_id = ? AND a.salon_id = ?
      ORDER BY a.scheduled_date DESC, a.scheduled_time DESC
    `).all(req.params.id, salon.id);

        // Get total spent
        const totalSpent = db.prepare(`
      SELECT COALESCE(SUM(price), 0) as total
      FROM appointments
      WHERE client_id = ? AND salon_id = ? AND status = 'completed'
    `).get(req.params.id, salon.id);

        // Get reviews
        const reviews = db.prepare(`
      SELECT r.*, p.name as professional_name
      FROM reviews r
      JOIN professionals p ON r.professional_id = p.id
      WHERE r.client_id = ? AND r.salon_id = ?
    `).all(req.params.id, salon.id);

        res.json({
            success: true,
            data: {
                ...client,
                appointments,
                total_spent: totalSpent.total,
                total_appointments: appointments.length,
                reviews,
                average_rating: reviews.length > 0
                    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                    : null
            }
        });
    } catch (error) {
        next(error);
    }
});

// Update client notes (salon owner)
router.put('/:id', authenticate, authorize('salon'), (req, res, next) => {
    try {
        const { notes } = req.body;

        const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
        if (!client) {
            throw new AppError('Cliente não encontrado', 404);
        }

        db.prepare('UPDATE clients SET notes = ?, updated_at = datetime("now") WHERE id = ?')
            .run(notes, req.params.id);

        const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);

        res.json({
            success: true,
            data: updated
        });
    } catch (error) {
        next(error);
    }
});

export default router;
