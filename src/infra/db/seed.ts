import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { hash } from 'bcryptjs';
import { env } from '../env';
import { patient } from './schemas/patient';
import { payment } from './schemas/payment';
import { professional } from './schemas/professional';
import { session } from './schemas/session';
import { subscription } from './schemas/subscription';
import { user } from './schemas/user';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const db = drizzle(pool);

async function seed() {
  console.log('🌱 Seeding database...');

  await db.delete(payment);
  await db.delete(session);
  await db.delete(subscription);
  await db.delete(patient);
  await db.delete(professional);
  await db.delete(user);

  const {
    SEED_PROFESSIONAL_NAME,
    SEED_PROFESSIONAL_EMAIL,
    SEED_PROFESSIONAL_PASSWORD,
    SEED_PATIENT_NAME,
    SEED_PATIENT_EMAIL,
    SEED_PATIENT_PASSWORD,
    SEED_PAYMENT_CONFIRMED_AT,
  } = env;

  const professionalPasswordHash = await hash(SEED_PROFESSIONAL_PASSWORD, 10);
  const patientPasswordHash = await hash(SEED_PATIENT_PASSWORD, 10);
  const paymentConfirmedAt = new Date(SEED_PAYMENT_CONFIRMED_AT);

  const [professionalUser] = await db
    .insert(user)
    .values({
      name: SEED_PROFESSIONAL_NAME,
      email: SEED_PROFESSIONAL_EMAIL,
      password: professionalPasswordHash,
      role: 'professional',
      paymentConfirmedAt: Number.isNaN(paymentConfirmedAt.valueOf())
        ? new Date()
        : paymentConfirmedAt,
    })
    .returning();

  const [patientUser] = await db
    .insert(user)
    .values({
      name: SEED_PATIENT_NAME,
      email: SEED_PATIENT_EMAIL,
      password: patientPasswordHash,
      role: 'patient',
    })
    .returning();

  const [professionalRecord] = await db
    .insert(professional)
    .values({
      userId: professionalUser.id,
      specialty: 'Terapia Cognitivo-Comportamental',
      registrationNumber: 'CRP-0001/BR',
      phone: '+55 11 98888-0001',
      biography:
        'Psicóloga clínica com foco em TCC para adultos e adolescentes.',
      pricePerSession: 200,
      monthlyPrice: 800,
      sessionDuration: 50,
    })
    .returning();

  const [patientRecord] = await db
    .insert(patient)
    .values({
      userId: patientUser.id,
      professionalId: professionalRecord.id,
      birthDate: '1992-05-12',
      phone: '+5511988881002',
      note: 'Sessões segundas',
    })
    .returning();

  const [subscriptionRecord] = await db
    .insert(subscription)
    .values({
      professionalId: professionalRecord.id,
      monthPrice: professionalRecord.monthlyPrice,
      status: 'active',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    })
    .returning();

  await db.insert(session).values([
    {
      patientId: patientRecord.id,
      professionalId: professionalRecord.id,
      price: professionalRecord.pricePerSession,
      notes: 'Sessão inicial',
      sessionDate: new Date('2024-01-08T14:00:00Z'),
      status: 'completed',
      durationMinutes: professionalRecord.sessionDuration,
    },
    {
      patientId: patientRecord.id,
      professionalId: professionalRecord.id,
      price: professionalRecord.pricePerSession,
      notes: 'Respiracao foco',
      sessionDate: new Date('2024-01-15T14:00:00Z'),
      status: 'scheduled',
      durationMinutes: professionalRecord.sessionDuration,
    },
  ]);

  await db.insert(payment).values([
    {
      professionalId: professionalRecord.id,
      subscriptionId: subscriptionRecord.id,
      type: 'subscription',
      amount: professionalRecord.monthlyPrice,
      paidAt: new Date('2024-01-05'),
      method: 'pix',
      notes: 'Assinatura mensal janeiro/2024',
    },
    {
      professionalId: professionalRecord.id,
      type: 'add-on',
      amount: 150,
      paidAt: new Date('2024-01-20'),
      method: 'credit',
      notes: 'Serviço adicional de workshop',
    },
  ]);

  console.log('✅ Seed finalizado com sucesso!');
  console.log(
    `👤 Profissional teste: ${SEED_PROFESSIONAL_EMAIL} / ${SEED_PROFESSIONAL_PASSWORD}`
  );
  console.log(
    `🧑‍🤝‍🧑 Paciente teste: ${SEED_PATIENT_EMAIL} / ${SEED_PATIENT_PASSWORD}`
  );
}

seed()
  .catch((error) => {
    console.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
