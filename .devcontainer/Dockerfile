# syntax=docker/dockerfile:1
ARG NODE_VERSION=24.20.0
FROM node:${NODE_VERSION}-bookworm-slim

ARG CLAUDE_CODE_VERSION=2.1.260
ARG PNPM_VERSION=11.25.0

# Must equal the `playwright` / `@playwright/test` version pinned in the repo's
# package.json. Playwright resolves browsers by an exact build number derived
# from its own version, so a mismatch fails with "Executable doesn't exist at
# /ms-playwright/chromium-<build>/...". That error is loud and names the path,
# which is the only reason this coupling is tolerable — but bump both together.
ARG PLAYWRIGHT_VERSION=1.62.1

ARG GIT_USER_NAME="Auberon López (agent)"
ARG GIT_USER_EMAIL="9411388+alope107@users.noreply.github.com"

ENV DEBIAN_FRONTEND=noninteractive

# bubblewrap and socat are gone with the sandbox; they had no other consumer.
# Still no sudo here. iptables IS present now, but not from this file: the
# docker-in-docker feature in devcontainer.json installs it, along with the
# engine, for the nested daemon's bridge networking. That feature also makes
# the container privileged, so the "no privileged path at all" this comment
# used to claim no longer holds — see the note in devcontainer.json.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl git ripgrep jq less procps \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g \
      @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION} \
      pnpm@${PNPM_VERSION} \
    && npm cache clean --force

# Playwright: Chromium plus its system libraries, baked into the image.
#
# docs/BOOTSTRAP.md Task 1 specifies the convergence fuzz harness runs on
# Playwright with headless Chromium, so this is a hard requirement, not a
# convenience. Neither half can be left to `npm install` in the workspace:
#
#   - This is bookworm-slim. Chromium needs ~19 shared libraries it does not
#     ship (libglib-2.0, libnss3, libX11, libgbm, libasound, …). Installing
#     them needs root, and there is deliberately no sudo in this image, so it
#     has to happen here at build time.
#   - /home/node/.npmrc sets ignore-scripts=true (see the note at the end of
#     this file), so Playwright's postinstall browser download never runs.
#     Baking the browsers in is the only thing that reliably works.
#
# PLAYWRIGHT_BROWSERS_PATH moves the browsers out of root's ~/.cache to a
# shared path, and a+rX makes them readable by the node user. Only chromium is
# installed — Firefox and WebKit would roughly double the layer for browsers
# Task 1 does not ask for.
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx --yes playwright@${PLAYWRIGHT_VERSION} install --with-deps chromium \
    && chmod -R a+rX /ms-playwright \
    && rm -rf /var/lib/apt/lists/* /root/.npm

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
