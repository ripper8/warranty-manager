# Реална Архитектура - Warranty Manager

> Актуализирано: 2025-11-22  
> Този документ описва реалната имплементация на системата след разработката.

## 📋 Съдържание
1. [Технологичен Стек](#технологичен-стек)
2. [Архитектурни Диаграми](#архитектурни-диаграми)
3. [Структура на Проекта](#структура-на-проекта)
4. [База Данни](#база-данни)
5. [Автентикация и Авторизация](#автентикация-и-авторизация)
6. [Файлово Съхранение](#файлово-съхранение)
7. [API Endpoints](#api-endpoints)
8. [Deployment](#deployment)

---

## 🛠 Технологичен Стек

### Frontend & Backend Framework
- **Next.js 16.0.3** (App Router)
  - Server Components за оптимална производителност
  - Server Actions за безопасни мутации
  - TypeScript 5 за type safety
- **React 19.2.0** с React DOM 19.2.0

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn/ui** - Компоненти базирани на Radix UI:
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-select`
  - `@radix-ui/react-avatar`
  - `@radix-ui/react-alert-dialog`
  - `@radix-ui/react-popover`
  - `@radix-ui/react-label`
  - `@radix-ui/react-slot`
- **Lucide React** - Икони
- **next-themes** - Dark/Light mode поддръжка
- **class-variance-authority** + **clsx** + **tailwind-merge** - Динамично управление на класове

### Database & ORM
- **PostgreSQL 15** (Alpine Docker image)
- **Prisma 5.22.0** - ORM с type-safe database client
- **@prisma/client** - Auto-generated client

### Authentication
- **NextAuth.js v5** (Auth.js beta.30)
- **@auth/prisma-adapter** - Prisma adapter за Auth.js
- **bcryptjs** - Password hashing

### File Storage
- **MinIO** - S3-compatible object storage
- **@aws-sdk/client-s3** - AWS SDK за S3 операции
- **UUID** - Генериране на уникални файлови имена

### Form Management
- **React Hook Form 7.66.1** - Form state management
- **@hookform/resolvers** - Validation resolvers
- **Zod 4.1.12** - Schema validation

### Utilities
- **date-fns 4.1.0** - Date manipulation
- **tw-animate-css** - Tailwind animations

### DevOps & Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy (production)
- **Jenkins** - CI/CD pipeline

---

## 🏗 Архитектурни Диаграми

### Системна Архитектура

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser / Mobile]
    end
    
    subgraph "Application Layer"
        NextJS[Next.js App Router]
        ServerComponents[Server Components]
        ServerActions[Server Actions]
        API[API Routes]
        Middleware[Auth Middleware]
    end
    
    subgraph "Authentication"
        AuthJS[Auth.js / NextAuth v5]
        CredProvider[Credentials Provider]
    end
    
    subgraph "Data Layer"
        Prisma[Prisma ORM]
        PostgreSQL[(PostgreSQL 15)]
    end
    
    subgraph "Storage Layer"
        S3Client[AWS S3 Client]
        MinIO[MinIO Object Storage]
    end
    
    Browser --> NextJS
    NextJS --> ServerComponents
    NextJS --> ServerActions
    NextJS --> API
    NextJS --> Middleware
    
    Middleware --> AuthJS
    ServerActions --> AuthJS
    AuthJS --> CredProvider
    CredProvider --> Prisma
    
    ServerComponents --> Prisma
    ServerActions --> Prisma
    API --> Prisma
    
    Prisma --> PostgreSQL
    
    ServerActions --> S3Client
    API --> S3Client
    S3Client --> MinIO
    
    style NextJS fill:#0070f3,color:#fff
    style PostgreSQL fill:#336791,color:#fff
    style MinIO fill:#C72E49,color:#fff
    style AuthJS fill:#7c3aed,color:#fff
```

### Data Flow - Добавяне на Гаранция

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant NextJS
    participant ServerAction
    participant Prisma
    participant PostgreSQL
    participant S3Client
    participant MinIO

    User->>Browser: Попълва форма за гаранция
    User->>Browser: Качва документи (снимки)
    Browser->>NextJS: POST /api/upload
    NextJS->>S3Client: uploadFile(buffer, mime)
    S3Client->>MinIO: PutObjectCommand
    MinIO-->>S3Client: Success (key)
    S3Client-->>NextJS: Return file key
    NextJS-->>Browser: Return file URL
    
    Browser->>ServerAction: createWarranty(data)
    ServerAction->>Prisma: Create WarrantyItem
    Prisma->>PostgreSQL: INSERT INTO WarrantyItem
    PostgreSQL-->>Prisma: Success
    Prisma->>PostgreSQL: INSERT INTO Document (with URLs)
    PostgreSQL-->>Prisma: Success
    Prisma-->>ServerAction: Return warranty
    ServerAction-->>Browser: Redirect to dashboard
    Browser-->>User: Показва успешно съобщение
```

### User Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant LoginPage
    participant AuthJS
    participant CredProvider
    participant Prisma
    participant PostgreSQL

    User->>LoginPage: Въвежда email & password
    LoginPage->>AuthJS: signIn("credentials", {...})
    AuthJS->>CredProvider: authorize(credentials)
    CredProvider->>Prisma: findUnique(email)
    Prisma->>PostgreSQL: SELECT * FROM User
    PostgreSQL-->>Prisma: User data
    Prisma-->>CredProvider: User object
    CredProvider->>CredProvider: bcrypt.compare(password)
    alt Password Valid
        CredProvider-->>AuthJS: Return user
        AuthJS->>Prisma: Create Session
        Prisma->>PostgreSQL: INSERT INTO Session
        PostgreSQL-->>Prisma: Success
        AuthJS-->>LoginPage: Success
        LoginPage-->>User: Redirect to Dashboard
    else Password Invalid
        CredProvider-->>AuthJS: Return null
        AuthJS-->>LoginPage: Error
        LoginPage-->>User: Show error message
    end
```

### Role-Based Access Control

```mermaid
graph TD
    User[User Request] --> Middleware[Auth Middleware]
    Middleware --> CheckAuth{Authenticated?}
    
    CheckAuth -->|No| LoginPage[Redirect to Login]
    CheckAuth -->|Yes| CheckRole{Check Role}
    
    CheckRole --> GlobalAdmin{Global Admin?}
    CheckRole --> AccountAdmin{Account Admin?}
    CheckRole --> RegularUser{Regular User?}
    
    GlobalAdmin -->|Yes| AdminPanel[Access Admin Panel]
    GlobalAdmin -->|No| CheckAccountAdmin
    
    AccountAdmin -->|Yes| AccountSettings[Manage Account]
    AccountAdmin -->|No| CheckRegularUser
    
    RegularUser -->|Yes| Dashboard[Access Dashboard]
    RegularUser -->|No| Forbidden[403 Forbidden]
    
    CheckAccountAdmin[Check Account Admin]
    CheckRegularUser[Check Regular User]
    
    style GlobalAdmin fill:#ef4444,color:#fff
    style AccountAdmin fill:#f59e0b,color:#fff
    style RegularUser fill:#10b981,color:#fff
```

---

## 📁 Структура на Проекта

```
warranty-manager/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (dashboard)/              # Protected routes group
│   │   │   ├── admin/                # Global Admin Panel
│   │   │   │   ├── accounts/         # Account management
│   │   │   │   └── users/            # User management
│   │   │   ├── dashboard/            # Main dashboard
│   │   │   ├── warranties/           # Warranty management
│   │   │   │   ├── [id]/             # Warranty details
│   │   │   │   └── new/              # Add new warranty
│   │   │   ├── settings/             # User settings
│   │   │   └── layout.tsx            # Dashboard layout
│   │   ├── api/                      # API Routes
│   │   │   ├── upload/               # File upload endpoint
│   │   │   ├── uploads/[filename]/   # File serving endpoint
│   │   │   └── auth/[...nextauth]/   # Auth endpoints
│   │   ├── login/                    # Login page
│   │   ├── register/                 # Registration page
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   └── globals.css               # Global styles
│   ├── components/                   # React components
│   │   ├── ui/                       # Shadcn UI components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   ├── warranty-card.tsx         # Custom components
│   │   ├── warranty-form.tsx
│   │   ├── user-nav.tsx
│   │   └── ...
│   ├── lib/                          # Utility libraries
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── storage.ts                # S3/MinIO operations
│   │   ├── utils.ts                  # Helper functions
│   │   ├── actions.ts                # Generic server actions
│   │   ├── warranty-actions.ts       # Warranty CRUD actions
│   │   ├── account-actions.ts        # Account management actions
│   │   ├── user-actions.ts           # User management actions
│   │   ├── admin-actions.ts          # Admin operations
│   │   └── dashboard-actions.ts      # Dashboard data fetching
│   ├── auth.ts                       # Auth.js configuration
│   ├── auth.config.ts                # Auth.js config
│   └── middleware.ts                 # Next.js middleware (auth)
├── prisma/
│   ├── schema.prisma                 # Database schema
│   ├── migrations/                   # Database migrations
│   └── seed.ts                       # Database seeding
├── public/                           # Static assets
├── docker-compose.yml                # Local development setup
├── docker-compose.prod.yml           # Production setup
├── Dockerfile                        # App container
├── Jenkinsfile                       # CI/CD pipeline
├── nginx/                            # Nginx configuration
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── tailwind.config.js                # Tailwind config
└── next.config.ts                    # Next.js config
```

---

## 🗄 База Данни

### Prisma Schema Overview

```prisma
// Основни модели
User              - Потребители на системата
Account           - Акаунти (организации/домакинства)
AccountUser       - Many-to-Many връзка User ↔ Account с роли
WarrantyItem      - Гаранционни карти
Document          - Прикачени документи към гаранции

// Auth.js модели
Session           - Потребителски сесии
VerificationToken - Email verification tokens
```

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ AccountUser : "has"
    Account ||--o{ AccountUser : "has"
    Account ||--o{ WarrantyItem : "contains"
    User ||--o{ WarrantyItem : "creates"
    WarrantyItem ||--o{ Document : "has"
    User ||--o{ Session : "has"
    User ||--o{ Account : "oauth"

    User {
        string id PK
        string email UK
        string password
        string name
        string image
        datetime createdAt
        datetime updatedAt
    }

    Account {
        string id PK
        string name
        string ownerId
        datetime createdAt
        datetime updatedAt
    }

    AccountUser {
        string id PK
        string accountId FK
        string userId FK
        enum role
    }

    WarrantyItem {
        string id PK
        string accountId FK
        string createdByUserId FK
        string title
        string category
        string brand
        string model
        datetime purchaseDate
        int warrantyPeriod
        datetime expiryDate
        decimal price
        string currency
        string merchantName
        string status
        datetime createdAt
        datetime updatedAt
    }

    Document {
        string id PK
        string warrantyItemId FK
        string type
        string url
        datetime createdAt
    }

    Session {
        string id PK
        string sessionToken UK
        string userId FK
        datetime expires
    }
```

### Роли и Права

```typescript
enum Role {
  GLOBAL_ADMIN    // Системен администратор
  ACCOUNT_ADMIN   // Администратор на акаунт
  USER            // Обикновен потребител
}
```

**Йерархия на достъп:**
- `GLOBAL_ADMIN` → Достъп до всички акаунти и потребители
- `ACCOUNT_ADMIN` → Управление на конкретен акаунт
- `USER` → Достъп само до гаранциите в акаунта

---

## 🔐 Автентикация и Авторизация

### Auth.js (NextAuth v5) Setup

**Конфигурация:** `src/auth.config.ts` + `src/auth.ts`

**Providers:**
- **Credentials Provider** - Email/Password authentication
  - Password hashing с `bcryptjs`
  - Custom authorize function

**Adapter:**
- `@auth/prisma-adapter` - Интеграция с Prisma

**Session Strategy:**
- Database sessions (съхранени в PostgreSQL)

**Middleware Protection:**
```typescript
// src/middleware.ts
export { auth as middleware } from "@/auth"

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
```

**Role-Based Authorization:**
```typescript
// Проверка в Server Actions
const session = await auth()
const accountUser = await prisma.accountUser.findFirst({
  where: {
    userId: session.user.id,
    accountId: accountId,
    role: { in: ['ACCOUNT_ADMIN', 'GLOBAL_ADMIN'] }
  }
})
```

---

## 📦 Файлово Съхранение

### MinIO (S3-Compatible Storage)

**Конфигурация:**
```typescript
// src/lib/storage.ts
const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,      // http://localhost:9000
  region: process.env.S3_REGION,          // us-east-1
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // MinIO compatibility
})
```

**Операции:**
1. **Upload:** `uploadFile(key, buffer, mime)` → PutObjectCommand
2. **Delete:** `deleteFile(key)` → DeleteObjectCommand
3. **Get URL:** `getFileUrl(key)` → `/api/uploads/${filename}`

**File Serving:**
```typescript
// src/app/api/uploads/[filename]/route.ts
// Streaming files from MinIO to client
```

**Naming Convention:**
```
documents/{uuid}.{extension}
```

---

## 🌐 API Endpoints

### Public Routes
- `GET /` - Landing page
- `GET /login` - Login page
- `POST /login` - Login action
- `GET /register` - Registration page
- `POST /register` - Registration action

### Protected API Routes
- `POST /api/upload` - File upload to MinIO
- `GET /api/uploads/[filename]` - File serving from MinIO

### Server Actions (Server-Side)

**Warranty Actions** (`src/lib/warranty-actions.ts`):
- `createWarranty(data)` - Create new warranty
- `updateWarranty(id, data)` - Update warranty
- `deleteWarranty(id)` - Delete warranty
- `getWarranties(accountId)` - List warranties
- `getWarrantyById(id)` - Get single warranty

**Account Actions** (`src/lib/account-actions.ts`):
- `createAccount(data)` - Create account
- `updateAccount(id, data)` - Update account
- `deleteAccount(id)` - Delete account
- `addUserToAccount(accountId, userId, role)` - Add user
- `removeUserFromAccount(accountId, userId)` - Remove user

**Admin Actions** (`src/lib/admin-actions.ts`):
- `getAllAccounts()` - List all accounts (GLOBAL_ADMIN)
- `getAllUsers()` - List all users (GLOBAL_ADMIN)
- `changeUserPassword(userId, newPassword)` - Reset password

**User Actions** (`src/lib/user-actions.ts`):
- `updateUserProfile(data)` - Update profile
- `changePassword(oldPassword, newPassword)` - Change own password

---

## 🚀 Deployment

### Docker Compose Architecture

**Development** (`docker-compose.yml`):
```yaml
services:
  postgres:
    image: postgres:15-alpine
    ports: ["5440:5432"]
    
  minio:
    image: minio/minio:latest
    ports: ["9000:9000", "9001:9001"]
```

**Production** (`docker-compose.prod.yml`):
```yaml
services:
  app:
    build: .
    depends_on: [postgres, minio]
    
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
```

### CI/CD Pipeline (Jenkins)

**Jenkinsfile Stages:**
1. **Checkout** - Clone repository
2. **Build** - `docker build`
3. **Test** - Run tests (if any)
4. **Deploy** - `docker-compose up -d`
5. **Migrate** - `npx prisma migrate deploy`

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5440/warranty_db"

# Auth
AUTH_SECRET="random-secret-key"
AUTH_URL="http://localhost:3000"

# S3/MinIO
S3_ENDPOINT="http://localhost:9000"
S3_REGION="us-east-1"
S3_BUCKET="warranties"
S3_ACCESS_KEY_ID="minioadmin"
S3_SECRET_ACCESS_KEY="minioadmin"
```

---

## 📊 Performance Considerations

### Next.js Optimizations
- **Server Components** - Reduce client-side JavaScript
- **Streaming** - Progressive rendering
- **Image Optimization** - Next.js Image component
- **Static Generation** - Where applicable

### Database Optimizations
- **Indexes** - On foreign keys and frequently queried fields
- **Connection Pooling** - Prisma connection pool
- **Cascade Deletes** - Automatic cleanup

### Caching Strategy
- **Server Component Caching** - Automatic by Next.js
- **Revalidation** - `revalidatePath()` after mutations

---

## 🔮 Future Enhancements

1. **AI Integration** - OCR за автоматично попълване от снимки
2. **Email Notifications** - Напомняния за изтичащи гаранции
3. **Mobile App** - React Native приложение
4. **Multi-language** - i18n поддръжка
5. **Analytics** - Статистики и отчети
6. **Export** - PDF/Excel експорт на гаранции

---

**Документ създаден:** 2025-11-22  
**Версия:** 1.0  
**Автор:** Development Team
