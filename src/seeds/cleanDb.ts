import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '@/services/identity-ms/modules/user/model/user.entity';
import { Session } from '@/services/identity-ms/modules/session/model/session.entity';
import { UserRole } from '@/services/access-ms/modules/user-roles/model/user-role.entity';
import { EmailVerificationToken } from '@/services/email-ms/modules/verification/model/email-verification-token.entity';

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
