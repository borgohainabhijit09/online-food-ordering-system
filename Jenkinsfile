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
    // Path inside the Jenkins container (bind-mounted from /root/app on the host).
    APP_DIR = '/workspace/app'
    // Host path — Docker daemon resolves compose volume mounts on the HOST,
    // so we pass this as --project-directory to docker compose.
    HOST_APP_DIR = '/root/app'
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
          # --project-directory uses the HOST path so Docker daemon resolves
          # volume mounts correctly (compose runs inside the Jenkins container
          # but the daemon is on the host).
          # Exclude Jenkins — it cannot restart itself mid-build.
          SERVICES=$(docker compose --project-directory "$HOST_APP_DIR" config --services | grep -v '^jenkins$' | tr '\n' ' ')
          docker compose --project-directory "$HOST_APP_DIR" up -d --build $SERVICES
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
            echo "Health check failed"; docker compose --project-directory "$HOST_APP_DIR" logs --tail 60 backend; exit 1
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
