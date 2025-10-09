# Contact Module

This module handles contact form submissions, saving them to the database and sending email notifications.

## Features

- **Public API endpoint** - No authentication required
- **Database persistence** - All contacts are saved to PostgreSQL
- **Email notifications** - Admin receives email for each contact submission
- **Input validation** - All inputs are validated using class-validator
- **Comprehensive logging** - All operations are logged for monitoring

## API Endpoints

### Submit Contact Form

**Endpoint:** `POST /api/v1/contact`

**Access:** Public (no authentication required)

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "message": "I would like to know more about your services."
}
```

**Response:** `201 Created`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "message": "I would like to know more about your services.",
  "createdAt": "2024-10-09T09:59:51.000Z"
}
```

**Validation Rules:**

- `name`: Required, string, max 255 characters
- `email`: Required, valid email format, max 255 characters
- `message`: Required, string

**Error Responses:**

- `400 Bad Request` - Invalid input data
- `500 Internal Server Error` - Server error during processing

## Email Notification

After each contact form submission, an email is automatically sent to `eadomestic@gmail.com` with:

- Contact person's name
- Contact person's email
- Message content

The email sending is non-blocking and won't affect the API response.

## Database Schema

```prisma
model Contact {
  id        String   @id @default(uuid())
  name      String   @db.VarChar(255)
  email     String   @db.VarChar(255)
  message   String   @db.Text
  createdAt DateTime @default(now())

  @@index([createdAt])
  @@index([email])
  @@map("contacts")
}
```

## Usage Example

### cURL

```bash
curl -X POST http://localhost:3030/api/v1/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "message": "I would like to know more about your services."
  }'
```

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:3030/api/v1/contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john.doe@example.com',
    message: 'I would like to know more about your services.',
  }),
});

const data = await response.json();
console.log(data);
```

## Testing

Run the tests with:

```bash
npm test -- contact.service.spec
```

## Module Structure

```
src/contact/
├── controllers/
│   └── contact.controller.ts    # HTTP request handling
├── dto/
│   ├── create-contact.dto.ts    # Request validation
│   └── contact-response.dto.ts  # Response type
├── services/
│   ├── contact.service.ts       # Business logic
│   └── contact.service.spec.ts  # Unit tests
├── contact.module.ts            # Module definition
└── README.md                    # This file
```
