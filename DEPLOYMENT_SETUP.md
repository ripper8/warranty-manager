# Deployment Setup Summary

## ✅ Created Files

### Docker Configuration
- **`Dockerfile`** - Multi-stage build for Next.js application
- **`docker-compose.prod.yml`** - Production Docker Compose configuration
- **`.dockerignore`** - Files to exclude from Docker build

### CI/CD
- **`Jenkinsfile`** - Complete Jenkins pipeline for automated deployment
  - ⚠️ **ACTION REQUIRED**: Update GitHub repository URL in line 45

### Environment Configuration
- **`envs/prod/compose.env`** - Production environment variables template
  - ⚠️ **ACTION REQUIRED**: Set all passwords and secrets before deployment

### Nginx Configuration
- **`nginx/warranty.acyapps.com.conf`** - Nginx reverse proxy configuration
  - Reference file - copy to your nginx server

### Documentation
- **`DEPLOYMENT.md`** - Complete deployment guide
- **`DEPLOYMENT_SETUP.md`** - This file

### Application Updates
- **`next.config.ts`** - Updated for standalone output
- **`src/app/api/health/route.ts`** - Health check endpoint for monitoring

## 🔧 Before First Deployment

### 1. Update Jenkinsfile
Edit line 45 in `Jenkinsfile`:
```groovy
userRemoteConfigs: [[url: 'https://github.com/YOUR_USERNAME/warranty-manager.git', credentialsId: 'github-token']]
```

### 2. Configure Environment Variables
Edit `envs/prod/compose.env` and set:
- `POSTGRES_PASSWORD` - Strong password for PostgreSQL
- `MINIO_ROOT_PASSWORD` - Strong password for MinIO
- `AUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `S3_SECRET_ACCESS_KEY` - Should match MinIO password
- Update `DATABASE_URL` with the PostgreSQL password
- Update `NEXTAUTH_URL` if different from `https://warranty.acyapps.com`

### 3. Setup Nginx
```bash
# On your server
sudo cp nginx/warranty.acyapps.com.conf /opt/devops-lab/nginx/conf.d/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Create Initial Prisma Migration (Optional)
If you want to use migrations instead of `db push`:
```bash
npx prisma migrate dev --name init
git add prisma/migrations
git commit -m "Add initial migration"
```

## 🚀 Deployment Flow

1. **Push to `development` branch** → Triggers Jenkins pipeline
2. **Or use BRANCH_OVERRIDE parameter** in Jenkins to deploy any branch
3. Pipeline will:
   - Build Docker images
   - Run database migrations
   - Deploy application
   - Verify health checks

## 📋 Quick Reference

### Manual Commands
```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Run migrations manually
docker-compose -f docker-compose.prod.yml run --rm app npx prisma db push

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Health Check
```bash
curl http://192.168.0.243:3092/api/health
```

### Access Points
- **Application**: http://192.168.0.243:3092 (or https://warranty.acyapps.com via nginx)
- **MinIO Console**: http://192.168.0.243:9001 (if exposed)

## 🔐 Security Checklist

- [ ] All passwords in `envs/prod/compose.env` are strong and unique
- [ ] `AUTH_SECRET` is generated securely
- [ ] `.env` files are in `.gitignore` (already done)
- [ ] SSL certificates are configured in nginx
- [ ] GitHub credentials are configured in Jenkins
- [ ] Firewall rules allow only necessary ports

## 📝 Notes

- The application runs on port **3092** internally (mapped from container port 3000)
- Database runs on internal Docker network (not exposed externally)
- MinIO runs on internal Docker network (port 9000 for API, 9001 for console)
- Health checks verify both application and database connectivity
- First deployment will create the MinIO bucket automatically

## 🆘 Troubleshooting

See `DEPLOYMENT.md` for detailed troubleshooting steps.

