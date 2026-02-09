import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Get all professionals (optionally filtered by salon)
router.get('/', optionalAuth, (req, res, next) => {
    try {
        const { salon_id, service_id } = req.query;
        let query = `
      SELECT p.*, s.name as salon_name
      FROM professionals p
      JOIN salons s ON p.salon_id = s.id
      WHERE p.is_active = 1
    `;
        const params = [];

        if (salon_id) {
            query += ' AND p.salon_id = ?';
            params.push(salon_id);
        }

        if (service_id) {
            query += ' AND EXISTS (SELECT 1 FROM professional_services ps WHERE ps.professional_id = p.id AND ps.service_id = ?)';
            params.push(service_id);
        }

        const professionals = db.prepare(query).all(...params);

        res.json({
            success: true,
            data: professionals
        });
    } catch (error) {
        next(error);
    }
});

// Get professional by ID
router.get('/:id', optionalAuth, (req, res, next) => {
    try {
        const professional = db.prepare(`
      SELECT p.*, s.name as salon_name, s.address as salon_address
      FROM professionals p
      JOIN salons s ON p.salon_id = s.id
      WHERE p.id = ?
    `).get(req.params.id);

        if (!professional) {
            throw new AppError('Profissional não encontrado', 404);
        }

        // Get services
        const services = db.prepare(`
      SELECT s.* FROM services s
      JOIN professional_services ps ON s.id = ps.service_id
      WHERE ps.professional_id = ?
    `).all(req.params.id);

        // Get schedule
        const schedule = db.prepare(`
      SELECT * FROM professional_schedules
      WHERE professional_id = ?
      ORDER BY day_of_week
    `).all(req.params.id);

        // Get reviews
        const reviews = db.prepare(`
      SELECT r.*, c.name as client_name
      FROM reviews r
      JOIN clients c ON r.client_id = c.id
      WHERE r.professional_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
    `).all(req.params.id);

        res.json({
            success: true,
            data: {
                ...professional,
                services,
                schedule,
                reviews
            }
        });
    } catch (error) {
        next(error);
    }
});

// Create professional (salon owner)
router.post('/', authenticate, authorize('salon'), async (req, res, next) => {
    try {
        const { name, email, phone, password, specialty, bio, photo_url, commission_percentage, service_ids } = req.body;

        if (!name || !email || !phone) {
            throw new AppError('Nome, email e telefone são obrigatórios', 400);
        }

        // Get salon
        const salon = db.prepare('SELECT id FROM salons WHERE owner_id = ?').get(req.user.userId);
        if (!salon) {
            throw new AppError('Salão não encontrado', 404);
        }

        // Create user for professional
        const userId = uuidv4();
        const passwordHash = await bcrypt.hash(password || '123456', 10);

        db.prepare(`
      INSERT INTO users (id, name, email, phone, password_hash, type)
      VALUES (?, ?, ?, ?, ?, 'professional')
    `).run(userId, name, email, phone, passwordHash);

        // Create professional
        const professionalId = uuidv4();
        db.prepare(`
      INSERT INTO professionals (id, salon_id, user_id, name, specialty, bio, photo_url, commission_percentage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(professionalId, salon.id, userId, name, specialty || null, bio || null, photo_url || null, commission_percentage || 50);

        // Create default schedule (Mon-Sat 9-19)
        for (let day = 1; day <= 6; day++) {
            db.prepare(`
        INSERT INTO professional_schedules (id, professional_id, day_of_week, start_time, end_time, is_working)
        VALUES (?, ?, ?, '09:00', '19:00', 1)
      `).run(uuidv4(), professionalId, day);
        }
        // Sunday off
        db.prepare(`
      INSERT INTO professional_schedules (id, professional_id, day_of_week, start_time, end_time, is_working)
      VALUES (?, ?, 0, '09:00', '19:00', 0)
    `).run(uuidv4(), professionalId);

        // Link services
        if (service_ids && service_ids.length > 0) {
            for (const serviceId of service_ids) {
                db.prepare('INSERT INTO professional_services (professional_id, service_id) VALUES (?, ?)')
                    .run(professionalId, serviceId);
            }
        }

        const professional = db.prepare('SELECT * FROM professionals WHERE id = ?').get(professionalId);

        res.status(201).json({
            success: true,
            message: 'Profissional criado com sucesso',
            data: professional
        });
    } catch (error) {
        next(error);
    }
});

// Update professional
router.put('/:id', authenticate, authorize('salon', 'professional'), (req, res, next) => {
    try {
        const { name, specialty, bio, photo_url, commission_percentage, is_active, service_ids } = req.body;

        // Check permission
        let professional;
        if (req.user.type === 'salon') {
            const salon = db.prepare('SELECT id FROM salons WHERE owner_id = ?').get(req.user.userId);
            professional = db.prepare('SELECT * FROM professionals WHERE id = ? AND salon_id = ?')
                .get(req.params.id, salon.id);
        } else {
            professional = db.prepare('SELECT * FROM professionals WHERE id = ? AND user_id = ?')
                .get(req.params.id, req.user.userId);
        }

        if (!professional) {
            throw new AppError('Profissional não encontrado ou sem permissão', 404);
        }

        db.prepare(`
      UPDATE professionals SET
        name = COALESCE(?, name),
        specialty = COALESCE(?, specialty),
        bio = COALESCE(?, bio),
        photo_url = COALESCE(?, photo_url),
        commission_percentage = COALESCE(?, commission_percentage),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(name, specialty, bio, photo_url, commission_percentage, is_active, req.params.id);

        // Update services if provided
        if (service_ids) {
            db.prepare('DELETE FROM professional_services WHERE professional_id = ?').run(req.params.id);
            for (const serviceId of service_ids) {
                db.prepare('INSERT INTO professional_services (professional_id, service_id) VALUES (?, ?)')
                    .run(req.params.id, serviceId);
            }
        }

        const updated = db.prepare('SELECT * FROM professionals WHERE id = ?').get(req.params.id);

        res.json({
            success: true,
            data: updated
        });
    } catch (error) {
        next(error);
    }
});

// Delete professional (salon owner)
router.delete('/:id', authenticate, authorize('salon'), (req, res, next) => {
    try {
        const salon = db.prepare('SELECT id FROM salons WHERE owner_id = ?').get(req.user.userId);
        const professional = db.prepare('SELECT * FROM professionals WHERE id = ? AND salon_id = ?')
            .get(req.params.id, salon.id);

        if (!professional) {
            throw new AppError('Profissional não encontrado', 404);
        }

        // Soft delete
        db.prepare('UPDATE professionals SET is_active = 0, updated_at = datetime("now") WHERE id = ?')
            .run(req.params.id);

        res.json({
            success: true,
            message: 'Profissional removido'
        });
    } catch (error) {
        next(error);
    }
});

// Get professional schedule
router.get('/:id/schedule', optionalAuth, (req, res, next) => {
    try {
        const schedule = db.prepare(`
      SELECT * FROM professional_schedules
      WHERE professional_id = ?
      ORDER BY day_of_week
    `).all(req.params.id);

        const daysOff = db.prepare(`
      SELECT * FROM professional_days_off
      WHERE professional_id = ? AND date_end >= date('now')
      ORDER BY date_start
    `).all(req.params.id);

        res.json({
            success: true,
            data: { schedule, daysOff }
        });
    } catch (error) {
        next(error);
    }
});

// Update professional schedule
router.put('/:id/schedule', authenticate, authorize('salon', 'professional'), (req, res, next) => {
    try {
        const { schedule, daysOff } = req.body;

        // Update weekly schedule
        if (schedule && schedule.length > 0) {
            for (const day of schedule) {
                db.prepare(`
          UPDATE professional_schedules SET
            start_time = ?,
            end_time = ?,
            is_working = ?
          WHERE professional_id = ? AND day_of_week = ?
        `).run(day.start_time, day.end_time, day.is_working ? 1 : 0, req.params.id, day.day_of_week);
            }
        }

        // Add days off
        if (daysOff && daysOff.length > 0) {
            for (const dayOff of daysOff) {
                if (dayOff.id) {
                    // Update existing
                    db.prepare(`
            UPDATE professional_days_off SET
              date_start = ?,
              date_end = ?,
              reason = ?
            WHERE id = ?
          `).run(dayOff.date_start, dayOff.date_end, dayOff.reason, dayOff.id);
                } else {
                    // Create new
                    db.prepare(`
            INSERT INTO professional_days_off (id, professional_id, date_start, date_end, reason)
            VALUES (?, ?, ?, ?, ?)
          `).run(uuidv4(), req.params.id, dayOff.date_start, dayOff.date_end, dayOff.reason);
                }
            }
        }

        res.json({
            success: true,
            message: 'Horários atualizados'
        });
    } catch (error) {
        next(error);
    }
});

// Get professional stats
router.get('/:id/stats', authenticate, authorize('professional', 'salon'), (req, res, next) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const firstOfMonth = `${today.substring(0, 7)}-01`;

        // Today's appointments
        const todayAppts = db.prepare(`
      SELECT COUNT(*) as count FROM appointments 
      WHERE professional_id = ? AND scheduled_date = ? AND status != 'cancelled'
    `).get(req.params.id, today);

        // Today's revenue (commission)
        const professional = db.prepare('SELECT commission_percentage FROM professionals WHERE id = ?')
            .get(req.params.id);

        const todayRev = db.prepare(`
      SELECT COALESCE(SUM(price), 0) as total FROM appointments 
      WHERE professional_id = ? AND scheduled_date = ? AND status = 'completed'
    `).get(req.params.id, today);

        const todayCommission = (todayRev.total * (professional?.commission_percentage || 50)) / 100;

        // Month revenue
        const monthRev = db.prepare(`
      SELECT COALESCE(SUM(price), 0) as total FROM appointments 
      WHERE professional_id = ? AND scheduled_date >= ? AND status = 'completed'
    `).get(req.params.id, firstOfMonth);

        const monthCommission = (monthRev.total * (professional?.commission_percentage || 50)) / 100;

        res.json({
            success: true,
            data: {
                today_appointments: todayAppts.count,
                today_revenue: todayCommission,
                month_revenue: monthCommission,
                average_rating: professional?.average_rating || 0
            }
        });
    } catch (error) {
        next(error);
    }
});

export default router;
