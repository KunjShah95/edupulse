# EduPulse Backend API

🎓 **Backend API for EduPulse School Management System**

Built with Node.js, Fastify, Prisma, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** (LTS recommended)
- **Docker & Docker Compose** (for database)
- **npm** or **pnpm**

### 1. Install Dependencies

```bash
cd edupulse-backend
npm install
```

### 2. Set Up Environment

```bash
# Copy environment template (macOS / Linux)
cp .env.example .env

# PowerShell (Windows)
Copy-Item .env.example .env

# CMD (Windows)
copy .env.example .env

# Edit .env with your configuration
```

### 3. Start Database

```bash
# Start PostgreSQL and Redis using Docker
docker-compose up -d
```

### 4. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with test data
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:8000`

- **API Docs**: <http://localhost:8000/docs>
- **Health Check**: <http://localhost:8000/health>

## 📋 Test Accounts

After seeding, you can login with these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | <admin@edupulse.com> | Password123! |
| Teacher | <john.smith@edupulse.com> | Password123! |
| Student | <alice.wilson@student.edupulse.com> | Password123! |
| Parent | <parent.wilson@edupulse.com> | Password123! |

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema changes to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with test data |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |

## 📁 Project Structure

```text
edupulse-backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── index.ts      # Main config
│   │   └── database.ts   # Prisma client
│   │
│   ├── modules/          # Feature modules
│   │   ├── auth/         # Authentication
│   │   ├── users/        # User management
│   │   ├── students/     # Student management
│   │   ├── teachers/     # Teacher management
│   │   ├── courses/      # Course management
│   │   ├── grades/       # Grade management
│   │   ├── attendance/   # Attendance management
│   │   └── health/       # Health checks
│   │
│   ├── types/            # TypeScript type definitions
│   │   └── fastify.d.ts  # Fastify type extensions
│   │
│   ├── app.ts            # Fastify app setup
│   └── server.ts         # Server entry point
│
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── seed.ts           # Database seeder
│   └── seed.js           # JavaScript seeder
│
├── docker-compose.yml    # Docker services
├── Dockerfile            # Production Docker image
└── package.json
```

## 🔒 API Endpoints

### Authentication

```text
POST   /api/v1/auth/register       # User registration
POST   /api/v1/auth/login          # User login
POST   /api/v1/auth/logout         # User logout
POST   /api/v1/auth/refresh        # Refresh access token
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/verify-email
GET    /api/v1/auth/me             # Get current user
```

### Users

```text
GET    /api/v1/users               # List users (admin)
GET    /api/v1/users/:id           # Get user
PUT    /api/v1/users/:id           # Update user
DELETE /api/v1/users/:id           # Delete user (admin)
GET    /api/v1/users/:id/profile   # Get full profile
```

### Students

```text
GET    /api/v1/students            # List students
POST   /api/v1/students            # Create student (admin)
GET    /api/v1/students/:id        # Get student
PUT    /api/v1/students/:id        # Update student
DELETE /api/v1/students/:id        # Delete student (admin)
GET    /api/v1/students/:id/grades
GET    /api/v1/students/:id/attendance
GET    /api/v1/students/:id/gamification
```

### Teachers

```text
GET    /api/v1/teachers            # List teachers
POST   /api/v1/teachers            # Create teacher (admin)
GET    /api/v1/teachers/:id        # Get teacher
PUT    /api/v1/teachers/:id        # Update teacher
DELETE /api/v1/teachers/:id        # Delete teacher (admin)
GET    /api/v1/teachers/:id/courses
GET    /api/v1/teachers/:id/schedule
GET    /api/v1/teachers/:id/students
```

### Courses

```text
GET    /api/v1/courses             # List courses
POST   /api/v1/courses             # Create course (admin/teacher)
GET    /api/v1/courses/:id         # Get course
PUT    /api/v1/courses/:id         # Update course
DELETE /api/v1/courses/:id         # Delete course (admin)
POST   /api/v1/courses/:id/enroll  # Enroll student in course
```

### Grades

```text
GET    /api/v1/grades              # List grades
POST   /api/v1/grades              # Create grade (admin/teacher)
GET    /api/v1/grades/:id          # Get grade
GET    /api/v1/grades/student/:studentId  # Get student grades
```

### Attendance

```text
GET    /api/v1/attendance          # List attendance records
POST   /api/v1/attendance          # Create attendance record (admin/teacher)
POST   /api/v1/attendance/bulk     # Bulk create attendance records
GET    /api/v1/attendance/student/:studentId  # Get student attendance
GET    /api/v1/attendance/course/:courseId    # Get course attendance
```

### Health

```text
GET    /health              # Basic health check
GET    /health/detailed     # Detailed health check with database status
```

## 🔐 Authentication

The API uses JWT tokens for authentication:

1. **Access Token**: Short-lived (15 minutes), sent in Authorization header
2. **Refresh Token**: Long-lived (7 days), stored in httpOnly cookie

### Making Authenticated Requests

```javascript
// Login to get tokens
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const { data: { accessToken } } = await response.json();

// Use access token for authenticated requests
const users = await fetch('/api/v1/users', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
```

## 🗄️ Database Schema

The database includes the following main entities:

- **Users** (with roles: Student, Teacher, Admin, Parent)
- **Students** (academic profiles with enrollments)
- **Teachers** (with courses and schedules)
- **Courses** (with lessons, quizzes, schedules)
- **Grades & Attendance**
- **Gamification** (XP, levels, badges, achievements)
- **Library** (books, loans, reservations)
- **Messaging** (conversations, messages)
- **Calendar Events**
- **Notifications**

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

## 🐳 Docker Deployment

### Development

```bash
# Start only database services
docker-compose up -d postgres redis
```

### Production

```bash
# Build and run all services
docker-compose --profile production up -d
```

## 📝 Environment Variables

See `.env.example` for all available configuration options:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` - JWT signing secrets
- `CORS_ORIGINS` - Allowed CORS origins
- `RESEND_API_KEY` - For email sending
- `S3_*` - For file storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

Apache 2.0 - See [LICENSE](../LICENSE) for details.
