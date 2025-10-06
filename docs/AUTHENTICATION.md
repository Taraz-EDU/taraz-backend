# Authentication & Authorization System

This document describes the JWT-based Role-Based Access Control (RBAC) authentication system implemented in the Taraz Backend.

## Overview

The authentication system provides:

- JWT-based authentication with access and refresh tokens
- Role-Based Access Control (RBAC) with multiple roles per user
- Email verification and password reset functionality
- Secure password hashing with bcrypt
- Extensible role hierarchy system

## Database Schema

### Users Table

- `id` (UUID, Primary Key)
- `email` (Unique)
- `firstName`, `lastName`
- `password` (Hashed with bcrypt)
- `status` (active, inactive, pending_verification, suspended)
- `isEmailVerified`
- `emailVerificationToken`
- `passwordResetToken`, `passwordResetExpires`
- `lastLoginAt`
- `createdAt`, `updatedAt`

### Roles Table

- `id` (UUID, Primary Key)
- `name` (super_admin, admin, teacher, mentor, student, moderator)
- `displayName`
- `description`
- `hierarchyLevel` (for role inheritance)
- `isActive`
- `createdAt`, `updatedAt`

### UserRoles Table (Many-to-Many)

- `id` (UUID, Primary Key)
- `userId` (Foreign Key to Users)
- `roleId` (Foreign Key to Roles)
- `isActive`
- `assignedAt`
- `expiresAt` (Optional role expiration)
- `createdAt`

## Available Roles

| Role          | Level | Description                                       |
| ------------- | ----- | ------------------------------------------------- |
| `super_admin` | 100   | Full system access with all privileges            |
| `admin`       | 90    | Administrative access to manage users and content |
| `moderator`   | 80    | Moderate content and manage community             |
| `teacher`     | 70    | Create and manage courses, teach students         |
| `mentor`      | 60    | Guide and support students                        |
| `student`     | 50    | Access to courses and learning materials          |

## API Endpoints

### Authentication Endpoints

#### POST /auth/register

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePassword123!",
  "roles": ["student"]
}
```

**Response:**

```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "status": "pending_verification",
    "isEmailVerified": false,
    "roles": ["student"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Registration successful. Please check your email to verify your account."
}
```

#### POST /auth/login

Authenticate user and get tokens.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "status": "active",
    "isEmailVerified": true,
    "roles": ["student"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /auth/refresh

Refresh access token using refresh token.

**Headers:**

```
Authorization: Bearer <refresh_token>
```

#### POST /auth/forgot-password

Request password reset email.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

#### POST /auth/reset-password

Reset password using token from email.

**Request Body:**

```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePassword123!"
}
```

#### POST /auth/verify-email

Verify email address using token from email.

**Request Body:**

```json
{
  "token": "verification_token_from_email"
}
```

#### GET /auth/me

Get current user profile.

**Headers:**

```
Authorization: Bearer <access_token>
```

#### POST /auth/logout

Logout user (client should discard tokens).

**Headers:**

```
Authorization: Bearer <access_token>
```

### Role-Based Endpoints

#### Admin Endpoints (Require Admin/Super Admin roles)

#### GET /admin/users

Get all users (Admin/Super Admin only).

**Headers:**

```
Authorization: Bearer <access_token>
```

#### POST /admin/users/:userId/roles

Assign roles to user (Super Admin only).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "roles": ["teacher", "mentor"]
}
```

#### GET /admin/profile

Get admin profile (Admin/Teacher/Mentor/Moderator).

**Headers:**

```
Authorization: Bearer <access_token>
```

### Student Endpoints (Require Student role)

#### GET /student/dashboard

Access student dashboard.

**Headers:**

```
Authorization: Bearer <access_token>
```

#### GET /student/courses

Get student courses.

**Headers:**

```
Authorization: Bearer <access_token>
```

## Usage Examples

### Protecting Routes with Roles

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { RoleName } from '../entities/role.entity';

@Controller('protected')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProtectedController {
  @Get('admin-only')
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  adminOnly() {
    return { message: 'Only admins can see this' };
  }

  @Get('teacher-or-admin')
  @Roles(RoleName.TEACHER, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  teacherOrAdmin() {
    return { message: 'Teachers and admins can see this' };
  }
}
```

### Public Routes

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';

@Controller('public')
export class PublicController {
  @Get('health')
  @Public()
  health() {
    return { status: 'ok' };
  }
}
```

### Getting Current User

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  @Get()
  getProfile(@CurrentUser() user: CurrentUserData) {
    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
    };
  }
}
```

## Security Features

1. **Password Security**
   - Passwords are hashed using bcrypt with 12 salt rounds
   - Strong password requirements (uppercase, lowercase, number, special character)

2. **Token Security**
   - JWT tokens with configurable expiration
   - Separate access and refresh tokens
   - Refresh tokens have longer expiration (7 days vs 1 hour)

3. **Email Verification**
   - Users must verify their email before account activation
   - Secure token-based verification

4. **Password Reset**
   - Token-based password reset with 15-minute expiration
   - Secure reset flow via email

5. **Role-Based Access Control**
   - Multiple roles per user
   - Role hierarchy support
   - Fine-grained access control

## Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_EXPIRES_IN=1h
JWT_EXPIRES_IN_SECONDS=3600
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Security Configuration
BCRYPT_SALT_ROUNDS=12

# Email Configuration
EMAIL_FROM=noreply@example.com
FRONTEND_URL=http://localhost:3000
```

## Database Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp env.example .env
# Edit .env with your configuration
```

3. Run migrations:

```bash
npm run migration:run
```

4. Start the application:

```bash
npm run start:dev
```

## Testing the API

You can test the authentication endpoints using tools like Postman, curl, or any HTTP client:

1. **Register a new user:**

```bash
curl -X POST http://localhost:3030/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "TestPassword123!",
    "roles": ["student"]
  }'
```

2. **Login:**

```bash
curl -X POST http://localhost:3030/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

3. **Access protected route:**

```bash
curl -X GET http://localhost:3030/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Extending the System

### Adding New Roles

1. Add the role to the `RoleName` enum in `src/entities/role.entity.ts`
2. Create a migration to insert the new role
3. Update role hierarchy levels if needed

### Adding New Permissions

The system is designed to be extended with fine-grained permissions:

1. Create a `Permission` entity
2. Create a `RolePermission` join table
3. Implement permission-based guards
4. Add permission decorators

### Multi-Tenant Support

The system includes hooks for multi-tenant support:

- Add `tenantId` to User entity
- Implement tenant-based data isolation
- Add tenant-aware guards and decorators

## Production Considerations

1. **Security**
   - Use strong, unique JWT secrets
   - Enable HTTPS in production
   - Implement rate limiting
   - Use secure email service (SendGrid, AWS SES, etc.)

2. **Performance**
   - Implement Redis for token blacklisting
   - Use connection pooling for database
   - Cache role information

3. **Monitoring**
   - Log authentication events
   - Monitor failed login attempts
   - Set up alerts for security events

4. **Backup**
   - Regular database backups
   - Secure backup of JWT secrets
   - Document recovery procedures
