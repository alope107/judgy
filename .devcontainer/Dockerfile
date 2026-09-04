# syntax=docker/dockerfile:1
ARG NODE_VERSION=24.20.0
FROM node:${NODE_VERSION}-bookworm-slim

ARG CLAUDE_CODE_VERSION=2.1.260
ARG PNPM_VERSION=11.25.0

ARG GIT_USER_NAME="Auberon López (agent)"
ARG GIT_USER_EMAIL="9411388+alope107@users.noreply.github.com"

ENV DEBIAN_FRONTEND=noninteractive

# bubblewrap and socat are gone with the sandbox; they had no other consumer.
# No sudo, no iptables: the container still has no privileged path at all.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl git ripgrep jq less procps \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g \
      @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION} \
      pnpm@${PNPM_VERSION} \
    && npm cache clean --force

RUN mkdir -p /home/node/.claude /home/node/.local/share/pnpm/store /workspace \
    && chown -R node:node /home/node /workspace

# No managed-settings.json is installed. The boundary is now the container
# itself, the scope of the PAT in remoteEnv, and branch protection on main.

ENV CLAUDE_CONFIG_DIR=/home/node/.claude \
    DISABLE_AUTOUPDATER=1 \
    PNPM_HOME=/home/node/.local/share/pnpm \
    PATH=/home/node/.local/share/pnpm:$PATH

USER node
WORKDIR /workspace

# NOTE: credential.helper is deliberately NOT set here. VS Code overwrites
# --global on every attach, so a helper baked into the image is dead on
# arrival. It lives in .git/config instead (repo-local, read last, and on
# the bind mount so it survives rebuilds). See the setup commands in the
# repo README.
#
# safe.directory: the bind-mounted repo is owned by your host uid, not node's.
# user.name/email: a distinct name so container commits are legible in git log.
# .npmrc ignore-scripts: matches pnpm's default posture in case npm gets used.
RUN git config --global --add safe.directory /workspace \
    && git config --global user.name "${GIT_USER_NAME}" \
    && git config --global user.email "${GIT_USER_EMAIL}" \
    && printf 'ignore-scripts=true\n' > /home/node/.npmrc
