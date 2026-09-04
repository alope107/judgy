# syntax=docker/dockerfile:1

# Base: Playwright's own image, so the browsers and their ~19 system libraries are
# upstream's problem rather than ours. docs/BOOTSTRAP.md Task 1 specifies the convergence
# fuzz harness runs on Playwright with headless Chromium; the previous bookworm-slim base
# could not launch a browser at all without installing that library set by hand.
#
# The tag pins BOTH the browser build and the OS. It must equal the `playwright` /
# `@playwright/test` version in package.json: Playwright resolves browsers by an exact
# build number derived from its own version, and a mismatch fails with
# "Executable doesn't exist at /ms-playwright/chromium-<build>/...". Loud, and it names the
# path — but the two have to move together.
#
# Ubuntu 24.04. Playwright supports Debian 12/13 and Ubuntu 22.04/24.04/26.04, so this is
# not a correctness move; it is about not maintaining a browser install by hand.
ARG PLAYWRIGHT_VERSION=1.62.1
FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble

ARG CLAUDE_CODE_VERSION=2.1.260
ARG PNPM_VERSION=11.25.0

ARG GIT_USER_NAME="Auberon López (agent)"
ARG GIT_USER_EMAIL="9411388+alope107@users.noreply.github.com"

ENV DEBIAN_FRONTEND=noninteractive

# The base already has git, curl and procps; jq, ripgrep and less are missing. The list is
# spelled out in full anyway, so this is a complete statement of what the image should
# contain rather than a diff against a base that can change under us.
#
# Still no sudo — but note that is now inherited rather than arranged: the Playwright image
# does not ship one either. The property is asserted in .devcontainer/verify-image.sh so
# that a future base quietly adding sudo is caught rather than assumed away.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl git ripgrep jq less procps \
    && rm -rf /var/lib/apt/lists/*

# Ubuntu 24.04 ships a default `ubuntu` user holding uid 1000, and the Playwright image
# adds `pwuser` at 1001. Neither is what devcontainer.json's `remoteUser: node` expects,
# and the previous node-based image gave us `node` at uid 1000. Recreate that exactly:
# keeping the uid identical keeps ownership on the bind-mounted workspace behaving as it
# did before, so this is not a cosmetic choice.
#
# pwuser is left in place. It is Playwright's convention for dropping privileges when
# driving browsers against untrusted pages; we do not use it, and removing it would be a
# gratuitous difference from the base.
RUN userdel --remove ubuntu \
    && groupadd --gid 1000 node \
    && useradd --uid 1000 --gid 1000 --create-home --shell /bin/bash node

RUN npm install -g \
      @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION} \
      pnpm@${PNPM_VERSION} \
    && npm cache clean --force

RUN mkdir -p /home/node/.claude /home/node/.local/share/pnpm/store /workspace \
    && chown -R node:node /home/node /workspace

# The base sets PLAYWRIGHT_BROWSERS_PATH=/ms-playwright and installs the browsers as root.
# a+rX so the node user can execute them; without it every launch fails on permissions.
RUN chmod -R a+rX /ms-playwright

# No managed-settings.json is installed. The boundary is the container itself, the scope of
# the PAT in remoteEnv, and branch protection on main.

ENV CLAUDE_CONFIG_DIR=/home/node/.claude \
    DISABLE_AUTOUPDATER=1 \
    PNPM_HOME=/home/node/.local/share/pnpm \
    PATH=/home/node/.local/share/pnpm:$PATH

USER node
WORKDIR /workspace

# NOTE: credential.helper is deliberately NOT set here. VS Code overwrites --global on
# every attach, so a helper baked into the image is dead on arrival. It lives in .git/config
# instead (repo-local, read last, and on the bind mount so it survives rebuilds). See the
# setup commands in the repo README.
#
# safe.directory: the bind-mounted repo is owned by your host uid, not node's.
# user.name/email: a distinct name so container commits are legible in git log.
# .npmrc ignore-scripts: matches pnpm's default posture in case npm gets used. This is also
# why nothing load-bearing may live in an npm lifecycle script — see CLAUDE.md.
RUN git config --global --add safe.directory /workspace \
    && git config --global user.name "${GIT_USER_NAME}" \
    && git config --global user.email "${GIT_USER_EMAIL}" \
    && printf 'ignore-scripts=true\n' > /home/node/.npmrc
