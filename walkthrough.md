# Warranty Manager - Initial Setup Walkthrough

## Overview
We have successfully initialized the project, set up the infrastructure (Docker, Database), and implemented the core authentication flow.

## Prerequisites
- Docker & Docker Compose
- Node.js 18+

## How to Run

1.  **Start Infrastructure**:
    ```bash
    docker-compose up -d
    ```
    This starts PostgreSQL on port `5440` and pgAdmin on port `5050`.

2.  **Install Dependencies** (if not already):
    ```bash
    npm install
    ```

3.  **Setup Database**:
    ```bash
    npx prisma db push
    npx prisma generate
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

## Features Implemented
- **Authentication**:
    - Register: [http://localhost:3000/register](http://localhost:3000/register)
    - Login: [http://localhost:3000/login](http://localhost:3000/login)
    - Protected Dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Database**:
    - PostgreSQL with Prisma ORM.
    - Schema defined for Users, Accounts, and Warranties.
- **UI**:
    - Shadcn/ui components installed.
    - Responsive Dashboard Layout.

## Next Steps
- Implement "Add Warranty" flow.
- Implement Password Change logic.
- Implement File Uploads.
