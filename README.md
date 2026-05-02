# NestJS Production Boilerplate

Production-ready NestJS API boilerplate using PostgreSQL, Prisma, JWT access/refresh authentication, repository pattern, and Cloudinary uploads.

## Stack

- NestJS
- PostgreSQL + Prisma ORM
- JWT (`access` + rotating `refresh`)
- bcrypt password hashing
- Cloudinary + Multer for image upload
- Helmet, throttling, validation pipes, exception filter, CORS config

## Modules

- `AuthModule`
- `UserModule`
- `UploadModule`
- `SharedModule` (guards/decorators)
- `PrismaModule`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Create and apply migrations:

```bash
npm run prisma:migrate:dev -- --name init
```

5. Run development server:

```bash
npm run start:dev
```

## Production

```bash
npm run build
npm run start:prod
```

## Auth Flow

1. `POST /api/v1/auth/register`
2. `POST /api/v1/auth/login`
3. Use access token for protected endpoints (`Authorization: Bearer <token>`)
4. Rotate refresh token with `POST /api/v1/auth/refresh`
5. Invalidate refresh token with `POST /api/v1/auth/logout`

## API Highlights

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `PATCH /api/v1/users/me/password`
- `POST /api/v1/uploads/avatar`
- `POST /api/v1/uploads/single`
- `POST /api/v1/uploads/multiple`

## Validation Checklist

- Register/login and protected route access
- Refresh token rotation and old token invalidation
- Logout revocation
- Role-protected user admin routes
- Avatar and generic upload image validation
