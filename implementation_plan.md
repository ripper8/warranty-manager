# Implementation Plan - Warranty Manager

## Goal Description
Build a modern, responsive web application for managing warranty cards and receipts. The app will be deployed locally, use local storage and database, and support multiple user roles (Global Admin, Account Admin, User). AI features are deferred to a future phase.

## User Review Required
> [!IMPORTANT]
> **Local Storage**: Images will be stored on the local filesystem. Ensure the host machine has sufficient disk space and backup strategies.
> **AI Features**: AI integration is explicitly deferred to Phase 2 and will not be implemented in this iteration.

## Proposed Changes

### Phase 1: Setup & Infrastructure
#### [NEW] [docker-compose.yml](file:///Users/atanas/Documents/projects/warranty-manager/docker-compose.yml)
- Setup PostgreSQL database.
- Setup pgAdmin (optional, for DB management).

#### [NEW] [Next.js App Structure](file:///Users/atanas/Documents/projects/warranty-manager/app)
- Initialize Next.js 14 project.
- Install Tailwind CSS, Shadcn/ui, Prisma, NextAuth.

### Phase 2: Authentication & Roles
#### [NEW] [Prisma Schema](file:///Users/atanas/Documents/projects/warranty-manager/prisma/schema.prisma)
- Define User, Account, AccountUser models.
- Define WarrantyItem and Document models.

#### [NEW] [Auth Logic](file:///Users/atanas/Documents/projects/warranty-manager/auth.ts)
- Implement Credentials provider (Email/Password).
- Implement Google OAuth provider.
- Implement Role-based access control (RBAC).
- **Password Management**: Implement change password flows for User and Global Admin.

### Phase 3: Core Features (Warranty Management)
#### [NEW] [Dashboard](file:///Users/atanas/Documents/projects/warranty-manager/app/(dashboard)/dashboard/page.tsx)
- Display summary metrics.

#### [NEW] [Add Warranty Flow](file:///Users/atanas/Documents/projects/warranty-manager/app/(dashboard)/add/page.tsx)
- Multi-step form for adding warranties.
- File upload handling (saving to local disk).

#### [NEW] [Warranty List & Details](file:///Users/atanas/Documents/projects/warranty-manager/app/(dashboard)/warranties/page.tsx)
- Filtering and Search.
- Detailed view with images.

### Phase 4: Admin & Polish
#### [NEW] [Global Admin Panel](file:///Users/atanas/Documents/projects/warranty-manager/app/(dashboard)/admin/page.tsx)
- User management (reset passwords).
- Account management.

## Verification Plan

### Automated Tests
- Run `npm run build` to verify type safety and build process.
- (Optional) Jest/Vitest for unit testing utility functions.

### Manual Verification
1.  **Registration**: Register a new user, create an account.
2.  **Auth**: Login/Logout, Change Password (as User), Reset Password (as Global Admin).
3.  **Flow**: Add a warranty with photos. Verify photos are saved locally and displayed correctly.
4.  **Roles**: Verify Account Admin can invite users. Verify Global Admin can see all stats.
