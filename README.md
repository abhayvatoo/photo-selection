# PhotoSelect - Professional Photo Selection SaaS

A modern, multi-tenant photo selection platform built for professional photographers. Streamline your photo delivery process with secure client workspaces, role-based access control, and real-time collaboration.

## ✨ Features

- 🔐 **Multi-tenant Authentication** - NextAuth with Google OAuth and email sign-in
- 👥 **Role-based Access Control** - Admin, Photographer, and Client roles
- 🏢 **Client Workspaces** - Isolated spaces for each client with secure photo delivery
- 📸 **Bulk Photo Upload** - Drag-and-drop multiple photos with automatic optimization
- ⚡ **Real-time Selection** - Live updates as clients select their favorite photos
- 📊 **Admin Dashboard** - Manage workspaces, users, and view analytics
- 📱 **Responsive Design** - Works perfectly on desktop and mobile devices
- 🔒 **Enterprise Security** - End-to-end encryption and secure file storage

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL (local or hosted)
- Git

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd photo-selection
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env
```

### 3. Configure Database
```bash
# For local PostgreSQL
brew install postgresql
brew services start postgresql
createdb photo_selection_db

# Add to .env
DATABASE_URL="postgresql://yourusername@localhost:5432/photo_selection_db"
```

### 4. Generate Authentication Secret
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Add to .env
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 5. Setup Database Schema
```bash
npx prisma generate
npx prisma db push
```

### 6. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see your marketing homepage!

## 🔧 Environment Variables Guide

### Required Variables

#### Database
```bash
DATABASE_URL="postgresql://username@localhost:5432/photo_selection_db"
```

#### Authentication
```bash
NEXTAUTH_SECRET="your-32-character-secret"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"        # Your app's URL
```

### Optional Variables

#### Google OAuth (for "Sign in with Google")
```bash
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

**Setup Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable "Google+ API" 
4. Create OAuth 2.0 credentials
5. Set redirect URI: `http://localhost:3000/api/auth/callback/google`

**For testing:** Leave empty - app works with email-only authentication

#### Email Provider (for magic link sign-in)
```bash
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@yourdomain.com"
```

**For development:** Leave empty - magic links appear in terminal console

#### Google Cloud Storage (for production file storage)
```bash
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GOOGLE_CLOUD_BUCKET_NAME="your-bucket-name"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

**For development:** Leave empty - uses local file storage

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 with App Router
- **Authentication**: NextAuth.js with JWT sessions
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **File Storage**: Google Cloud Storage (production) / Local (development)
- **Real-time**: WebSockets for live updates

### Database Schema
- **Multi-tenant** with workspace isolation
- **User roles**: ADMIN, PHOTOGRAPHER, CLIENT
- **Secure photo-workspace relationships**
- **NextAuth integration** with Account, Session, VerificationToken tables

## 🎯 User Roles & Permissions

### Admin
- Create and manage all workspaces
- Invite users and assign roles
- Access admin dashboard with analytics
- Upload photos to any workspace

### Photographer
- Upload photos to assigned workspace
- Collaborate with admin on photo management
- View client selections and feedback

### Client
- View photos in assigned workspace
- Select favorite photos
- Provide feedback and comments
- Download selected photos (when enabled)

## 🧪 Testing

### Test User Flow
1. **First user becomes Admin** automatically
2. **Sign in with any email** (no real email needed in development)
3. **Magic links** appear in terminal console
4. **Create workspaces** for clients in admin dashboard
5. **Invite users** and assign roles

### Test Authentication
```bash
# Start the app
npm run dev

# Visit http://localhost:3000
# Click "Get Started" → Sign in with any email
# Check terminal for magic link
# First user becomes Admin automatically
```

## 📊 Database Management

### Useful Commands
```bash
# View database in browser
npx prisma studio

# Reset database (careful!)
npx prisma db push --force-reset

# Generate Prisma client after schema changes
npx prisma generate

# Check database connection
npx prisma db pull
```

## 🚀 Deployment

### Environment Variables for Production
```bash
DATABASE_URL="your-production-database-url"
NEXTAUTH_SECRET="secure-production-secret"
NEXTAUTH_URL="https://yourdomain.com"
GOOGLE_CLIENT_ID="production-google-client-id"
GOOGLE_CLIENT_SECRET="production-google-client-secret"
```

### Build Commands
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔒 Security Features

- **JWT session encryption** with NextAuth
- **Route protection** with middleware
- **Role-based access control** at API and UI level
- **Workspace isolation** - users can only access their assigned workspace
- **Secure file upload** with validation and virus scanning
- **CSRF protection** and secure headers

## 🛠️ Development

### Project Structure
```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
├── lib/                # Utilities and configurations
├── types/              # TypeScript type definitions
└── middleware.ts       # Route protection middleware

prisma/
└── schema.prisma       # Database schema

public/                 # Static assets
```

### Key Files
- `src/lib/auth.ts` - NextAuth configuration
- `src/middleware.ts` - Route protection
- `src/app/admin/` - Admin dashboard
- `prisma/schema.prisma` - Database schema

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error:**
```bash
# Ensure PostgreSQL is running
brew services start postgresql

# Check if database exists
psql -l | grep photo_selection
```

**Authentication Not Working:**
- Verify `NEXTAUTH_SECRET` is set and 32+ characters
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies and try again

**TypeScript Errors:**
```bash
# Regenerate Prisma client
npx prisma generate

# Restart TypeScript server in your editor
```

**Build Errors:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support

For issues and questions:
1. Check this README first
2. Verify all environment variables are set correctly
3. Check browser developer tools for errors
4. Review terminal output for detailed error messages

---

Built with ❤️ using Next.js, NextAuth, and PostgreSQL

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
| `npm run db:reset` | Drop all tables and data ⚠️ |
| `npm run db:seed:users` | Seed users only |
| `npm run db:seed:photos` | Seed photos only |
| `npm run clean` | Remove node_modules and package-lock.json |

## 🗑️ Database Reset & Fresh Setup

### Reset Database (Drop All Tables)
```bash
npm run db:reset
```
⚠️ **WARNING**: This deletes ALL data permanently!

### Complete Fresh Setup
For a complete fresh start with clean data:
```bash
# 1. Drop all tables
npm run db:reset

# 2. Recreate schema
npm run db:push

# 3. Seed users first (required before photos)
npm run db:seed:users

# 4. Seed photos
npm run db:seed:photos
```

### Creating New Database from Scratch
If you want to create a completely new database:

1. **Connect to PostgreSQL:**
   ```bash
   psql postgresql://abhayvatoo@localhost:5432/postgres
   ```

2. **Drop existing database (if needed):**
   ```sql
   DROP DATABASE IF EXISTS photo_selection_db;
   ```

3. **Create new database:**
   ```sql
   CREATE DATABASE photo_selection_db;
   \q
   ```

4. **Setup fresh database:**
   ```bash
   npm run db:push
   npm run db:seed:users
   npm run db:seed:photos
   ```

### Data Overview
After seeding, you'll have:
- **5 users** with names, emails, and avatar URLs
- **11+ photos** (depends on files in `bucket/` folder)
- **Clean database** with auto-increment IDs and proper relationships

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
