# Нормализация на базата данни
## Warranty Manager System

---

## Какво е нормализация?

Нормализация е процес на организиране на данните в релационна база данни, за да се намали дублирането и да се подобри интегритета на данните.

---

## Първа нормална форма (1NF)

### Правила:
1. Всяко поле съдържа само атомарни (неделими) стойности
2. Няма повтарящи се групи от колони
3. Всеки ред е уникален

### Примери от проекта:

✅ **Правилно (1NF):**
```
WarrantyItem:
  id: "w123"
  title: "MacBook Pro"
  brand: "Apple"
  category: "Laptop"
```

❌ **Неправилно (нарушава 1NF):**
```
WarrantyItem:
  id: "w123"
  title: "MacBook Pro"
  brands: "Apple, Samsung, Dell"  // Множество стойности в едно поле
```

### Решение в проекта:

Вместо да съхраняваме множество документи в едно поле, създадохме отделна таблица `Document` с връзка 1:N към `WarrantyItem`.

---

## Втора нормална форма (2NF)

### Правила:
1. Трябва да е в 1NF
2. Всички неключови атрибути зависят от **целия** първичен ключ (не от част от него)

### Примери от проекта:

✅ **Правилно (2NF) - Таблица AccountUser:**
```
AccountUser:
  id: "au123"              // PK
  accountId: "a456"        // FK
  userId: "u789"           // FK
  role: "ACCOUNT_ADMIN"    // Зависи от комбинацията (accountId + userId)
```

Полето `role` зависи от комбинацията потребител + акаунт, защото един потребител може да има различни роли в различни акаунти.

❌ **Неправилно (нарушава 2NF):**
```
AccountUser:
  accountId: "a456"        // PK (част 1)
  userId: "u789"           // PK (част 2)
  role: "ACCOUNT_ADMIN"
  userName: "Атанас"       // Зависи само от userId, не от целия ключ!
```

### Решение в проекта:

Информацията за потребителя (`name`, `email`) е в таблица `User`, а не в `AccountUser`. Така всяко поле в `AccountUser` зависи от целия composite key.

---

## Трета нормална форма (3NF)

### Правила:
1. Трябва да е в 2NF
2. Няма транзитивни зависимости (неключови атрибути не зависят от други неключови атрибути)

### Примери от проекта:

✅ **Правилно (3NF) - Таблица WarrantyItem:**
```
WarrantyItem:
  id: "w123"
  accountId: "a456"
  createdByUserId: "u789"
  title: "MacBook Pro"
  purchaseDate: "2024-01-15"
  warrantyPeriod: 12
  expiryDate: "2025-01-15"  // Може да се изчисли, но го съхраняваме за производителност
```

❌ **Неправилно (нарушава 3NF):**
```
WarrantyItem:
  id: "w123"
  accountId: "a456"
  accountName: "Tech Corp"      // Зависи от accountId (транзитивна зависимост!)
  createdByUserId: "u789"
  createdByUserEmail: "a@b.com" // Зависи от createdByUserId (транзитивна зависимост!)
  title: "MacBook Pro"
```

### Решение в проекта:

- `accountName` е в таблица `Account`
- `email`, `name` са в таблица `User`
- `WarrantyItem` съдържа само foreign keys (`accountId`, `createdByUserId`)

---

## Практически примери от проекта

### 1. Таблица User (3NF)

```sql
CREATE TABLE "User" (
  id            TEXT PRIMARY KEY,
  name          TEXT,
  email         TEXT UNIQUE NOT NULL,
  password      TEXT,
  createdAt     TIMESTAMP DEFAULT NOW(),
  updatedAt     TIMESTAMP DEFAULT NOW()
);
```

**Защо е в 3NF:**
- ✅ Всички полета са атомарни (1NF)
- ✅ Има единичен първичен ключ `id` (2NF)
- ✅ Няма транзитивни зависимости (3NF)

---

### 2. Таблица AccountUser (3NF)

```sql
CREATE TABLE "AccountUser" (
  id        TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  userId    TEXT NOT NULL,
  role      TEXT NOT NULL,
  
  FOREIGN KEY (accountId) REFERENCES "Account"(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES "User"(id) ON DELETE CASCADE,
  UNIQUE (accountId, userId)
);
```

**Защо е в 3NF:**
- ✅ Junction table за many-to-many връзка
- ✅ `role` зависи от комбинацията (accountId + userId)
- ✅ Информацията за User и Account е в отделни таблици

---

### 3. Таблица WarrantyItem (3NF)

```sql
CREATE TABLE "WarrantyItem" (
  id              TEXT PRIMARY KEY,
  accountId       TEXT NOT NULL,
  createdByUserId TEXT NOT NULL,
  title           TEXT NOT NULL,
  category        TEXT,
  brand           TEXT,
  model           TEXT,
  purchaseDate    TIMESTAMP,
  warrantyPeriod  INTEGER,
  expiryDate      TIMESTAMP,
  price           DECIMAL,
  currency        TEXT DEFAULT 'EUR',
  status          TEXT DEFAULT 'ACTIVE',
  createdAt       TIMESTAMP DEFAULT NOW(),
  updatedAt       TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (accountId) REFERENCES "Account"(id) ON DELETE CASCADE,
  FOREIGN KEY (createdByUserId) REFERENCES "User"(id)
);
```

**Защо е в 3NF:**
- ✅ Всички атрибути описват директно продукта
- ✅ Няма дублиране на информация за Account или User
- ✅ Документите са в отделна таблица `Document`

---

### 4. Таблица Document (3NF)

```sql
CREATE TABLE "Document" (
  id             TEXT PRIMARY KEY,
  warrantyItemId TEXT NOT NULL,
  type           TEXT NOT NULL,
  url            TEXT NOT NULL,
  createdAt      TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (warrantyItemId) REFERENCES "WarrantyItem"(id) ON DELETE CASCADE
);
```

**Защо е в 3NF:**
- ✅ Отделна таблица за документи (избягва повтарящи се групи)
- ✅ Всеки документ принадлежи на точно един продукт
- ✅ Няма дублиране на информация за продукта

---

## Предимства на нормализацията в проекта

### 1. Няма дублиране на данни
- Информацията за потребител се съхранява само в `User`
- Информацията за акаунт се съхранява само в `Account`
- При промяна на email, променяме само на едно място

### 2. Референциална интегритет
```sql
-- Ако изтриеш акаунт, автоматично се изтриват:
Account → AccountUser (CASCADE)
Account → WarrantyItem (CASCADE)
WarrantyItem → Document (CASCADE)
```

### 3. Гъвкавост
- Лесно добавяне на нови полета
- Лесно добавяне на нови връзки
- Лесно query-ване с JOIN-ове

### 4. Консистентност
- UNIQUE constraints гарантират уникалност
- Foreign keys гарантират валидни връзки
- CHECK constraints (ако има) гарантират валидни стойности

---

## Примерни JOIN заявки

### Вземи всички гаранции с информация за създателя:

```sql
SELECT 
  w.title,
  w.brand,
  w.expiryDate,
  u.name as creator_name,
  u.email as creator_email,
  a.name as account_name
FROM "WarrantyItem" w
JOIN "User" u ON w.createdByUserId = u.id
JOIN "Account" a ON w.accountId = a.id
WHERE w.status = 'ACTIVE'
ORDER BY w.expiryDate ASC;
```

**Благодарение на нормализацията:**
- Не дублираме `creator_name` в `WarrantyItem`
- Не дублираме `account_name` в `WarrantyItem`
- При промяна на името на потребителя, промяната се отразява навсякъде автоматично

---

### Вземи всички документи за гаранции на даден акаунт:

```sql
SELECT 
  w.title,
  d.type,
  d.url,
  d.createdAt
FROM "Document" d
JOIN "WarrantyItem" w ON d.warrantyItemId = w.id
WHERE w.accountId = $1
ORDER BY w.title, d.type;
```

**Благодарение на нормализацията:**
- Един продукт може да има множество документи
- Документите са организирани в отделна таблица
- Лесно добавяне/изтриване на документи без да засягаме продукта

---

## Заключение

Проектът **Warranty Manager** спазва всички правила за нормализация до **3NF**:

✅ **1NF** - Атомарни стойности, уникални редове  
✅ **2NF** - Всички атрибути зависят от целия първичен ключ  
✅ **3NF** - Няма транзитивни зависимости  

Това гарантира:
- Минимално дублиране на данни
- Висока консистентност
- Лесна поддръжка
- Добра производителност
