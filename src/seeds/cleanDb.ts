import 'reflect-metadata';
import { UserRole } from '@/modules/access/domain/model/user-role.entity';
import { EmailVerificationToken } from '@/modules/email/domain/model/email-verification-token.entity';
import { Session } from '@/modules/identity/domain/model/session.entity';
import { User } from '@/modules/identity/domain/model/user.entity';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config({ path: '.env' }); // Load env variables

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/services/**/modules/**/model/*.entity.{ts,js}'],
  synchronize: true,
  logging: true,
});

async function seed() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const sessionRepo = AppDataSource.getRepository(Session);
  const emailVerification = AppDataSource.getRepository(EmailVerificationToken);
  const userRoleRepo = AppDataSource.getRepository(UserRole);
  await userRoleRepo.deleteAll(); // primero las dependientes
  await sessionRepo.deleteAll();
  await emailVerification.deleteAll();
  await userRepo.deleteAll(); // última, la tabla principal referenciada

  await AppDataSource.destroy();
}

seed()
  .then(() => {
    console.log('✅ Seed complete');
  })
  .catch((err) => {
    console.error('❌ Error during seed:', err);
    AppDataSource.destroy();
  });
