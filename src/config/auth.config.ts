import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  accessTokenSecret: process.env['JWT_SECRET'] ?? process.env['JWT_ACCESS_SECRET'],
  accessTokenExpires: process.env['JWT_EXPIRES_IN'] ?? '15m',
  refreshTokenSecret: process.env['JWT_REFRESH_SECRET'],
  refreshTokenExpires: process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d',
  bcryptSaltRounds: parseInt(process.env['BCRYPT_SALT_ROUNDS'] ?? '12'),
  emailFrom: process.env['EMAIL_FROM'] ?? 'noreply@example.com',
  frontendUrl: process.env['FRONTEND_URL'] ?? 'http://localhost:3030',
}));
