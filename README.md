# Warranty Manager

A simple app to keep track of warranties, receipts, and product documentation. Built this because I kept losing track of when warranties expire and couldn't find receipts when I needed them.

## What it does

- Store warranty info for your purchases (dates, periods, etc.)
- Upload and organize receipts and product photos
- Multi-tenant setup - different accounts can manage their own warranties
- Role-based access (global admin, account admin, regular users)

## Tech Stack
 
- **Next.js 16** with App Router
- **NextAuth v5** for authentication
- **Prisma** + **PostgreSQL** for the database
- **Tailwind CSS** for styling
- **Docker** for local development

## Getting Started

### Prerequisites

Make sure you have Docker installed. That's pretty much it.

### Setup

1. Install dependencies:

```bash
npm install
```

2. Start the PostgreSQL database:

```bash
docker-compose up -d
```

3. Set up your `.env` file (copy from `.env.example` if you have one, or check the `.env` file)

4. Run database migrations:

```bash
npx prisma migrate dev
```

5. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you should be good to go.

## Database Management

### Prisma Studio

Want to browse the database visually? Run:

```bash
npx prisma studio
```

### Direct PostgreSQL Access

If you need to run SQL directly:

```bash
docker exec -it warranty_postgres psql -U postgres -d warranty_db
```

### Creating a Global Admin

After you create your first user account, you'll need to promote yourself to GLOBAL_ADMIN. Here's the SQL script I use (replace the email with yours):

```sql
WITH user_info AS (
    SELECT id as user_id FROM "User" WHERE email = 'your-email@example.com'
),
system_account AS (
    INSERT INTO "Account" (id, name, "ownerId", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid()::TEXT,
        'System',
        (SELECT user_id FROM user_info),
        NOW(),
        NOW()
    WHERE NOT EXISTS (SELECT 1 FROM "Account" WHERE name = 'System')
    RETURNING id as account_id
),
existing_account AS (
    SELECT id as account_id FROM "Account" WHERE name = 'System' LIMIT 1
),
final_account AS (
    SELECT account_id FROM system_account
    UNION ALL
    SELECT account_id FROM existing_account
    LIMIT 1
)
INSERT INTO "AccountUser" (id, "accountId", "userId", role)
SELECT 
    gen_random_uuid()::TEXT,
    (SELECT account_id FROM final_account),
    (SELECT user_id FROM user_info),
    'GLOBAL_ADMIN'
WHERE NOT EXISTS (
    SELECT 1 FROM "AccountUser" 
    WHERE "userId" = (SELECT user_id FROM user_info) 
      AND role = 'GLOBAL_ADMIN'
)
RETURNING id;
```

### Verify Your Admin Role

Check if it worked:

```sql
SELECT 
    u.email,
    u.name,
    au.role,
    a.name as account_name
FROM "User" u
JOIN "AccountUser" au ON u.id = au."userId"
JOIN "Account" a ON au."accountId" = a.id
WHERE u.email = 'your-email@example.com'
  AND au.role = 'GLOBAL_ADMIN';
```

## Project Structure

src/
├── app/              # Next.js app router pages
├── components/       # React components
├── lib/              # Utilities and helpers
└── middleware.ts     # Auth middleware

prisma/
├── schema.prisma     # Database schema
└── migrations/       # Database migrations
```

---

## 🎓 Университетски проект

Този проект е разработен като задание за курс "Бази данни".

### Изисквания:
✅ Релационна база данни (PostgreSQL)  
✅ Спазени правила за нормализация (1NF, 2NF, 3NF)  
✅ 5 основни таблици с CRUD операции  
✅ ER диаграма  

### Материали за презентация:

- **[PRESENTATION.md](PRESENTATION.md)** - Основна презентация (готова за reveal.js/Marp)
- **[NORMALIZATION.md](NORMALIZATION.md)** - Детайлно обяснение на нормализацията
- **[PRESENTATION_GUIDE.md](PRESENTATION_GUIDE.md)** - Как да използваш презентацията
- **[er_diagram.png](er_diagram.png)** - ER диаграма на базата данни

### Бърз старт за презентация:

```bash
# Инсталирай reveal-md
npm install -g reveal-md

# Стартирай презентацията
reveal-md PRESENTATION.md

# Отвори в браузър
open http://localhost:1948
```

### Структура на базата данни:

1. **User** - Потребители на системата
2. **Account** - Организации/Акаунти (multi-tenant)
3. **AccountUser** - Junction table за many-to-many връзка + роли
4. **WarrantyItem** - Гаранционни продукти (основна бизнес логика)
5. **Document** - Прикачени документи (касови бележки, снимки)

Вижте [ER диаграмата](er_diagram.png) за визуализация на връзките.

