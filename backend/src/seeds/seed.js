import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from '../db.js';

console.log('🌱 Starting database seed...');

// Clear existing data
db.exec(`
  DELETE FROM refresh_tokens;
  DELETE FROM notifications;
  DELETE FROM reviews;
  DELETE FROM appointments;
  DELETE FROM professional_services;
  DELETE FROM professional_days_off;
  DELETE FROM professional_schedules;
  DELETE FROM services;
  DELETE FROM professionals;
  DELETE FROM clients;
  DELETE FROM salons;
  DELETE FROM users;
`);

const passwordHash = await bcrypt.hash('123456', 10);

// ============ USERS ============
const userIds = {
    salonOwner1: uuidv4(),
    salonOwner2: uuidv4(),
    prof1: uuidv4(),
    prof2: uuidv4(),
    prof3: uuidv4(),
    prof4: uuidv4(),
    prof5: uuidv4(),
    prof6: uuidv4(),
    client1: uuidv4(),
    client2: uuidv4(),
    client3: uuidv4(),
    client4: uuidv4(),
    client5: uuidv4(),
    client6: uuidv4(),
    client7: uuidv4(),
    client8: uuidv4(),
    client9: uuidv4(),
    client10: uuidv4(),
};

const users = [
    // Salon owners
    { id: userIds.salonOwner1, name: 'José da Silva', email: 'ze@barbearia.com', phone: '21999001001', type: 'salon' },
    { id: userIds.salonOwner2, name: 'Tatiana Souza', email: 'tati@unhas.com', phone: '21999002002', type: 'salon' },
    // Professionals
    { id: userIds.prof1, name: 'Carlos Barbeiro', email: 'carlos@barbearia.com', phone: '21999003001', type: 'professional' },
    { id: userIds.prof2, name: 'André Cortes', email: 'andre@barbearia.com', phone: '21999003002', type: 'professional' },
    { id: userIds.prof3, name: 'Ricardo Barba', email: 'ricardo@barbearia.com', phone: '21999003003', type: 'professional' },
    { id: userIds.prof4, name: 'Amanda Nails', email: 'amanda@unhas.com', phone: '21999004001', type: 'professional' },
    { id: userIds.prof5, name: 'Fernanda Unha', email: 'fernanda@unhas.com', phone: '21999004002', type: 'professional' },
    { id: userIds.prof6, name: 'Juliana Nail Art', email: 'juliana@unhas.com', phone: '21999004003', type: 'professional' },
    // Clients
    { id: userIds.client1, name: 'João Pedro', email: 'joao@email.com', phone: '21988001001', type: 'client' },
    { id: userIds.client2, name: 'Maria Clara', email: 'maria@email.com', phone: '21988001002', type: 'client' },
    { id: userIds.client3, name: 'Lucas Silva', email: 'lucas@email.com', phone: '21988001003', type: 'client' },
    { id: userIds.client4, name: 'Ana Paula', email: 'ana@email.com', phone: '21988001004', type: 'client' },
    { id: userIds.client5, name: 'Pedro Henrique', email: 'pedro@email.com', phone: '21988001005', type: 'client' },
    { id: userIds.client6, name: 'Juliana Costa', email: 'juliana.c@email.com', phone: '21988001006', type: 'client' },
    { id: userIds.client7, name: 'Rafael Santos', email: 'rafael@email.com', phone: '21988001007', type: 'client' },
    { id: userIds.client8, name: 'Camila Ferreira', email: 'camila@email.com', phone: '21988001008', type: 'client' },
    { id: userIds.client9, name: 'Bruno Almeida', email: 'bruno@email.com', phone: '21988001009', type: 'client' },
    { id: userIds.client10, name: 'Larissa Oliveira', email: 'larissa@email.com', phone: '21988001010', type: 'client' },
];

for (const user of users) {
    db.prepare(`
    INSERT INTO users (id, name, email, phone, password_hash, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(user.id, user.name, user.email, user.phone, passwordHash, user.type);
}

console.log('✅ Users created');

// ============ SALONS ============
const salonIds = {
    barbearia: uuidv4(),
    manicure: uuidv4(),
};

const salons = [
    {
        id: salonIds.barbearia,
        owner_id: userIds.salonOwner1,
        name: 'Barbearia do Zé',
        address: 'Rua das Flores, 123, Centro, São Gonçalo - RJ',
        phone: '21999001001',
        email: 'contato@barbeariaze.com',
        instagram: '@barbeariaze',
        whatsapp: '5521999001001',
        bio: 'A melhor barbearia da região! Cortes modernos, ambiente aconchegante e atendimento de primeira.',
        niche: 'barbershop',
        average_rating: 4.8,
        total_reviews: 45,
    },
    {
        id: salonIds.manicure,
        owner_id: userIds.salonOwner2,
        name: 'Unhas da Tati',
        address: 'Av. Principal, 456, Loja 10, Niterói - RJ',
        phone: '21999002002',
        email: 'contato@unhasdatati.com',
        instagram: '@unhasdatati',
        whatsapp: '5521999002002',
        bio: 'Especialistas em nail art, alongamentos e cuidados com as mãos. Venha se cuidar!',
        niche: 'manicure',
        average_rating: 4.9,
        total_reviews: 67,
    },
];

for (const salon of salons) {
    db.prepare(`
    INSERT INTO salons (id, owner_id, name, address, phone, email, instagram, whatsapp, bio, niche, average_rating, total_reviews)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(salon.id, salon.owner_id, salon.name, salon.address, salon.phone, salon.email, salon.instagram, salon.whatsapp, salon.bio, salon.niche, salon.average_rating, salon.total_reviews);
}

console.log('✅ Salons created');

// ============ PROFESSIONALS ============
const profIds = {
    carlos: uuidv4(),
    andre: uuidv4(),
    ricardo: uuidv4(),
    amanda: uuidv4(),
    fernanda: uuidv4(),
    juliana: uuidv4(),
};

const professionals = [
    { id: profIds.carlos, salon_id: salonIds.barbearia, user_id: userIds.prof1, name: 'Carlos Barbeiro', specialty: 'Cortes Modernos', bio: 'Especialista em degradê e cortes estilizados', average_rating: 4.9, total_reviews: 22 },
    { id: profIds.andre, salon_id: salonIds.barbearia, user_id: userIds.prof2, name: 'André Cortes', specialty: 'Barba e Bigode', bio: 'Mestre em barbas desenhadas e alinhamento', average_rating: 4.7, total_reviews: 15 },
    { id: profIds.ricardo, salon_id: salonIds.barbearia, user_id: userIds.prof3, name: 'Ricardo Barba', specialty: 'Pigmentação', bio: 'Especializado em pigmentação e coloração', average_rating: 4.8, total_reviews: 8 },
    { id: profIds.amanda, salon_id: salonIds.manicure, user_id: userIds.prof4, name: 'Amanda Nails', specialty: 'Alongamento', bio: 'Expert em alongamentos e unhas de fibra', average_rating: 5.0, total_reviews: 35 },
    { id: profIds.fernanda, salon_id: salonIds.manicure, user_id: userIds.prof5, name: 'Fernanda Unha', specialty: 'Gel e Porcelana', bio: 'Especialista em unhas em gel e manutenção', average_rating: 4.8, total_reviews: 20 },
    { id: profIds.juliana, salon_id: salonIds.manicure, user_id: userIds.prof6, name: 'Juliana Nail Art', specialty: 'Nail Art', bio: 'Artista em decoração de unhas', average_rating: 4.9, total_reviews: 12 },
];

for (const prof of professionals) {
    db.prepare(`
    INSERT INTO professionals (id, salon_id, user_id, name, specialty, bio, average_rating, total_reviews)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(prof.id, prof.salon_id, prof.user_id, prof.name, prof.specialty, prof.bio, prof.average_rating, prof.total_reviews);
}

// Create schedules for all professionals
for (const profId of Object.values(profIds)) {
    for (let day = 0; day <= 6; day++) {
        const isWorking = day !== 0; // Sunday off
        db.prepare(`
      INSERT INTO professional_schedules (id, professional_id, day_of_week, start_time, end_time, is_working)
      VALUES (?, ?, ?, '09:00', '19:00', ?)
    `).run(uuidv4(), profId, day, isWorking ? 1 : 0);
    }
}

console.log('✅ Professionals created');

// ============ SERVICES ============
const serviceIds = {
    // Barbearia
    corteSimples: uuidv4(),
    corteBarba: uuidv4(),
    barbaCompleta: uuidv4(),
    corteInfantil: uuidv4(),
    pigmentacao: uuidv4(),
    limpezaOrelha: uuidv4(),
    sobrancelha: uuidv4(),
    // Manicure
    manicureSimples: uuidv4(),
    manicureGel: uuidv4(),
    pedicureSimples: uuidv4(),
    pedicureGel: uuidv4(),
    manicurePedicure: uuidv4(),
    nailArt: uuidv4(),
    alongamento: uuidv4(),
    limpezaCuticula: uuidv4(),
};

const services = [
    // Barbearia services
    { id: serviceIds.corteSimples, salon_id: salonIds.barbearia, name: 'Corte Simples', duration: 30, price: 35, category: 'Cabelo', icon: 'content-cut' },
    { id: serviceIds.corteBarba, salon_id: salonIds.barbearia, name: 'Corte + Barba', duration: 40, price: 45, category: 'Combo', icon: 'face-man' },
    { id: serviceIds.barbaCompleta, salon_id: salonIds.barbearia, name: 'Barba Completa', duration: 30, price: 30, category: 'Barba', icon: 'face-man-shimmer' },
    { id: serviceIds.corteInfantil, salon_id: salonIds.barbearia, name: 'Corte Infantil', duration: 25, price: 25, category: 'Cabelo', icon: 'human-child' },
    { id: serviceIds.pigmentacao, salon_id: salonIds.barbearia, name: 'Pigmentação', duration: 60, price: 55, category: 'Coloração', icon: 'palette' },
    { id: serviceIds.limpezaOrelha, salon_id: salonIds.barbearia, name: 'Limpeza de Orelha', duration: 15, price: 15, category: 'Extras', icon: 'ear-hearing' },
    { id: serviceIds.sobrancelha, salon_id: salonIds.barbearia, name: 'Sobrancelha', duration: 20, price: 20, category: 'Extras', icon: 'eye' },
    // Manicure services
    { id: serviceIds.manicureSimples, salon_id: salonIds.manicure, name: 'Manicure Simples', duration: 40, price: 35, category: 'Mãos', icon: 'hand-wave' },
    { id: serviceIds.manicureGel, salon_id: salonIds.manicure, name: 'Manicure Gel', duration: 50, price: 55, category: 'Mãos', icon: 'hand-wave' },
    { id: serviceIds.pedicureSimples, salon_id: salonIds.manicure, name: 'Pedicure Simples', duration: 45, price: 40, category: 'Pés', icon: 'shoe-print' },
    { id: serviceIds.pedicureGel, salon_id: salonIds.manicure, name: 'Pedicure Gel', duration: 55, price: 60, category: 'Pés', icon: 'shoe-print' },
    { id: serviceIds.manicurePedicure, salon_id: salonIds.manicure, name: 'Manicure + Pedicure', duration: 90, price: 75, category: 'Combo', icon: 'star' },
    { id: serviceIds.nailArt, salon_id: salonIds.manicure, name: 'Nail Art', duration: 60, price: 45, category: 'Decoração', icon: 'brush' },
    { id: serviceIds.alongamento, salon_id: salonIds.manicure, name: 'Alongamento de Unhas', duration: 60, price: 50, category: 'Alongamento', icon: 'arrow-expand' },
    { id: serviceIds.limpezaCuticula, salon_id: salonIds.manicure, name: 'Limpeza de Cutícula', duration: 30, price: 25, category: 'Mãos', icon: 'spray' },
];

for (const service of services) {
    db.prepare(`
    INSERT INTO services (id, salon_id, name, duration_minutes, price, category, icon, niche_preset)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).run(service.id, service.salon_id, service.name, service.duration, service.price, service.category, service.icon);
}

// Link professionals to services
const profServiceLinks = [
    // Barbearia - Carlos does all
    [profIds.carlos, serviceIds.corteSimples],
    [profIds.carlos, serviceIds.corteBarba],
    [profIds.carlos, serviceIds.barbaCompleta],
    [profIds.carlos, serviceIds.corteInfantil],
    [profIds.carlos, serviceIds.sobrancelha],
    // André - Barba specialist
    [profIds.andre, serviceIds.corteSimples],
    [profIds.andre, serviceIds.corteBarba],
    [profIds.andre, serviceIds.barbaCompleta],
    // Ricardo - Pigmentation
    [profIds.ricardo, serviceIds.pigmentacao],
    [profIds.ricardo, serviceIds.corteSimples],
    // Amanda - Alongamento
    [profIds.amanda, serviceIds.manicureSimples],
    [profIds.amanda, serviceIds.manicureGel],
    [profIds.amanda, serviceIds.alongamento],
    // Fernanda - Gel
    [profIds.fernanda, serviceIds.manicureSimples],
    [profIds.fernanda, serviceIds.manicureGel],
    [profIds.fernanda, serviceIds.pedicureSimples],
    [profIds.fernanda, serviceIds.pedicureGel],
    [profIds.fernanda, serviceIds.manicurePedicure],
    // Juliana - Nail Art
    [profIds.juliana, serviceIds.nailArt],
    [profIds.juliana, serviceIds.manicureSimples],
    [profIds.juliana, serviceIds.limpezaCuticula],
];

for (const [profId, serviceId] of profServiceLinks) {
    db.prepare('INSERT INTO professional_services (professional_id, service_id) VALUES (?, ?)').run(profId, serviceId);
}

console.log('✅ Services created');

// ============ CLIENTS ============
const clientIds = {};
for (let i = 1; i <= 10; i++) {
    const userId = userIds[`client${i}`];
    const user = users.find(u => u.id === userId);
    const clientId = uuidv4();
    clientIds[`client${i}`] = clientId;

    db.prepare(`
    INSERT INTO clients (id, user_id, name, phone)
    VALUES (?, ?, ?, ?)
  `).run(clientId, userId, user.name, user.phone);
}

console.log('✅ Clients created');

// ============ APPOINTMENTS ============
const today = new Date();
const formatDate = (date) => date.toISOString().split('T')[0];

const appointments = [
    // Today's appointments
    { client: 'client1', prof: profIds.carlos, service: serviceIds.corteBarba, salon: salonIds.barbearia, date: formatDate(today), time: '09:00', status: 'completed' },
    { client: 'client2', prof: profIds.carlos, service: serviceIds.corteSimples, salon: salonIds.barbearia, date: formatDate(today), time: '10:00', status: 'in_progress' },
    { client: 'client3', prof: profIds.andre, service: serviceIds.barbaCompleta, salon: salonIds.barbearia, date: formatDate(today), time: '10:30', status: 'scheduled' },
    { client: 'client4', prof: profIds.carlos, service: serviceIds.corteBarba, salon: salonIds.barbearia, date: formatDate(today), time: '14:00', status: 'scheduled' },
    { client: 'client5', prof: profIds.amanda, service: serviceIds.manicureGel, salon: salonIds.manicure, date: formatDate(today), time: '09:30', status: 'completed' },
    { client: 'client6', prof: profIds.fernanda, service: serviceIds.pedicureSimples, salon: salonIds.manicure, date: formatDate(today), time: '11:00', status: 'scheduled' },

    // Tomorrow
    { client: 'client7', prof: profIds.carlos, service: serviceIds.corteSimples, salon: salonIds.barbearia, date: formatDate(new Date(today.getTime() + 86400000)), time: '09:00', status: 'scheduled' },
    { client: 'client8', prof: profIds.juliana, service: serviceIds.nailArt, salon: salonIds.manicure, date: formatDate(new Date(today.getTime() + 86400000)), time: '10:00', status: 'scheduled' },

    // Next week
    { client: 'client9', prof: profIds.andre, service: serviceIds.corteBarba, salon: salonIds.barbearia, date: formatDate(new Date(today.getTime() + 86400000 * 3)), time: '15:00', status: 'scheduled' },
    { client: 'client10', prof: profIds.amanda, service: serviceIds.alongamento, salon: salonIds.manicure, date: formatDate(new Date(today.getTime() + 86400000 * 4)), time: '14:00', status: 'scheduled' },

    // Past appointments
    { client: 'client1', prof: profIds.carlos, service: serviceIds.corteSimples, salon: salonIds.barbearia, date: formatDate(new Date(today.getTime() - 86400000 * 7)), time: '10:00', status: 'completed' },
    { client: 'client2', prof: profIds.andre, service: serviceIds.barbaCompleta, salon: salonIds.barbearia, date: formatDate(new Date(today.getTime() - 86400000 * 5)), time: '14:00', status: 'completed' },
    { client: 'client3', prof: profIds.amanda, service: serviceIds.manicureSimples, salon: salonIds.manicure, date: formatDate(new Date(today.getTime() - 86400000 * 3)), time: '09:00', status: 'completed' },
    { client: 'client4', prof: profIds.fernanda, service: serviceIds.manicurePedicure, salon: salonIds.manicure, date: formatDate(new Date(today.getTime() - 86400000 * 2)), time: '11:00', status: 'completed' },
    { client: 'client5', prof: profIds.carlos, service: serviceIds.pigmentacao, salon: salonIds.barbearia, date: formatDate(new Date(today.getTime() - 86400000 * 10)), time: '15:00', status: 'completed' },

    // Cancelled
    { client: 'client6', prof: profIds.carlos, service: serviceIds.corteBarba, salon: salonIds.barbearia, date: formatDate(new Date(today.getTime() - 86400000)), time: '16:00', status: 'cancelled', reason: 'Mudança de planos' },
    { client: 'client7', prof: profIds.juliana, service: serviceIds.nailArt, salon: salonIds.manicure, date: formatDate(new Date(today.getTime() - 86400000 * 2)), time: '10:00', status: 'no_show' },

    // More completed for stats
    { client: 'client8', prof: profIds.carlos, service: serviceIds.corteBarba, salon: salonIds.barbearia, date: formatDate(new Date(today.getTime() - 86400000 * 14)), time: '09:00', status: 'completed' },
    { client: 'client9', prof: profIds.amanda, service: serviceIds.manicureGel, salon: salonIds.manicure, date: formatDate(new Date(today.getTime() - 86400000 * 12)), time: '10:00', status: 'completed' },
    { client: 'client10', prof: profIds.andre, service: serviceIds.corteSimples, salon: salonIds.barbearia, date: formatDate(new Date(today.getTime() - 86400000 * 8)), time: '11:00', status: 'completed' },
];

const appointmentIds = [];
for (const apt of appointments) {
    const service = services.find(s => s.id === apt.service);
    const aptId = uuidv4();
    appointmentIds.push({ id: aptId, ...apt });

    db.prepare(`
    INSERT INTO appointments (id, salon_id, professional_id, client_id, service_id, scheduled_date, scheduled_time, duration_minutes, price, status, cancellation_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(aptId, apt.salon, apt.prof, clientIds[apt.client], apt.service, apt.date, apt.time, service.duration, service.price, apt.status, apt.reason || null);
}

console.log('✅ Appointments created');

// ============ REVIEWS ============
const completedApts = appointmentIds.filter(a => a.status === 'completed');
const reviewComments = [
    'Excelente atendimento! Muito profissional.',
    'Adorei o resultado, voltarei com certeza!',
    'Ótimo ambiente e equipe muito atenciosa.',
    'Serviço impecável, recomendo!',
    'Superou minhas expectativas.',
    'Muito bom, preço justo e qualidade top.',
    'Atendimento rápido e eficiente.',
    'Profissional muito habilidoso.',
    'Ambiente super agradável.',
    'Melhor barbearia/salão da região!',
    'Sempre saio satisfeito(a) daqui.',
    'Nota 10 em tudo!',
    'Atendimento personalizado, adorei!',
    'Qualidade excepcional.',
    'Voltarei sempre!',
];

for (let i = 0; i < Math.min(15, completedApts.length); i++) {
    const apt = completedApts[i];
    const rating = Math.random() > 0.2 ? 5 : (Math.random() > 0.5 ? 4 : 3);

    db.prepare(`
    INSERT INTO reviews (id, appointment_id, client_id, professional_id, salon_id, rating, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), apt.id, clientIds[apt.client], apt.prof, apt.salon, rating, reviewComments[i % reviewComments.length]);
}

console.log('✅ Reviews created');

console.log(`
🎉 Database seeded successfully!

📊 Summary:
- Users: ${users.length}
- Salons: ${salons.length}
- Professionals: ${professionals.length}
- Services: ${services.length}
- Clients: 10
- Appointments: ${appointments.length}
- Reviews: ${Math.min(15, completedApts.length)}

🔐 Login credentials (password: 123456):
- Salon Owner 1: ze@barbearia.com
- Salon Owner 2: tati@unhas.com
- Professional: carlos@barbearia.com
- Client: joao@email.com
`);

process.exit(0);
