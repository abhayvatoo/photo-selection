# Photo Selection App

A collaborative Next.js application for multi-user photo selection with real-time updates.

## 🚀 Quick Start

### Option 1: Development with Local Storage (Fastest)
```bash
# 1. Setup database schema (PostgreSQL must be running locally)
npm run db:push

# 2. Seed with sample data
npm run db:seed

# 3. Start development server
npm run dev

# 4. Open http://localhost:3000
```

### Option 2: Production Setup
```bash
# Build production version
npm run build
npm start

# Open http://localhost:3000
```

## 📋 Features

- ✅ **Multi-user photo selection** - Multiple people can select photos simultaneously
- ✅ **Real-time updates** - See selections update live via WebSockets
- ✅ **Smart filtering** - Filter photos by specific users' selections
- ✅ **Photo upload** - Upload multiple photos with drag-and-drop
- ✅ **Responsive design** - Works on desktop and mobile
- ✅ **Production ready** - PostgreSQL, GCS support

## 🏗️ Architecture

### Development Mode (`npm run dev`)
- **Frontend**: Next.js development server
- **Storage**: Local storage (bucket folder)
- **Database**: Local PostgreSQL

### Production Mode (`npm run build && npm start`)
- **Frontend**: Optimized Next.js build
- **Storage**: Google Cloud Storage (recommended) or local storage
- **Database**: Local PostgreSQL
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

- (Optional) Google Cloud account for GCS

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local` and configure:

```bash
# Database (Local PostgreSQL)
DATABASE_URL="postgresql://your_username@localhost:5432/photo_selection_db"

# Google Cloud Storage (optional)
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GOOGLE_CLOUD_STORAGE_BUCKET="your-bucket-name"
GOOGLE_APPLICATION_CREDENTIALS="./gcs-service-account.json"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key"
```

### 3. Setup Database
```bash
# Create database (PostgreSQL must be running locally)
createdb photo_selection_db

# Apply database schema
npm run db:push

# Seed with sample data
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```



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

├── scripts/               # Setup scripts
└── docs/                  # Documentation
```

## 🚀 Deployment

### Local Production Test
```bash
npm run build
npm run build && npm start
```

### Cloud Deployment
1. Set up Google Cloud Storage (see `docs/GCS_SETUP.md`)
2. Configure environment variables
3. Use local PostgreSQL for database
4. Deploy to your preferred cloud platform

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if database is running
# Check PostgreSQL status
ps aux | grep postgres

# Restart database
# Restart PostgreSQL if needed
brew services restart postgresql@15
```

### PostgreSQL Authentication Issues

If you encounter `P1010: User 'photo_user' was denied access` errors with Prisma:

**Problem**: Even when the PostgreSQL user has correct privileges, Prisma may fail to connect due to PostgreSQL's Host-Based Authentication (`pg_hba.conf`) configuration.

**Solution**: The project includes a custom `pg_hba.conf` file that allows trusted localhost connections:

```bash
# The error typically looks like:
# Error: P1010: User `photo_user` was denied access on the database `photo_selection_db.public`

# This is resolved by our custom pg_hba.conf which includes:
# host    all    all    127.0.0.1/32    trust
# host    all    all    localhost       trust
```

**Technical Details**:
- `pg_hba.conf` controls **authentication** (who can connect)
- User privileges control **authorization** (what they can do after connecting)
- Local PostgreSQL uses system authentication by default
- Our configuration allows trusted connections from localhost for development

**If you still have issues**:
```bash
# Recreate database with fresh configuration
# Using local PostgreSQL - no Docker cleanup needed

# Test connection
npm run db:push
```

### Storage Issues
```bash
# Check storage status
curl http://localhost:3000/api/storage/status

# View logs
# Check PostgreSQL logs
tail -f /opt/homebrew/var/log/postgresql@15.log
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
