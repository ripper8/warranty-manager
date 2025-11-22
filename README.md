This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


npx prisma studio

# Влез в PostgreSQL конзолата
docker exec -it warranty_postgres psql -U postgres -d warranty_db

# скрипт за GLOBAL_ADMIN
WITH user_info AS (
    SELECT id as user_id FROM "User" WHERE email = 'dimitrov.atanas@yahoo.com'
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


# скрипт за валидация

SELECT 
    u.email,
    u.name,
    au.role,
    a.name as account_name
FROM "User" u
JOIN "AccountUser" au ON u.id = au."userId"
JOIN "Account" a ON au."accountId" = a.id
WHERE u.email = 'dimitrov.atanas@yahoo.com'
  AND au.role = 'GLOBAL_ADMIN';
