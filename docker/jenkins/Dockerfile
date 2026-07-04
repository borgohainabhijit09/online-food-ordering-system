# Jenkins LTS + Docker CLI + compose plugin, so pipelines can run
# `docker compose` against the host daemon (mounted socket) to rebuild the app.
FROM jenkins/jenkins:lts-jdk17

USER root

# Docker CLI + compose plugin (Debian bookworm base)
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl gnupg git \
 && install -m 0755 -d /etc/apt/keyrings \
 && curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc \
 && chmod a+r /etc/apt/keyrings/docker.asc \
 && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian bookworm stable" \
      > /etc/apt/sources.list.d/docker.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends docker-ce-cli docker-compose-plugin \
 && rm -rf /var/lib/apt/lists/*

# Pre-install the plugins the pipeline needs (skips some setup-wizard clicking).
RUN jenkins-plugin-cli --plugins \
      workflow-aggregator \
      git \
      github \
      pipeline-stage-view \
      configuration-as-code

# Pre-trust GitHub's host key so bare `git` commands in pipeline sh steps work
# without interactive confirmation. Keys fetched at build time from the public API.
RUN mkdir -p /root/.ssh && chmod 700 /root/.ssh \
 && ssh-keyscan -t rsa,ecdsa,ed25519 github.com >> /root/.ssh/known_hosts 2>/dev/null \
 && chmod 600 /root/.ssh/known_hosts

# Runs as root so it can access the mounted /var/run/docker.sock.
# (Acceptable for a single-tenant internal CI box; see RUNBOOK security notes.)
USER root
