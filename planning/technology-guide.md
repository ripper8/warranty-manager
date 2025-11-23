# Технологичен Гид - Warranty Manager

> Обучителен материал за използваните технологии в проекта  
> Актуализирано: 2025-11-22

## 📋 Съдържание
1. [Next.js & React](#nextjs--react)
2. [TypeScript](#typescript)
3. [Tailwind CSS & Shadcn/ui](#tailwind-css--shadcnui)
4. [Prisma ORM](#prisma-orm)
5. [Auth.js (NextAuth)](#authjs-nextauth)
6. [MinIO & S3](#minio--s3)
7. [Docker & Docker Compose](#docker--docker-compose)
8. [Полезни Ресурси](#полезни-ресурси)

---

## 🚀 Next.js & React

### Какво е Next.js?

**Next.js** е React framework за production-ready приложения. Той добавя функционалности като:
- Server-Side Rendering (SSR)
- Static Site Generation (SSG)
- API Routes
- File-based routing
- Image optimization

### App Router (Next.js 13+)

Проектът използва **App Router** - новата routing система на Next.js.

#### Структура на папките

```
app/
├── page.tsx              # Route: /
├── layout.tsx            # Layout за /
├── (dashboard)/          # Route group (не влияе на URL)
│   ├── layout.tsx        # Layout за dashboard routes
│   ├── dashboard/
│   │   └── page.tsx      # Route: /dashboard
│   └── warranties/
│       ├── page.tsx      # Route: /warranties
│       └── [id]/
│           └── page.tsx  # Route: /warranties/123 (dynamic)
└── api/
    └── upload/
        └── route.ts      # API endpoint: POST /api/upload
```

#### Server Components vs Client Components

**Server Components** (по подразбиране):
```tsx
// app/dashboard/page.tsx
export default async function DashboardPage() {
  // Този код се изпълнява на сървъра
  const warranties = await getWarranties()
  
  return <div>{warranties.map(w => ...)}</div>
}
```

**Предимства:**
- Не се изпраща JavaScript на клиента
- Директен достъп до база данни
- По-бързо зареждане

**Client Components** (с `"use client"`):
```tsx
"use client"

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

**Кога да използваме:**
- Интерактивност (onClick, onChange)
- React hooks (useState, useEffect)
- Browser APIs (localStorage, window)

#### Server Actions

**Server Actions** позволяват извикване на server-side код директно от компоненти.

```tsx
// lib/warranty-actions.ts
"use server"

export async function createWarranty(data: FormData) {
  const session = await auth()
  
  const warranty = await prisma.warrantyItem.create({
    data: {
      title: data.get('title'),
      accountId: session.user.accountId,
      // ...
    }
  })
  
  revalidatePath('/warranties')
  return warranty
}
```

```tsx
// components/warranty-form.tsx
"use client"

import { createWarranty } from '@/lib/warranty-actions'

export function WarrantyForm() {
  return (
    <form action={createWarranty}>
      <input name="title" />
      <button type="submit">Create</button>
    </form>
  )
}
```

### React 19 Features

Проектът използва **React 19**, която включва:
- **Actions** - Автоматично управление на form state
- **useOptimistic** - Optimistic UI updates
- **use()** hook - Await promises в компоненти

---

## 📘 TypeScript

### Защо TypeScript?

TypeScript добавя **статична типизация** към JavaScript:
- Намалява грешки по време на разработка
- По-добър IntelliSense в IDE
- Самодокументиращ се код

### Основни Типове

```typescript
// Primitive types
let name: string = "John"
let age: number = 30
let isActive: boolean = true

// Arrays
let tags: string[] = ["electronics", "warranty"]
let numbers: Array<number> = [1, 2, 3]

// Objects
interface User {
  id: string
  email: string
  name?: string  // Optional property
}

const user: User = {
  id: "123",
  email: "john@example.com"
}

// Functions
function greet(name: string): string {
  return `Hello, ${name}`
}

// Async functions
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`)
  return response.json()
}
```

### Type Inference

TypeScript може да **извежда типове** автоматично:

```typescript
// TypeScript знае, че count е number
let count = 0

// TypeScript знае, че result е Promise<User>
const result = fetchUser("123")
```

### Prisma Types

Prisma генерира TypeScript типове автоматично:

```typescript
import { WarrantyItem, Document } from '@prisma/client'

// Type-safe warranty object
const warranty: WarrantyItem = {
  id: "123",
  title: "Laptop",
  accountId: "acc_1",
  // ... TypeScript ще ви подскаже всички полета
}

// Type with relations
type WarrantyWithDocuments = WarrantyItem & {
  documents: Document[]
}
```

---

## 🎨 Tailwind CSS & Shadcn/ui

### Tailwind CSS

**Tailwind** е utility-first CSS framework.

#### Основни Концепции

```tsx
// Вместо да пишем CSS:
// .button { padding: 0.5rem 1rem; background: blue; color: white; }

// Използваме utility classes:
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Click me
</button>
```

#### Често Използвани Utilities

**Layout:**
```tsx
<div className="flex items-center justify-between">
  <div className="w-1/2">Half width</div>
  <div className="w-1/2">Half width</div>
</div>

<div className="grid grid-cols-3 gap-4">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>
```

**Spacing:**
```tsx
// Padding: p-4 = padding: 1rem (16px)
// Margin: m-4 = margin: 1rem
// Gap: gap-4 = gap: 1rem

<div className="p-4 m-2 space-y-4">
  {/* space-y-4 добавя margin-top между децата */}
</div>
```

**Colors:**
```tsx
// bg-{color}-{shade}
<div className="bg-blue-500 text-white">Blue background</div>
<div className="bg-red-100 text-red-900">Light red background</div>
```

**Responsive Design:**
```tsx
// Mobile-first approach
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Full width на mobile, половин на tablet, 1/3 на desktop */}
</div>
```

**Dark Mode:**
```tsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Automatic dark mode support
</div>
```

### Shadcn/ui

**Shadcn/ui** предоставя готови компоненти, които можем да копираме в проекта.

#### Инсталация на Компонент

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add input
```

Това създава файлове в `components/ui/`.

#### Използване

```tsx
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'

export function MyComponent() {
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>Title</DialogHeader>
        <p>Content</p>
        <Button>Save</Button>
      </DialogContent>
    </Dialog>
  )
}
```

#### Персонализация

Компонентите използват **class-variance-authority** за варианти:

```tsx
// components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
  }
)

// Използване:
<Button variant="destructive" size="lg">Delete</Button>
```

---

## 🗄 Prisma ORM

### Какво е Prisma?

**Prisma** е modern ORM (Object-Relational Mapping) за Node.js и TypeScript.

### Schema Definition

```prisma
// prisma/schema.prisma

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  
  // Relations
  warranties WarrantyItem[]
  accounts   AccountUser[]
}

model WarrantyItem {
  id        String   @id @default(cuid())
  title     String
  userId    String
  
  // Relation
  user      User     @relation(fields: [userId], references: [id])
  documents Document[]
}
```

### Prisma Client

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Create
const user = await prisma.user.create({
  data: {
    email: "john@example.com",
    name: "John Doe"
  }
})

// Read
const users = await prisma.user.findMany({
  where: {
    email: {
      contains: "@example.com"
    }
  },
  include: {
    warranties: true  // Include relations
  }
})

// Update
await prisma.user.update({
  where: { id: "123" },
  data: { name: "Jane Doe" }
})

// Delete
await prisma.user.delete({
  where: { id: "123" }
})
```

### Relations

```typescript
// One-to-Many
const warranty = await prisma.warrantyItem.create({
  data: {
    title: "Laptop",
    user: {
      connect: { id: userId }  // Connect to existing user
    },
    documents: {
      create: [  // Create related documents
        { type: "RECEIPT", url: "/uploads/receipt.jpg" },
        { type: "WARRANTY_CARD", url: "/uploads/card.jpg" }
      ]
    }
  }
})

// Many-to-Many (через AccountUser)
const accountUser = await prisma.accountUser.create({
  data: {
    userId: "user_123",
    accountId: "acc_456",
    role: "ACCOUNT_ADMIN"
  }
})
```

### Migrations

```bash
# Create migration
npx prisma migrate dev --name add_warranty_model

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (development)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

### Prisma Studio

Визуален database browser:

```bash
npx prisma studio
```

Отваря UI на `http://localhost:5555` за разглеждане и редактиране на данни.

---

## 🔐 Auth.js (NextAuth)

### Какво е Auth.js?

**Auth.js** (преди NextAuth.js) е authentication библиотека за Next.js.

### Setup

```typescript
// src/auth.config.ts
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export default {
  providers: [
    Credentials({
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        
        if (!user || !user.password) return null
        
        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        )
        
        if (!isValid) return null
        
        return {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      // Add custom data to session
      session.user.id = token.sub
      return session
    }
  }
} satisfies NextAuthConfig
```

```typescript
// src/auth.ts
import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import authConfig from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  ...authConfig
})
```

### Middleware Protection

```typescript
// src/middleware.ts
export { auth as middleware } from '@/auth'

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
```

### Usage in Components

```tsx
// Server Component
import { auth } from '@/auth'

export default async function Page() {
  const session = await auth()
  
  if (!session) {
    return <div>Not authenticated</div>
  }
  
  return <div>Welcome, {session.user.name}</div>
}
```

```tsx
// Client Component
"use client"

import { useSession } from 'next-auth/react'

export function UserProfile() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <div>Loading...</div>
  if (!session) return <div>Not authenticated</div>
  
  return <div>{session.user.email}</div>
}
```

### Sign In/Out

```tsx
import { signIn, signOut } from '@/auth'

// Server Action
async function handleSignIn(formData: FormData) {
  "use server"
  
  await signIn('credentials', {
    email: formData.get('email'),
    password: formData.get('password'),
    redirectTo: '/dashboard'
  })
}

async function handleSignOut() {
  "use server"
  await signOut({ redirectTo: '/' })
}
```

---

## 📦 MinIO & S3

### Какво е MinIO?

**MinIO** е high-performance object storage, съвместимо с Amazon S3 API.

### Защо MinIO?

- **Self-hosted** - Не зависим от AWS
- **S3-compatible** - Използваме AWS SDK
- **Docker-friendly** - Лесно за локална разработка
- **Free & Open Source**

### Setup с Docker

```yaml
# docker-compose.yml
services:
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"  # S3 API
      - "9001:9001"  # Web Console
    volumes:
      - minio-data:/data
```

### AWS SDK S3 Client

```typescript
// src/lib/storage.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,  // http://localhost:9000
  region: process.env.S3_REGION,      // us-east-1
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,  // MinIO изисква path-style URLs
})

export async function uploadFile(
  key: string,
  buffer: Buffer,
  mime: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mime,
    })
  )
  
  return key
}

export async function deleteFile(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    })
  )
}
```

### File Upload Flow

```typescript
// app/api/upload/route.ts
import { uploadFile } from '@/lib/storage'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  const buffer = Buffer.from(await file.arrayBuffer())
  const extension = file.name.split('.').pop()
  const key = `documents/${uuidv4()}.${extension}`
  
  await uploadFile(key, buffer, file.type)
  
  return Response.json({ key, url: `/api/uploads/${key}` })
}
```

### File Serving

```typescript
// app/api/uploads/[filename]/route.ts
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: `documents/${params.filename}`,
  })
  
  const response = await s3.send(command)
  const stream = response.Body as ReadableStream
  
  return new Response(stream, {
    headers: {
      'Content-Type': response.ContentType || 'application/octet-stream',
    },
  })
}
```

### MinIO Console

Достъп до Web UI: `http://localhost:9001`

- **Credentials:** minioadmin / minioadmin
- **Функции:**
  - Създаване на buckets
  - Upload/Download файлове
  - Управление на permissions
  - Мониторинг

---

## 🐳 Docker & Docker Compose

### Какво е Docker?

**Docker** позволява да пакетираме приложения в **containers** - изолирани среди с всички dependencies.

### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

### Docker Compose

**Docker Compose** управлява multi-container приложения.

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/warranty_db
      S3_ENDPOINT: http://minio:9000
    depends_on:
      - postgres
      - minio
  
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: warranty_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
```

### Основни Команди

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f app

# Rebuild and restart
docker-compose up -d --build

# Execute command in container
docker-compose exec app npx prisma migrate deploy

# Remove volumes (delete data)
docker-compose down -v
```

### Development vs Production

**Development:**
```yaml
# docker-compose.yml
services:
  app:
    build:
      context: .
      target: development
    volumes:
      - .:/app  # Hot reload
    command: npm run dev
```

**Production:**
```yaml
# docker-compose.prod.yml
services:
  app:
    build:
      context: .
      target: runner
    restart: always
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
```

---

## 📚 Полезни Ресурси

### Официална Документация

- **Next.js:** https://nextjs.org/docs
- **React:** https://react.dev
- **TypeScript:** https://www.typescriptlang.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Shadcn/ui:** https://ui.shadcn.com
- **Prisma:** https://www.prisma.io/docs
- **Auth.js:** https://authjs.dev
- **MinIO:** https://min.io/docs
- **Docker:** https://docs.docker.com

### Tutorials & Guides

**Next.js:**
- [Next.js Learn](https://nextjs.org/learn) - Интерактивен курс
- [App Router Guide](https://nextjs.org/docs/app) - Пълно ръководство

**Prisma:**
- [Prisma Quickstart](https://www.prisma.io/docs/getting-started/quickstart)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

**Tailwind:**
- [Tailwind Play](https://play.tailwindcss.com) - Online playground
- [Tailwind UI](https://tailwindui.com) - Premium компоненти

**Auth.js:**
- [Auth.js Tutorial](https://authjs.dev/getting-started/introduction)
- [Credentials Provider](https://authjs.dev/getting-started/providers/credentials)

### Video Courses

- **Next.js 14 Full Course** - YouTube (Traversy Media, Net Ninja)
- **TypeScript for Beginners** - YouTube (Programming with Mosh)
- **Tailwind CSS Crash Course** - YouTube (Traversy Media)
- **Prisma Crash Course** - YouTube (Traversy Media)

### Community

- **Next.js Discord:** https://discord.gg/nextjs
- **Prisma Discord:** https://discord.gg/prisma
- **Tailwind Discord:** https://discord.gg/tailwindcss

### Tools

- **Prisma Studio:** `npx prisma studio` - Database GUI
- **MinIO Console:** `http://localhost:9001` - Object storage UI
- **React DevTools:** Browser extension за debugging
- **Tailwind CSS IntelliSense:** VS Code extension

---

## 🎯 Best Practices

### Code Organization

```
src/
├── app/              # Routes & pages
├── components/       # Reusable UI components
│   ├── ui/           # Shadcn components
│   └── ...           # Custom components
├── lib/              # Business logic
│   ├── actions.ts    # Server actions
│   ├── utils.ts      # Helper functions
│   └── prisma.ts     # Database client
└── types/            # TypeScript types
```

### Naming Conventions

- **Files:** kebab-case (`warranty-card.tsx`)
- **Components:** PascalCase (`WarrantyCard`)
- **Functions:** camelCase (`getWarranties`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

### TypeScript

```typescript
// ✅ Good - Explicit types for function parameters
function createWarranty(data: WarrantyFormData): Promise<Warranty>

// ❌ Bad - Implicit any
function createWarranty(data)
```

### Prisma

```typescript
// ✅ Good - Include only needed relations
const warranty = await prisma.warrantyItem.findUnique({
  where: { id },
  include: { documents: true }
})

// ❌ Bad - Over-fetching
const warranty = await prisma.warrantyItem.findUnique({
  where: { id },
  include: {
    documents: true,
    account: {
      include: {
        users: {
          include: { user: true }
        }
      }
    }
  }
})
```

### Error Handling

```typescript
// ✅ Good - Proper error handling
try {
  const warranty = await createWarranty(data)
  revalidatePath('/warranties')
  return { success: true, warranty }
} catch (error) {
  console.error('Failed to create warranty:', error)
  return { success: false, error: 'Failed to create warranty' }
}

// ❌ Bad - Silent failures
const warranty = await createWarranty(data).catch(() => null)
```

---

**Документ създаден:** 2025-11-22  
**Версия:** 1.0  
**Автор:** Development Team

---

## 📝 Бележки

Този документ е жив и ще се актуализира с нови технологии и best practices.

За въпроси или предложения, моля свържете се с development team.
