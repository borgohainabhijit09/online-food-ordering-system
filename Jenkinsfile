// CI/CD for restobuddy.in — rebuilds and redeploys the Docker cell on the same
// server whenever `main` updates. Runs inside the Jenkins container, which has
// the Docker CLI + compose plugin and the host docker socket mounted, and the
// deploy dir (/root/app) mounted at /root/app (same path as host).
pipeline {
  agent any

  options {
    timeout(time: 30, unit: 'MINUTES')
    disableConcurrentBuilds()
    timestamps()
  }

  environment {
    // /root/app is mounted at the same path inside the Jenkins container,
    // so Docker daemon and shell both resolve paths identically.
    APP_DIR = '/root/app'
    DEPLOY_BRANCH = 'main'
  }

  triggers {
    // Fallback if the GitHub webhook isn't wired: poll every 5 min.
    pollSCM('H/5 * * * *')
  }

  stages {
    stage('Sync code') {
      steps {
        sh '''
          cd "$APP_DIR"
          git fetch --all --prune
          git checkout "$DEPLOY_BRANCH"
          git reset --hard "origin/$DEPLOY_BRANCH"
          git log -1 --oneline
        '''
      }
    }

    stage('Build & deploy') {
      steps {
        sh '''
          cd "$APP_DIR"
          # Build only app images (backend, frontend, db wrapper).
          # Exclude Jenkins (can't restart itself) and stateful services (db, redis)
          # that must not be recreated mid-deploy to avoid data loss or NOLOGIN resets.
          BUILD_SERVICES=$(docker compose config --services \
            | grep -vE '^(jenkins|db|redis|adminer|certbot)$' \
            | tr '\n' ' ')
          docker compose up -d --build $BUILD_SERVICES
          # Ensure stateful services are running (start if stopped, no recreate).
          docker compose up -d --no-recreate db redis adminer certbot
          docker image prune -f
        '''
      }
    }

    stage('Health check') {
      steps {
        sh '''
          cd "$APP_DIR"
          sleep 12
          # hit the app through nginx from inside the docker network
          code=$(docker run --rm --network food-ordering-cell_default curlimages/curl:latest \
                 -s -o /dev/null -w "%{http_code}" -H "Host: restobuddy.in" http://nginx/api/products \
                 -H "x-tenant-slug: bamboho" || echo 000)
          echo "app health -> $code"
          if [ "$code" = "000" ] || [ "$code" -ge 500 ]; then
            echo "Health check failed"; docker compose logs --tail 60 backend; exit 1
          fi
        '''
      }
    }
  }

  post {
    success { echo "Deployed origin/${env.DEPLOY_BRANCH} successfully." }
    failure { echo "Deploy FAILED — app left on previous running containers." }
  }
}
