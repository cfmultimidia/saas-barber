import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Get services (optionally filtered by salon)
router.get('/', optionalAuth, (req, res, next) => {
    try {
        const { salon_id, category, niche } = req.query;
        let query = 'SELECT * FROM services WHERE is_active = 1';
        const params = [];

        if (salon_id) {
            query += ' AND salon_id = ?';
            params.push(salon_id);
        }

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' ORDER BY category, name';

        const services = db.prepare(query).all(...params);

        res.json({
            success: true,
            data: services
        });
    } catch (error) {
        next(error);
    }
});

// Get service by ID
router.get('/:id', optionalAuth, (req, res, next) => {
    try {
        const service = db.prepare(`
      SELECT s.*, sl.name as salon_name
      FROM services s
      JOIN salons sl ON s.salon_id = sl.id
      WHERE s.id = ?
    `).get(req.params.id);

        if (!service) {
            throw new AppError('Serviço não encontrado', 404);
        }

        // Get professionals that offer this service
        const professionals = db.prepare(`
      SELECT p.* FROM professionals p
      JOIN professional_services ps ON p.id = ps.professional_id
      WHERE ps.service_id = ? AND p.is_active = 1
    `).all(req.params.id);

        res.json({
            success: true,
            data: { ...service, professionals }
        });
    } catch (error) {
        next(error);
    }
});

// Create service (salon owner)
router.post('/', authenticate, authorize('salon'), (req, res, next) => {
    try {
        const { name, description, duration_minutes, price, category, icon, professional_ids } = req.body;

        if (!name || !duration_minutes || !price) {
            throw new AppError('Nome, duração e preço são obrigatórios', 400);
        }

        const salon = db.prepare('SELECT id FROM salons WHERE owner_id = ?').get(req.user.userId);
        if (!salon) {
            throw new AppError('Salão não encontrado', 404);
        }

        const serviceId = uuidv4();
        db.prepare(`
      INSERT INTO services (id, salon_id, name, description, duration_minutes, price, category, icon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(serviceId, salon.id, name, description || null, duration_minutes, price, category || null, icon || 'scissors');

        // Link professionals
        if (professional_ids && professional_ids.length > 0) {
            for (const profId of professional_ids) {
                db.prepare('INSERT INTO professional_services (professional_id, service_id) VALUES (?, ?)')
                    .run(profId, serviceId);
            }
        }

        const service = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);

        res.status(201).json({
            success: true,
            message: 'Serviço criado com sucesso',
            data: service
        });
    } catch (error) {
        next(error);
    }
});

// Update service
router.put('/:id', authenticate, authorize('salon'), (req, res, next) => {
    try {
        const salon = db.prepare('SELECT id FROM salons WHERE owner_id = ?').get(req.user.userId);
        const service = db.prepare('SELECT * FROM services WHERE id = ? AND salon_id = ?')
            .get(req.params.id, salon.id);

        if (!service) {
            throw new AppError('Serviço não encontrado', 404);
        }

        const { name, description, duration_minutes, price, category, icon, is_active, professional_ids } = req.body;

        db.prepare(`
      UPDATE services SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        duration_minutes = COALESCE(?, duration_minutes),
        price = COALESCE(?, price),
        category = COALESCE(?, category),
        icon = COALESCE(?, icon),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(name, description, duration_minutes, price, category, icon, is_active, req.params.id);

        // Update professionals if provided
        if (professional_ids) {
            db.prepare('DELETE FROM professional_services WHERE service_id = ?').run(req.params.id);
            for (const profId of professional_ids) {
                db.prepare('INSERT INTO professional_services (professional_id, service_id) VALUES (?, ?)')
                    .run(profId, req.params.id);
            }
        }

        const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);

        res.json({
            success: true,
            data: updated
        });
    } catch (error) {
        next(error);
    }
});

// Delete service
router.delete('/:id', authenticate, authorize('salon'), (req, res, next) => {
    try {
        const salon = db.prepare('SELECT id FROM salons WHERE owner_id = ?').get(req.user.userId);
        const service = db.prepare('SELECT * FROM services WHERE id = ? AND salon_id = ?')
            .get(req.params.id, salon.id);

        if (!service) {
            throw new AppError('Serviço não encontrado', 404);
        }

        // Soft delete
        db.prepare('UPDATE services SET is_active = 0, updated_at = datetime("now") WHERE id = ?')
            .run(req.params.id);

        res.json({
            success: true,
            message: 'Serviço removido'
        });
    } catch (error) {
        next(error);
    }
});

// Get service categories
router.get('/categories/list', optionalAuth, (req, res, next) => {
    try {
        const categories = db.prepare(`
      SELECT DISTINCT category FROM services WHERE category IS NOT NULL AND is_active = 1
    `).all();

        res.json({
            success: true,
            data: categories.map(c => c.category)
        });
    } catch (error) {
        next(error);
    }
});

export default router;
