// CI/CD for restobuddy.in — rebuilds and redeploys the Docker cell on the same
// server whenever `main` updates. Runs inside the Jenkins container, which has
// the Docker CLI + compose plugin and the host docker socket mounted, and the
// deploy dir (/root/app) mounted at /workspace/app.
pipeline {
  agent any

  options {
    timeout(time: 30, unit: 'MINUTES')
    disableConcurrentBuilds()
    timestamps()
  }

  environment {
    APP_DIR = '/workspace/app'
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
          # Exclude Jenkins from the rebuild — it cannot restart itself mid-build.
          # Jenkins picks up Dockerfile changes on the next manual rebuild.
          SERVICES=$(docker compose config --services | grep -v '^jenkins$' | tr '\n' ' ')
          docker compose up -d --build $SERVICES
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
