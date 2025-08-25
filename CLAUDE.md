# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

```bash
# Start development server with custom server for Socket.IO
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Clean dependencies and lock file
npm run clean
```

### Database Operations

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database (development)
npm run db:push

# Run database migrations (production)
npm run db:migrate

# Reset database completely
npm run db:reset

# Seed test users
npm run db:seed:users

# Seed test photos
npm run db:seed:photos
```

## Architecture Overview

### Multi-Tenant SaaS Structure

This is a photo selection platform with complete workspace isolation and subscription management.

**Key Architectural Patterns:**

- **Multi-tenant design**: Complete data isolation between workspaces using workspace-scoped queries
- **Role-based access control**: SUPER_ADMIN, BUSINESS_OWNER, STAFF, USER with different permissions
- **Custom server**: Uses custom `server.js` instead of default Next.js server to integrate Socket.IO for real-time features
- **Subscription gating**: Features are limited based on Stripe subscription tiers

### Database Schema (CUID-based)

**Important**: All models use CUID format (`@default(cuid())`) for IDs, not UUIDs. When validating IDs in API routes, use CUID regex pattern: `/^c[a-z0-9]{24}$/`

**Core Models:**

- `User` - Authentication, role assignment, workspace membership
- `Workspace` - Multi-tenant containers with isolation
- `Photo` - File metadata with workspace association
- `PhotoSelection` - User photo selections with composite unique constraints
- `Subscription` - Stripe subscription data with plan limits
- `Invitation` - Secure token-based user invitations

### API Route Structure

All API routes implement comprehensive security:

- CSRF protection on state-changing operations
- Role-based authorization middleware
- Input validation using Zod schemas
- Rate limiting per endpoint type
- Workspace isolation enforcement

**Critical API Patterns:**

- Always check user workspace membership before data access
- Use workspace-scoped database queries
- Validate CUID format for workspace/user IDs
- Apply security headers on all responses

### Real-Time Features

Socket.IO server runs on the same port as Next.js (integrated in `server.js`):

- Photo selection broadcasting
- User presence indication
- Upload notifications

**Socket Connection:**

- Client connects to same port as web app (port 3000)
- Authentication via userId/userName parameters
- Room-based messaging for workspace isolation

### Security Implementation

**Enterprise-grade security (10/10 security score):**

- CSRF tokens on all state-changing endpoints
- Endpoint-specific rate limiting
- Security headers with CSP, HSTS, frame protection
- File upload restrictions (type, size, filename sanitization)
- Input validation prevents injection attacks
- Session security with idle timeout

### Subscription & Feature Gating

Three tiers: Starter (free), Professional ($29/mo), Enterprise ($99/mo)

- Plan limits enforced in real-time
- Stripe webhook processing for subscription events
- Development mode for testing without actual charges

## Important Implementation Details

### Custom Server Configuration

The app uses a custom Express server (`server.js`) instead of default Next.js server to integrate Socket.IO. This is critical for real-time features.

### ID Format Validation

**Critical**: Database uses CUID format, not UUID. API validation must use:

```typescript
workspaceId: z.string().regex(
  /^c[a-z0-9]{24}$/,
  'Invalid workspace ID format - must be a valid CUID'
);
```

### Workspace Isolation

Every database query involving user data must include workspace scoping:

```typescript
// Correct - workspace scoped
const photos = await prisma.photo.findMany({
  where: {
    workspaceId: userWorkspaceId,
    // other filters
  },
});

// Incorrect - could leak cross-tenant data
const photos = await prisma.photo.findMany({
  where: {
    uploadedById: userId, // Missing workspace scope
  },
});
```

### Authentication Flow

- NextAuth.js with magic link authentication
- First user automatically becomes SUPER_ADMIN
- Role assignment happens during user creation
- Workspace membership required for most operations

### File Storage System

Supports both local development and production Google Cloud Storage:

- Local: Files stored in `bucket/` directory
- Production: Google Cloud Storage integration
- File validation: type, size, filename sanitization
- Serving via protected API routes with authorization

### Error Handling Patterns

All API routes should:

1. Validate authentication first
2. Validate input with Zod schemas
3. Check workspace permissions
4. Apply rate limiting
5. Use try-catch with sanitized error responses
6. Apply security headers

### Development vs Production

- Development mode: Mock subscriptions, local file storage, relaxed security headers
- Production mode: Full Stripe integration, cloud storage, strict security policies

## Key Files to Understand

- `server.js` - Custom server with Socket.IO integration
- `src/lib/auth.ts` - NextAuth configuration
- `src/middleware.ts` - Route protection and security headers
- `prisma/schema.prisma` - Database schema with CUID IDs
- `src/lib/security-headers.ts` - CSP and security configuration
- `src/lib/subscription.ts` - Feature gating and plan limits

## Testing Approach

- No automated test framework configured
- Manual testing via API calls and browser interaction
- Security testing with curl commands for CSRF, rate limiting, input validation
- Stripe testing with Stripe CLI webhook forwarding

## Common Patterns

### API Route Template

```typescript
// Input validation with CUID format
const schema = z.object({
  workspaceId: z
    .string()
    .regex(/^c[a-z0-9]{24}$/, 'Invalid workspace ID format'),
});

// Authentication check
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json(
    { error: 'Authentication required' },
    { status: 401 }
  );
}

// Workspace authorization
const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  include: { workspace: true },
});

if (user.workspaceId !== workspaceId && user.role !== 'SUPER_ADMIN') {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}
```

### Database Query Patterns

Always include workspace scoping except for SUPER_ADMIN operations:

```typescript
const photos = await prisma.photo.findMany({
  where: {
    workspaceId: userWorkspaceId, // Critical for tenant isolation
    // other filters
  },
});
```

### Feature Gating

Check subscription limits before allowing operations:

```typescript
const limits = await getUserPlanLimits(userId);
const currentCount = await prisma.photo.count({ where: { workspaceId } });

if (
  limits.maxPhotosPerWorkspace !== -1 &&
  currentCount >= limits.maxPhotosPerWorkspace
) {
  return NextResponse.json({ error: 'Photo limit reached' }, { status: 403 });
}
```
