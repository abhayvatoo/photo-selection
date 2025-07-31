# Photo Selection App

A collaborative Next.js application for multi-user photo selection with real-time updates.

## 🚀 Quick Start

### Option 1: Development with Local Storage (Fastest)
```bash
# 1. Start Docker database
npm run docker:dev

# 2. Start development server
npm run dev

# 3. Open http://localhost:3000
```

### Option 2: Production with Docker
```bash
# Build and start all services
npm run docker:prod

# Open http://localhost:3000
```

## 📋 Features

- ✅ **Multi-user photo selection** - Multiple people can select photos simultaneously
- ✅ **Real-time updates** - See selections update live via WebSockets
- ✅ **Smart filtering** - Filter photos by specific users' selections
- ✅ **Photo upload** - Upload multiple photos with drag-and-drop
- ✅ **Responsive design** - Works on desktop and mobile
- ✅ **Production ready** - PostgreSQL, GCS, Docker support

## 🏗️ Architecture

### Development Mode (`npm run dev`)
- **Frontend**: Next.js with React hooks and Tailwind CSS
- **Storage**: Hybrid system (GCS or local file storage)
- **Database**: PostgreSQL in Docker container
- **Real-time**: Socket.io for live updates

### Production Mode (`npm run docker:prod`)
- **Frontend**: Optimized Next.js build
- **Storage**: Google Cloud Storage (recommended) or local storage
- **Database**: PostgreSQL in Docker
- **Cache**: Redis for sessions
- **Real-time**: Socket.io server

## 📦 Storage Options

### Local Storage (Default)
- Photos stored in `./uploads` directory
- Served via Next.js API routes
- Perfect for development and testing
- No external dependencies

### Google Cloud Storage (Recommended for Production)
- Scalable cloud storage
- CDN integration
- Image optimization
- Follow setup guide in `docs/GCS_SETUP.md`

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- Docker Desktop
- (Optional) Google Cloud account for GCS

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local` and configure:

```bash
# Database (Docker PostgreSQL)
DATABASE_URL="postgresql://photo_user:photo_password@localhost:5432/photo_selection_db"

# Google Cloud Storage (optional)
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GOOGLE_CLOUD_STORAGE_BUCKET="your-bucket-name"
GOOGLE_APPLICATION_CREDENTIALS="./gcs-service-account.json"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key"
```

### 3. Start Database
```bash
npm run docker:dev
```

This will:
- Start PostgreSQL in Docker
- Run database migrations
- Seed with sample data
- Show helpful commands

### 4. Start Development Server
```bash
npm run dev
```

## 🐳 Docker Commands

| Command | Description |
|---------|-------------|
| `npm run docker:dev` | Start development database |
| `npm run docker:prod` | Start full production environment |
| `npm run docker:stop` | Stop development containers |
| `npm run docker:logs` | View container logs |

## 📊 Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Create and run migrations |
| `npm run db:seed` | Seed database with sample data |

## 🔧 Development Workflow

### Adding New Features
1. Update Prisma schema if needed
2. Run `npm run db:push` to update database
3. Add API routes in `src/app/api/`
4. Update frontend components
5. Test with multiple users

### Database Changes
1. Modify `prisma/schema.prisma`
2. Run `npm run db:migrate` to create migration
3. Update seed data if needed
4. Test with fresh database

## 🌐 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users` | GET, POST | Manage users |
| `/api/photos` | GET | List photos with filters |
| `/api/photos/upload` | POST | Upload new photos |
| `/api/photos/[id]/select` | POST | Toggle photo selection |
| `/api/storage/status` | GET | Check storage configuration |

## 📁 Project Structure

```
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── api/            # API routes
│   │   └── page.tsx        # Main application
│   ├── components/         # React components
│   ├── lib/               # Utilities and services
│   │   ├── storage.ts     # Hybrid storage service
│   │   ├── gcs.ts         # Google Cloud Storage
│   │   ├── local-storage.ts # Local file storage
│   │   └── db.ts          # Database connection
│   └── types/             # TypeScript definitions
├── prisma/                # Database schema and migrations
├── docker/                # Docker configuration
├── scripts/               # Setup scripts
└── docs/                  # Documentation
```

## 🚀 Deployment

### Local Production Test
```bash
npm run build
npm run docker:prod
```

### Cloud Deployment
1. Set up Google Cloud Storage (see `docs/GCS_SETUP.md`)
2. Configure environment variables
3. Use Docker Compose for container orchestration
4. Deploy to your preferred cloud platform

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if database is running
docker ps

# Restart database
npm run docker:stop
npm run docker:dev
```

### Storage Issues
```bash
# Check storage status
curl http://localhost:3000/api/storage/status

# View logs
npm run docker:logs
```

### Build Issues
```bash
# Clean build
rm -rf .next
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.
