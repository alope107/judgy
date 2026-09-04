# syntax=docker/dockerfile:1
ARG NODE_VERSION=24.20.0
FROM node:${NODE_VERSION}-bookworm-slim

ARG CLAUDE_CODE_VERSION=2.1.260
ARG SANDBOX_RUNTIME_VERSION=0.0.75
ARG PNPM_VERSION=11.25.0

ENV DEBIAN_FRONTEND=noninteractive

# bubblewrap + socat are required by Claude Code's sandbox on Linux.
# No sudo, no iptables: the container has no privileged path at all.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl git ripgrep jq less procps bubblewrap socat \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g \
      @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION} \
      @anthropic-ai/sandbox-runtime@${SANDBOX_RUNTIME_VERSION} \
      pnpm@${PNPM_VERSION} \
    && npm cache clean --force

RUN mkdir -p /home/node/.claude /home/node/.local/share/pnpm/store /workspace \
    && chown -R node:node /home/node /workspace

# Root-owned, not writable by node. Several sandbox keys are only honored
# from this scope, so a checked-out repo can't widen its own boundary.
COPY managed-settings.json /etc/claude-code/managed-settings.json
RUN chmod 0444 /etc/claude-code/managed-settings.json

ENV CLAUDE_CONFIG_DIR=/home/node/.claude \
    DISABLE_AUTOUPDATER=1 \
    PNPM_HOME=/home/node/.local/share/pnpm \
    PATH=/home/node/.local/share/pnpm:$PATH

USER node
WORKDIR /workspace

RUN git config --global --add safe.directory /workspace \
    && printf 'ignore-scripts=true\n' > /home/node/.npmrc