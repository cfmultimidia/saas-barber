import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Create review
router.post('/', authenticate, (req, res, next) => {
    try {
        const { appointment_id, rating, comment } = req.body;

        if (!appointment_id || !rating) {
            throw new AppError('Agendamento e avaliação são obrigatórios', 400);
        }

        if (rating < 1 || rating > 5) {
            throw new AppError('Avaliação deve ser entre 1 e 5', 400);
        }

        // Get appointment
        const appointment = db.prepare(`
      SELECT a.*, c.id as client_id, c.user_id as client_user_id
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      WHERE a.id = ?
    `).get(appointment_id);

        if (!appointment) {
            throw new AppError('Agendamento não encontrado', 404);
        }

        // Check if user is the client
        if (appointment.client_user_id !== req.user.userId) {
            throw new AppError('Você não pode avaliar este agendamento', 403);
        }

        // Check if already reviewed
        const existing = db.prepare('SELECT id FROM reviews WHERE appointment_id = ?').get(appointment_id);
        if (existing) {
            throw new AppError('Você já avaliou este agendamento', 400);
        }

        // Create review
        const reviewId = uuidv4();
        db.prepare(`
      INSERT INTO reviews (id, appointment_id, client_id, professional_id, salon_id, rating, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
            reviewId,
            appointment_id,
            appointment.client_id,
            appointment.professional_id,
            appointment.salon_id,
            rating,
            comment || null
        );

        // Update professional rating
        const profReviews = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as count 
      FROM reviews WHERE professional_id = ?
    `).get(appointment.professional_id);

        db.prepare(`
      UPDATE professionals 
      SET average_rating = ?, total_reviews = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(profReviews.avg_rating, profReviews.count, appointment.professional_id);

        // Update salon rating
        const salonReviews = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as count 
      FROM reviews WHERE salon_id = ?
    `).get(appointment.salon_id);

        db.prepare(`
      UPDATE salons 
      SET average_rating = ?, total_reviews = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(salonReviews.avg_rating, salonReviews.count, appointment.salon_id);

        const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(reviewId);

        res.status(201).json({
            success: true,
            message: 'Avaliação enviada com sucesso',
            data: review
        });
    } catch (error) {
        next(error);
    }
});

// Get reviews for professional
router.get('/professional/:id', optionalAuth, (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const reviews = db.prepare(`
      SELECT r.*, c.name as client_name
      FROM reviews r
      JOIN clients c ON r.client_id = c.id
      WHERE r.professional_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.params.id, parseInt(limit), offset);

        // Get stats
        const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        AVG(rating) as average,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM reviews WHERE professional_id = ?
    `).get(req.params.id);

        res.json({
            success: true,
            data: { reviews, stats }
        });
    } catch (error) {
        next(error);
    }
});

// Get reviews for salon
router.get('/salon/:id', optionalAuth, (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const reviews = db.prepare(`
      SELECT r.*, c.name as client_name, p.name as professional_name
      FROM reviews r
      JOIN clients c ON r.client_id = c.id
      JOIN professionals p ON r.professional_id = p.id
      WHERE r.salon_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.params.id, parseInt(limit), offset);

        const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        AVG(rating) as average,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM reviews WHERE salon_id = ?
    `).get(req.params.id);

        res.json({
            success: true,
            data: { reviews, stats }
        });
    } catch (error) {
        next(error);
    }
});

// Check if appointment can be reviewed
router.get('/can-review/:appointment_id', authenticate, (req, res, next) => {
    try {
        const appointment = db.prepare(`
      SELECT a.*, c.user_id as client_user_id
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      WHERE a.id = ?
    `).get(req.params.appointment_id);

        if (!appointment) {
            return res.json({ success: true, data: { canReview: false, reason: 'Agendamento não encontrado' } });
        }

        if (appointment.client_user_id !== req.user.userId) {
            return res.json({ success: true, data: { canReview: false, reason: 'Não é seu agendamento' } });
        }

        if (appointment.status !== 'completed') {
            return res.json({ success: true, data: { canReview: false, reason: 'Agendamento não foi concluído' } });
        }

        const existing = db.prepare('SELECT id FROM reviews WHERE appointment_id = ?').get(req.params.appointment_id);
        if (existing) {
            return res.json({ success: true, data: { canReview: false, reason: 'Já avaliado' } });
        }

        res.json({ success: true, data: { canReview: true } });
    } catch (error) {
        next(error);
    }
});

export default router;
