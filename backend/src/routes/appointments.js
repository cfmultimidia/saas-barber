import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { emitAppointmentUpdate, emitToSalon, emitToProfessional, emitToUser } from '../socket.js';

const router = Router();

// Get appointments (with filters)
router.get('/', authenticate, (req, res, next) => {
    try {
        const { status, date, professional_id, salon_id, client_id, from_date, to_date } = req.query;
        let query = `
      SELECT 
        a.*,
        s.name as service_name,
        s.icon as service_icon,
        p.name as professional_name,
        p.photo_url as professional_photo,
        c.name as client_name,
        c.phone as client_phone,
        sl.name as salon_name,
        sl.address as salon_address,
        sl.whatsapp as salon_whatsapp
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN professionals p ON a.professional_id = p.id
      JOIN clients c ON a.client_id = c.id
      JOIN salons sl ON a.salon_id = sl.id
      WHERE 1=1
    `;
        const params = [];

        // Filter by user type
        if (req.user.type === 'client') {
            const client = db.prepare('SELECT id FROM clients WHERE user_id = ?').get(req.user.userId);
            if (client) {
                query += ' AND a.client_id = ?';
                params.push(client.id);
            }
        } else if (req.user.type === 'professional') {
            const professional = db.prepare('SELECT id FROM professionals WHERE user_id = ?').get(req.user.userId);
            if (professional) {
                query += ' AND a.professional_id = ?';
                params.push(professional.id);
            }
        } else if (req.user.type === 'salon') {
            const salon = db.prepare('SELECT id FROM salons WHERE owner_id = ?').get(req.user.userId);
            if (salon) {
                query += ' AND a.salon_id = ?';
                params.push(salon.id);
            }
        }

        // Apply filters
        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }
        if (date) {
            query += ' AND a.scheduled_date = ?';
            params.push(date);
        }
        if (from_date) {
            query += ' AND a.scheduled_date >= ?';
            params.push(from_date);
        }
        if (to_date) {
            query += ' AND a.scheduled_date <= ?';
            params.push(to_date);
        }
        if (professional_id) {
            query += ' AND a.professional_id = ?';
            params.push(professional_id);
        }
        if (salon_id) {
            query += ' AND a.salon_id = ?';
            params.push(salon_id);
        }
        if (client_id) {
            query += ' AND a.client_id = ?';
            params.push(client_id);
        }

        query += ' ORDER BY a.scheduled_date ASC, a.scheduled_time ASC';

        const appointments = db.prepare(query).all(...params);

        res.json({
            success: true,
            data: appointments
        });
    } catch (error) {
        next(error);
    }
});

// Get single appointment
router.get('/:id', authenticate, (req, res, next) => {
    try {
        const appointment = db.prepare(`
      SELECT 
        a.*,
        s.name as service_name,
        s.icon as service_icon,
        s.description as service_description,
        p.name as professional_name,
        p.photo_url as professional_photo,
        p.specialty as professional_specialty,
        c.name as client_name,
        c.phone as client_phone,
        sl.name as salon_name,
        sl.address as salon_address,
        sl.phone as salon_phone,
        sl.whatsapp as salon_whatsapp
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN professionals p ON a.professional_id = p.id
      JOIN clients c ON a.client_id = c.id
      JOIN salons sl ON a.salon_id = sl.id
      WHERE a.id = ?
    `).get(req.params.id);

        if (!appointment) {
            throw new AppError('Agendamento não encontrado', 404);
        }

        res.json({
            success: true,
            data: appointment
        });
    } catch (error) {
        next(error);
    }
});

// Create appointment
router.post('/', authenticate, (req, res, next) => {
    try {
        const {
            salon_id,
            professional_id,
            service_id,
            scheduled_date,
            scheduled_time,
            client_notes,
            client_name,
            client_phone
        } = req.body;

        // Validate required fields
        if (!salon_id || !professional_id || !service_id || !scheduled_date || !scheduled_time) {
            throw new AppError('Todos os campos obrigatórios devem ser preenchidos', 400);
        }

        // Get or create client
        let client;
        if (req.user.type === 'client') {
            client = db.prepare('SELECT * FROM clients WHERE user_id = ?').get(req.user.userId);
        }

        if (!client && client_name && client_phone) {
            // Create guest client
            const clientId = uuidv4();
            db.prepare(`
        INSERT INTO clients (id, user_id, name, phone)
        VALUES (?, ?, ?, ?)
      `).run(clientId, req.user.userId, client_name, client_phone);
            client = { id: clientId, name: client_name, phone: client_phone };
        }

        if (!client) {
            throw new AppError('Dados do cliente são obrigatórios', 400);
        }

        // Get service details
        const service = db.prepare('SELECT * FROM services WHERE id = ?').get(service_id);
        if (!service) {
            throw new AppError('Serviço não encontrado', 404);
        }

        // Check for conflicts
        const conflict = db.prepare(`
      SELECT id FROM appointments 
      WHERE professional_id = ? 
        AND scheduled_date = ? 
        AND scheduled_time = ?
        AND status NOT IN ('cancelled', 'no_show')
    `).get(professional_id, scheduled_date, scheduled_time);

        if (conflict) {
            throw new AppError('Horário não disponível', 400);
        }

        // Create appointment
        const appointmentId = uuidv4();
        db.prepare(`
      INSERT INTO appointments (
        id, salon_id, professional_id, client_id, service_id,
        scheduled_date, scheduled_time, duration_minutes, price,
        client_notes, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `).run(
            appointmentId, salon_id, professional_id, client.id, service_id,
            scheduled_date, scheduled_time, service.duration_minutes, service.price,
            client_notes || null
        );

        // Get full appointment data
        const appointment = db.prepare(`
      SELECT 
        a.*,
        s.name as service_name,
        s.icon as service_icon,
        p.name as professional_name,
        p.photo_url as professional_photo,
        c.name as client_name,
        c.phone as client_phone,
        sl.name as salon_name,
        sl.address as salon_address,
        sl.whatsapp as salon_whatsapp
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN professionals p ON a.professional_id = p.id
      JOIN clients c ON a.client_id = c.id
      JOIN salons sl ON a.salon_id = sl.id
      WHERE a.id = ?
    `).get(appointmentId);

        // Create notifications
        const io = req.app.get('io');

        // Notify salon
        const salon = db.prepare('SELECT owner_id FROM salons WHERE id = ?').get(salon_id);
        if (salon) {
            db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, content, data)
        VALUES (?, ?, 'new_appointment', 'Novo Agendamento', ?, ?)
      `).run(
                uuidv4(), salon.owner_id,
                `${client.name} agendou ${service.name} para ${scheduled_date} às ${scheduled_time}`,
                JSON.stringify({ appointment_id: appointmentId })
            );
            emitToSalon(io, salon_id, 'appointment:created', appointment);
        }

        // Notify professional
        const professional = db.prepare('SELECT user_id FROM professionals WHERE id = ?').get(professional_id);
        if (professional) {
            db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, content, data)
        VALUES (?, ?, 'new_appointment', 'Novo Agendamento', ?, ?)
      `).run(
                uuidv4(), professional.user_id,
                `${client.name} agendou com você: ${service.name} - ${scheduled_date} às ${scheduled_time}`,
                JSON.stringify({ appointment_id: appointmentId })
            );
            emitToProfessional(io, professional_id, 'appointment:created', appointment);
        }

        res.status(201).json({
            success: true,
            message: 'Agendamento criado com sucesso',
            data: appointment
        });
    } catch (error) {
        next(error);
    }
});

// Cancel appointment
router.patch('/:id/cancel', authenticate, (req, res, next) => {
    try {
        const { cancellation_reason } = req.body;

        if (!cancellation_reason) {
            throw new AppError('Motivo do cancelamento é obrigatório', 400);
        }

        const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
        if (!appointment) {
            throw new AppError('Agendamento não encontrado', 404);
        }

        if (appointment.status === 'cancelled') {
            throw new AppError('Agendamento já está cancelado', 400);
        }

        db.prepare(`
      UPDATE appointments 
      SET status = 'cancelled', cancellation_reason = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(cancellation_reason, req.params.id);

        const updatedAppointment = db.prepare(`
      SELECT 
        a.*,
        s.name as service_name,
        p.name as professional_name,
        c.name as client_name,
        sl.name as salon_name
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN professionals p ON a.professional_id = p.id
      JOIN clients c ON a.client_id = c.id
      JOIN salons sl ON a.salon_id = sl.id
      WHERE a.id = ?
    `).get(req.params.id);

        // Emit real-time update
        const io = req.app.get('io');
        emitToSalon(io, appointment.salon_id, 'appointment:cancelled', updatedAppointment);
        emitToProfessional(io, appointment.professional_id, 'appointment:cancelled', updatedAppointment);

        res.json({
            success: true,
            message: 'Agendamento cancelado com sucesso',
            data: updatedAppointment
        });
    } catch (error) {
        next(error);
    }
});

// Reschedule appointment
router.patch('/:id/reschedule', authenticate, (req, res, next) => {
    try {
        const { scheduled_date, scheduled_time } = req.body;

        if (!scheduled_date || !scheduled_time) {
            throw new AppError('Nova data e horário são obrigatórios', 400);
        }

        const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
        if (!appointment) {
            throw new AppError('Agendamento não encontrado', 404);
        }

        // Check for conflicts
        const conflict = db.prepare(`
      SELECT id FROM appointments 
      WHERE professional_id = ? 
        AND scheduled_date = ? 
        AND scheduled_time = ?
        AND status NOT IN ('cancelled', 'no_show')
        AND id != ?
    `).get(appointment.professional_id, scheduled_date, scheduled_time, req.params.id);

        if (conflict) {
            throw new AppError('Horário não disponível', 400);
        }

        db.prepare(`
      UPDATE appointments 
      SET scheduled_date = ?, scheduled_time = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(scheduled_date, scheduled_time, req.params.id);

        const updatedAppointment = db.prepare(`
      SELECT 
        a.*,
        s.name as service_name,
        p.name as professional_name,
        c.name as client_name,
        sl.name as salon_name
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN professionals p ON a.professional_id = p.id
      JOIN clients c ON a.client_id = c.id
      JOIN salons sl ON a.salon_id = sl.id
      WHERE a.id = ?
    `).get(req.params.id);

        // Emit real-time update
        const io = req.app.get('io');
        emitToSalon(io, appointment.salon_id, 'appointment:rescheduled', updatedAppointment);
        emitToProfessional(io, appointment.professional_id, 'appointment:rescheduled', updatedAppointment);

        res.json({
            success: true,
            message: 'Agendamento remarcado com sucesso',
            data: updatedAppointment
        });
    } catch (error) {
        next(error);
    }
});

// Start appointment (professional)
router.patch('/:id/start', authenticate, authorize('professional', 'salon'), (req, res, next) => {
    try {
        const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
        if (!appointment) {
            throw new AppError('Agendamento não encontrado', 404);
        }

        if (appointment.status !== 'scheduled') {
            throw new AppError('Agendamento não pode ser iniciado', 400);
        }

        db.prepare(`
      UPDATE appointments 
      SET status = 'in_progress', started_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(req.params.id);

        const updatedAppointment = db.prepare(`
      SELECT 
        a.*,
        s.name as service_name,
        p.name as professional_name,
        c.name as client_name,
        c.user_id as client_user_id,
        sl.name as salon_name
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN professionals p ON a.professional_id = p.id
      JOIN clients c ON a.client_id = c.id
      JOIN salons sl ON a.salon_id = sl.id
      WHERE a.id = ?
    `).get(req.params.id);

        // Emit real-time update
        const io = req.app.get('io');
        emitAppointmentUpdate(io, updatedAppointment, 'appointment:started');

        res.json({
            success: true,
            message: 'Atendimento iniciado',
            data: updatedAppointment
        });
    } catch (error) {
        next(error);
    }
});

// Complete appointment (professional)
router.patch('/:id/complete', authenticate, authorize('professional', 'salon'), (req, res, next) => {
    try {
        const { professional_notes } = req.body;

        const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
        if (!appointment) {
            throw new AppError('Agendamento não encontrado', 404);
        }

        if (appointment.status !== 'in_progress' && appointment.status !== 'scheduled') {
            throw new AppError('Agendamento não pode ser concluído', 400);
        }

        db.prepare(`
      UPDATE appointments 
      SET status = 'completed', 
          completed_at = datetime('now'), 
          professional_notes = COALESCE(?, professional_notes),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(professional_notes || null, req.params.id);

        const updatedAppointment = db.prepare(`
      SELECT 
        a.*,
        s.name as service_name,
        p.name as professional_name,
        c.name as client_name,
        c.user_id as client_user_id,
        sl.name as salon_name
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN professionals p ON a.professional_id = p.id
      JOIN clients c ON a.client_id = c.id
      JOIN salons sl ON a.salon_id = sl.id
      WHERE a.id = ?
    `).get(req.params.id);

        // Emit real-time update
        const io = req.app.get('io');
        emitAppointmentUpdate(io, updatedAppointment, 'appointment:completed');

        res.json({
            success: true,
            message: 'Atendimento concluído',
            data: updatedAppointment
        });
    } catch (error) {
        next(error);
    }
});

// Mark as no-show
router.patch('/:id/no-show', authenticate, authorize('professional', 'salon'), (req, res, next) => {
    try {
        const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
        if (!appointment) {
            throw new AppError('Agendamento não encontrado', 404);
        }

        db.prepare(`
      UPDATE appointments 
      SET status = 'no_show', updated_at = datetime('now')
      WHERE id = ?
    `).run(req.params.id);

        res.json({
            success: true,
            message: 'Marcado como não compareceu'
        });
    } catch (error) {
        next(error);
    }
});

// Get available slots for a professional
router.get('/available-slots/:professional_id/:date', optionalAuth, (req, res, next) => {
    try {
        const { professional_id, date } = req.params;
        const { service_id } = req.query;

        // Get professional schedule for this day
        const dayOfWeek = new Date(date).getDay();
        const schedule = db.prepare(`
      SELECT * FROM professional_schedules 
      WHERE professional_id = ? AND day_of_week = ? AND is_working = 1
    `).get(professional_id, dayOfWeek);

        if (!schedule) {
            return res.json({ success: true, data: [] });
        }

        // Get service duration
        let duration = 30;
        if (service_id) {
            const service = db.prepare('SELECT duration_minutes FROM services WHERE id = ?').get(service_id);
            if (service) duration = service.duration_minutes;
        }

        // Get existing appointments for this day
        const appointments = db.prepare(`
      SELECT scheduled_time, duration_minutes FROM appointments 
      WHERE professional_id = ? AND scheduled_date = ? AND status NOT IN ('cancelled', 'no_show')
    `).all(professional_id, date);

        // Generate slots
        const slots = [];
        const startTime = schedule.start_time.split(':').map(Number);
        const endTime = schedule.end_time.split(':').map(Number);
        let currentMinutes = startTime[0] * 60 + startTime[1];
        const endMinutes = endTime[0] * 60 + endTime[1];

        while (currentMinutes + duration <= endMinutes) {
            const hours = Math.floor(currentMinutes / 60);
            const mins = currentMinutes % 60;
            const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

            // Check if slot conflicts with existing appointment
            const isConflict = appointments.some(apt => {
                const aptStart = apt.scheduled_time.split(':').map(Number);
                const aptStartMinutes = aptStart[0] * 60 + aptStart[1];
                const aptEndMinutes = aptStartMinutes + apt.duration_minutes;
                const slotEndMinutes = currentMinutes + duration;

                return !(slotEndMinutes <= aptStartMinutes || currentMinutes >= aptEndMinutes);
            });

            slots.push({
                time: timeStr,
                available: !isConflict
            });

            currentMinutes += 30; // 30 minute intervals
        }

        res.json({
            success: true,
            data: slots
        });
    } catch (error) {
        next(error);
    }
});

export default router;
