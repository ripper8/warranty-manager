# Warranty Manager - Deployment Guide

## Overview

This guide explains how to deploy the Warranty Manager application to a production server using Jenkins and Docker.

## Prerequisites

- Jenkins server with Docker support
- Docker and Docker Compose installed on the server
- Nginx configured for reverse proxy
- GitHub repository access configured in Jenkins

## Project Structure

```
warranty-manager/
├── Dockerfile                 # Next.js application Docker image
├── docker-compose.prod.yml    # Production Docker Compose configuration
├── Jenkinsfile                # Jenkins CI/CD pipeline
├── envs/
│   └── prod/
│       └── compose.env        # Production environment variables
└── nginx/
    └── warranty.acyapps.com.conf  # Nginx configuration (reference)
```

## Setup Steps

### 1. Configure Environment Variables

Edit `envs/prod/compose.env` and set the following values:

```bash
# Database
POSTGRES_PASSWORD=your_strong_password_here

# MinIO
MINIO_ROOT_PASSWORD=your_strong_password_here

# Application
DATABASE_URL=postgresql://postgres:your_strong_password_here@postgres:5432/warranty_db?schema=public
AUTH_SECRET=generate_random_32_char_secret_here
NEXTAUTH_URL=https://warranty.acyapps.com

# S3/MinIO
S3_SECRET_ACCESS_KEY=your_strong_password_here
```

**Important:** 
- Generate a secure `AUTH_SECRET` using: `openssl rand -base64 32`
- Use strong passwords for database and MinIO
- Ensure `NEXTAUTH_URL` matches your domain

### 2. Update Jenkinsfile

Edit the `Jenkinsfile` and update the GitHub repository URL:

```groovy
userRemoteConfigs: [[url: 'https://github.com/YOUR_USERNAME/warranty-manager.git', credentialsId: 'github-token']]
```

Replace `YOUR_USERNAME` with your actual GitHub username or organization.

### 3. Configure Nginx

Copy the nginx configuration to your server:

```bash
sudo cp nginx/warranty.acyapps.com.conf /opt/devops-lab/nginx/conf.d/
```

Update the SSL certificate paths if needed, then reload nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Setup Jenkins Job

1. Create a new Jenkins Pipeline job
2. Configure it to use the `Jenkinsfile` from SCM
3. Set up GitHub credentials (ID: `github-token`)
4. Configure the job to build on push to `development` branch

### 5. Initial MinIO Bucket Setup

Before the first deployment, you may need to manually create the MinIO bucket:

```bash
# Start MinIO container
docker-compose -f docker-compose.prod.yml up -d minio

# Wait for MinIO to be ready, then create bucket
docker exec warranty_minio mc alias set local http://localhost:9000 minioadmin YOUR_PASSWORD
docker exec warranty_minio mc mb local/warranty-files
docker exec warranty_minio mc anonymous set download local/warranty-files
```

Alternatively, the Jenkins pipeline will attempt to create the bucket automatically.

## Deployment Process

The Jenkins pipeline performs the following steps:

1. **Initialize**: Validates branch and sets environment variables
2. **Validate Project Structure**: Checks for required files
3. **Setup Environment**: Copies environment files
4. **Initialize MinIO Bucket**: Creates S3 bucket if needed
5. **Build Docker Images**: Builds the Next.js application image
6. **Stop Existing Containers**: Gracefully stops old containers
7. **Run Database Migrations**: Applies Prisma migrations
8. **Deploy Application**: Starts all services
9. **Health Check**: Verifies application is responding
10. **Verify Services**: Shows container status and logs

## Manual Deployment

If you need to deploy manually:

```bash
# 1. Copy environment file
cp envs/prod/compose.env .env

# 2. Build and start services
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 3. Run migrations
docker-compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy

# 4. Check status
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

## Health Checks

The application exposes a health check endpoint at `/api/health` that verifies:
- Application is running
- Database connection is working

## Troubleshooting

### Application won't start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs app

# Check database connection
docker-compose -f docker-compose.prod.yml exec app npx prisma db pull
```

### Database migration issues

```bash
# Reset database (WARNING: This deletes all data)
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d postgres
docker-compose -f docker-compose.prod.yml run --rm app npx prisma db push
```

### MinIO connection issues

```bash
# Check MinIO status
docker-compose -f docker-compose.prod.yml logs minio

# Verify bucket exists
docker exec warranty_minio mc ls local/
```

### Port conflicts

If port 3093 is already in use, update `docker-compose.prod.yml`:

```yaml
ports:
  - "3094:3000"  # Change 3093 to 3094
```

And update the corresponding environment variables and nginx configuration.

## Backup

### Database Backup

```bash
docker exec warranty_postgres pg_dump -U postgres warranty_db > backup_$(date +%Y%m%d).sql
```

### MinIO Data Backup

```bash
docker run --rm -v warranty_minio-data:/data -v $(pwd):/backup alpine tar czf /backup/minio_backup_$(date +%Y%m%d).tar.gz /data
```

## Monitoring

- Application logs: `docker-compose -f docker-compose.prod.yml logs -f app`
- Database logs: `docker-compose -f docker-compose.prod.yml logs -f postgres`
- MinIO logs: `docker-compose -f docker-compose.prod.yml logs -f minio`
- All services: `docker-compose -f docker-compose.prod.yml ps`

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique passwords for production
- Keep SSL certificates up to date
- Regularly update Docker images for security patches
- Review and rotate secrets periodically

