pipeline {
  agent any

  options {
    buildDiscarder(logRotator(numToKeepStr: '20'))
    disableConcurrentBuilds()
    timestamps()
  }

  parameters {
    string(name: 'BRANCH_OVERRIDE', defaultValue: '', description: 'Optional: branch name to deploy to prod (leave empty to only allow development)')
  }

  environment {
    PROJECT_DIR = "${env.WORKSPACE}"
    DOCKER_COMPOSE_FILE = "docker-compose.prod.yml" // will be overridden in Initialize
    ENV = "prod"                                 // will be overridden in Initialize
    FRONTEND_URL = "http://192.168.0.243:3093"  // default for prod; overridden in stages
    BACKEND_URL  = "http://192.168.0.243:3093"
    COMPOSE_DOCKER_CLI_BUILD = "1"
    DOCKER_BUILDKIT = "1"
    COMPOSE_PROJECT_NAME = "warranty"
  }

  stages {
    stage('Initialize') {
      steps {
        script {
          // Get branch from environment or git
          def branch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD | cat', returnStdout: true).trim()
          
          // Clean branch name (remove origin/ prefix if present)
          branch = branch.replaceAll('^origin/', '').replaceAll('^refs/heads/', '')

          // If still HEAD or empty, try to infer from git
          if (branch == 'HEAD' || !branch) {
            try {
              def inferred = sh(script: "git branch -r --contains HEAD | sed -n 's#origin/##p' | head -n1 | tr -d '\n' | cat", returnStdout: true).trim()
              if (inferred && inferred != 'HEAD') {
                branch = inferred.replaceAll('^origin/', '')
              }
            } catch (Exception e) {
              echo "⚠️ Could not infer branch: ${e.message}"
            }
          }

          // Validate/override branch
          def override = (params.BRANCH_OVERRIDE ?: '').trim()
          if (override) {
            echo "🔁 Overriding branch to '${override}' for this deploy"
            checkout([$class: 'GitSCM',
              branches: [[name: "*/${override}"]],
              doGenerateSubmoduleConfigurations: false,
              extensions: [[$class: 'CleanBeforeCheckout']],
              submoduleCfg: [],
              userRemoteConfigs: [[url: 'git@github.com:ripper8/warranty-manager.git', credentialsId: 'github-ssh-key']]
            ])
            branch = override
            env.BRANCH = branch
          } else {
            // Allow both master and development branches
            if (branch != 'development' && branch != 'master' && branch != 'main') {
              error("Only 'development', 'master', or 'main' branches can be deployed when BRANCH_OVERRIDE is empty. Current branch: '${branch}'. Set BRANCH_OVERRIDE to deploy another branch.")
            }
            env.BRANCH = branch
          }

          env.EFFECTIVE_ENV = 'prod'
          env.COMPOSE_FILE = 'docker-compose.prod.yml'
          env.APP_SERVICE = 'warranty_app'

          currentBuild.displayName = "#${env.BUILD_NUMBER} prod @ ${branch}"
          currentBuild.description = "Compose: ${env.COMPOSE_FILE}"

          echo "🧭 Branch: ${branch} | Effective ENV: ${env.EFFECTIVE_ENV} | Compose: ${env.COMPOSE_FILE} | Override: ${override ?: '-'}"
        }
      }
    }

    stage('Validate Project Structure') {
      when { expression { (env.BRANCH == 'development' || env.BRANCH == 'master' || env.BRANCH == 'main') || (params.BRANCH_OVERRIDE?.trim()) } }
      steps {
        withEnv(["ENV=${env.EFFECTIVE_ENV}", "DOCKER_COMPOSE_FILE=${env.COMPOSE_FILE}"]) {
          dir("${env.PROJECT_DIR}") {
          sh '''
            echo "🔍 Checking project structure..."
            [ -f ${DOCKER_COMPOSE_FILE} ] || { echo "❌ ${DOCKER_COMPOSE_FILE} missing"; exit 1; }
            [ -f Dockerfile ]             || { echo "❌ Dockerfile missing"; exit 1; }
            [ -d envs/${ENV} ]            || { echo "❌ envs/${ENV} missing"; exit 1; }
            [ -f envs/${ENV}/compose.env ] || { echo "❌ envs/${ENV}/compose.env missing"; exit 1; }
            echo "✅ Structure OK"
          '''
          }
        }
      }
    }

    stage('Setup Environment') {
      when { expression { (env.BRANCH == 'development' || env.BRANCH == 'master' || env.BRANCH == 'main') || (params.BRANCH_OVERRIDE?.trim()) } }
      steps {
        withEnv(["ENV=${env.EFFECTIVE_ENV}", "DOCKER_COMPOSE_FILE=${env.COMPOSE_FILE}"]) {
          dir("${env.PROJECT_DIR}") {
          sh '''
            set -eu
            echo "🔧 Preparing env files from envs/${ENV} ..."
            test -d envs/${ENV}
            cp envs/${ENV}/compose.env ./.env
            mkdir -p logs || true
            echo "✅ Environment ready"
          '''
          }
        }
      }
    }

    stage('Initialize MinIO Bucket') {
      when { expression { (env.BRANCH == 'development' || env.BRANCH == 'master' || env.BRANCH == 'main') || (params.BRANCH_OVERRIDE?.trim()) } }
      steps {
        withEnv(["ENV=${env.EFFECTIVE_ENV}", "DOCKER_COMPOSE_FILE=${env.COMPOSE_FILE}"]) {
          dir("${env.PROJECT_DIR}") {
          sh '''
            set -eu
            echo "🪣 Starting MinIO temporarily to create bucket..."
            
            # Load environment variables from .env file
            if [ -f .env ]; then
              export $(grep -v '^#' .env | xargs)
            else
              echo "⚠️ .env file not found, using defaults"
            fi
            
            docker-compose -f ${DOCKER_COMPOSE_FILE} up -d minio
            sleep 10
            
            # Wait for MinIO to be ready
            ATTEMPTS=12; SLEEP=5; ok=0
            for i in $(seq 1 $ATTEMPTS); do
              if docker exec warranty_minio mc ready local 2>/dev/null; then
                echo "✅ MinIO ready"; ok=1; break
              fi
              echo "⏳ MinIO starting ($i/$ATTEMPTS); sleep $SLEEP s"; sleep $SLEEP
            done
            
            if [ "$ok" -eq 1 ]; then
              # Configure MinIO client and create bucket
              MINIO_USER="${MINIO_ROOT_USER:-minioadmin}"
              MINIO_PASS="${MINIO_ROOT_PASSWORD:-minioadmin}"
              BUCKET_NAME="${S3_BUCKET:-warranty-docs}"
              
              docker exec warranty_minio mc alias set local http://localhost:9000 "$MINIO_USER" "$MINIO_PASS" || true
              docker exec warranty_minio mc mb local/"$BUCKET_NAME" --ignore-existing || true
              docker exec warranty_minio mc anonymous set download local/"$BUCKET_NAME" || true
              echo "✅ Bucket ready"
            else
              echo "⚠️ MinIO not ready, bucket will be created on first use"
            fi
          '''
          }
        }
      }
    }

    stage('Build Docker Images') {
      when { expression { (env.BRANCH == 'development' || env.BRANCH == 'master' || env.BRANCH == 'main') || (params.BRANCH_OVERRIDE?.trim()) } }
      steps {
        withEnv(["ENV=${env.EFFECTIVE_ENV}", "DOCKER_COMPOSE_FILE=${env.COMPOSE_FILE}"]) {
          dir("${env.PROJECT_DIR}") {
          sh '''
            set -eu
            echo "🔧 Building images (no cache) using ${DOCKER_COMPOSE_FILE}..."
            docker-compose -f ${DOCKER_COMPOSE_FILE} build --no-cache
            echo "✅ Build done"
          '''
          }
        }
      }
    }

    stage('Stop Existing Containers') {
      when { expression { (env.BRANCH == 'development' || env.BRANCH == 'master' || env.BRANCH == 'main') || (params.BRANCH_OVERRIDE?.trim()) } }
      steps {
        withEnv(["ENV=${env.EFFECTIVE_ENV}", "DOCKER_COMPOSE_FILE=${env.COMPOSE_FILE}"]) {
          dir("${env.PROJECT_DIR}") {
          sh '''
            set -eu
            echo "🛑 docker-compose down (${DOCKER_COMPOSE_FILE}) ..."
            docker-compose -f ${DOCKER_COMPOSE_FILE} down || true
            docker container prune -f || true
          '''
          }
        }
      }
    }

    stage('Run Database Migrations') {
      when { expression { (env.BRANCH == 'development' || env.BRANCH == 'master' || env.BRANCH == 'main') || (params.BRANCH_OVERRIDE?.trim()) } }
      steps {
        withEnv(["ENV=${env.EFFECTIVE_ENV}", "DOCKER_COMPOSE_FILE=${env.COMPOSE_FILE}"]) {
          dir("${env.PROJECT_DIR}") {
          sh '''
            set -eu
            
            # Load environment variables from .env file
            if [ -f .env ]; then
              export $(grep -v '^#' .env | xargs)
            else
              echo "⚠️ .env file not found, using defaults"
            fi
            
            echo "🗄️ Starting database for migrations..."
            docker-compose -f ${DOCKER_COMPOSE_FILE} up -d postgres
            
            echo "⏳ Waiting for database to be ready..."
            ATTEMPTS=24; SLEEP=5; ok=0
            DB_USER="${POSTGRES_USER:-postgres}"
            for i in $(seq 1 $ATTEMPTS); do
              if docker exec warranty_postgres pg_isready -U "$DB_USER" >/dev/null 2>&1; then
                echo "✅ Database ready"; ok=1; break
              fi
              echo "⏳ Database starting ($i/$ATTEMPTS); sleep $SLEEP s"; sleep $SLEEP
            done
            
            if [ "$ok" -eq 1 ]; then
              echo "🔄 Running Prisma migrations..."
              # Use npx to run Prisma (it will use the version from node_modules)
              # Try migrate deploy first, fallback to db push if no migrations exist
              docker-compose -f ${DOCKER_COMPOSE_FILE} run --rm app sh -c "npx prisma migrate deploy" || \
              docker-compose -f ${DOCKER_COMPOSE_FILE} run --rm app sh -c "npx prisma db push"
              echo "✅ Migrations complete"
            else
              echo "❌ Database not ready for migrations"
              exit 1
            fi
          '''
          }
        }
      }
    }

    stage('Deploy Application') {
      when { expression { (env.BRANCH == 'development' || env.BRANCH == 'master' || env.BRANCH == 'main') || (params.BRANCH_OVERRIDE?.trim()) } }
      steps {
        withEnv([
          "ENV=${env.EFFECTIVE_ENV}",
          "DOCKER_COMPOSE_FILE=${env.COMPOSE_FILE}",
          "FRONTEND_URL=http://192.168.0.243:3093",
          "BACKEND_URL=http://192.168.0.243:3093"
        ]) {
          dir("${env.PROJECT_DIR}") {
          sh '''
            set -eu
            echo "🚀 docker-compose up -d (${DOCKER_COMPOSE_FILE}) ..."
            docker-compose -f ${DOCKER_COMPOSE_FILE} up -d --remove-orphans
            
            echo "⏳ Waiting for app container health..."
            ATTEMPTS=24; SLEEP=5; ok=0
            for i in $(seq 1 $ATTEMPTS); do
              st=$(docker inspect -f '{{.State.Health.Status}}' ${APP_SERVICE} 2>/dev/null || echo starting)
              if [ "$st" = "healthy" ]; then echo "✅ App container healthy"; ok=1; break; fi
              echo "⏳ App $st ($i/$ATTEMPTS); sleep $SLEEP s"; sleep $SLEEP
            done
            
            [ "$ok" -eq 1 ] || { echo "❌ App container not healthy"; exit 1; }
            
            docker-compose -f ${DOCKER_COMPOSE_FILE} ps
          '''
          }
        }
      }
    }

    stage('Health Check') {
      when { expression { (env.BRANCH == 'development' || env.BRANCH == 'master' || env.BRANCH == 'main') || (params.BRANCH_OVERRIDE?.trim()) } }
      steps {
        withEnv([
          "ENV=${env.EFFECTIVE_ENV}",
          "DOCKER_COMPOSE_FILE=${env.COMPOSE_FILE}",
          "FRONTEND_URL=http://192.168.0.243:3093",
          "BACKEND_URL=http://192.168.0.243:3093"
        ]) {
          dir("${env.PROJECT_DIR}") {
          sh '''
            set -eu
            echo "🏥 App HTTP health check..."
            ATTEMPTS=24; SLEEP=5; ok=0
            for i in $(seq 1 $ATTEMPTS); do
              if curl -fsS ${BACKEND_URL}/api/health >/dev/null; then
                echo "✅ App healthy"; ok=1; break
              else
                echo "⏳ App not ready ($i/$ATTEMPTS); sleep $SLEEP s"; sleep $SLEEP
              fi
            done
            
            [ "$ok" -eq 1 ] || { echo "❌ App failed health check after retries"; exit 1; }
            
            echo "✅ All health checks passed"
          '''
          }
        }
      }
    }

    stage('Verify Services') {
      when { expression { (env.BRANCH == 'development' || env.BRANCH == 'master' || env.BRANCH == 'main') || (params.BRANCH_OVERRIDE?.trim()) } }
      steps {
        withEnv(["ENV=${env.EFFECTIVE_ENV}", "DOCKER_COMPOSE_FILE=${env.COMPOSE_FILE}"]) {
          dir("${env.PROJECT_DIR}") {
          sh '''
            echo "🔍 Verifying containers..."
            docker-compose -f ${DOCKER_COMPOSE_FILE} ps
            echo "📋 Recent container logs:"
            docker-compose -f ${DOCKER_COMPOSE_FILE} logs --tail=80 || true
            echo "✅ Verification done"
          '''
          }
        }
      }
    }
  }

  post {
    success {
      echo '✅ Deployment successful!'
      echo "🌐 Application: ${env.FRONTEND_URL}"
      cleanWs()
    }
    failure {
      echo '❌ Deployment failed! Dumping logs...'
      dir("${env.PROJECT_DIR}") {
        sh '''
          if [ -f ${DOCKER_COMPOSE_FILE} ]; then
            docker-compose -f ${DOCKER_COMPOSE_FILE} ps || true
            docker-compose -f ${DOCKER_COMPOSE_FILE} logs --tail=200 || true
          else
            echo "⚠️ compose file missing"
          fi
          docker system df || true
        '''
      }
      cleanWs()
    }
  }
}

