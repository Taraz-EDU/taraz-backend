import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwt: {
    secret: process.env['JWT_SECRET'],
    expiresIn: process.env['JWT_EXPIRES_IN'] ?? '1h',
    expiresInSeconds: parseInt(process.env['JWT_EXPIRES_IN_SECONDS'] ?? '3600'),
  },
  jwtRefresh: {
    secret: process.env['JWT_REFRESH_SECRET'],
    expiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d',
  },
  bcrypt: {
    saltRounds: parseInt(process.env['BCRYPT_SALT_ROUNDS'] ?? '12'),
  },
  email: {
    from: process.env['EMAIL_FROM'] ?? 'noreply@example.com',
    frontendUrl: process.env['FRONTEND_URL'] ?? 'http://localhost:3030',
  },
}));
