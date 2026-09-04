#!/usr/bin/env bash
# Asserts the properties the devcontainer image is supposed to guarantee.
#
# Written when the base moved from node:24.20.0-bookworm-slim to Playwright's Ubuntu image.
# The risk in that move was never the Dockerfile — it was losing one of these quietly,
# because most of them are invisible until the day they matter. So they are a list a
# machine checks rather than a thing a person remembers.
#
# Run against a built image:
#     docker build -t judgy-dc .devcontainer && .devcontainer/verify-image.sh judgy-dc
#
# It does NOT check the devcontainer features layer (docker-in-docker), which is applied by
# the devcontainer CLI rather than by `docker build`. Verify that by rebuilding and running
# `docker ps` inside.
set -uo pipefail

IMAGE="${1:?usage: verify-image.sh <image>}"
failures=0

check() { # check <description> <expected> <command...>
  local desc="$1" expected="$2"
  shift 2
  local actual
  actual="$(docker run --rm --user node "$IMAGE" bash -lc "$*" 2>&1 | tr -d '\r')"
  if [[ "$actual" == "$expected" ]]; then
    printf 'ok    %-46s %s\n' "$desc" "$actual"
  else
    printf 'FAIL  %-46s expected %-18s got %s\n' "$desc" "$expected" "$actual"
    failures=$((failures + 1))
  fi
}

echo "verifying $IMAGE"
echo

# --- identity -------------------------------------------------------------------------
# remoteUser in devcontainer.json is `node`; uid 1000 matches the previous image so that
# ownership on the bind-mounted workspace is unchanged.
check "runs as node"                    "node"      'whoami'
check "node is uid 1000"                "1000"      'id -u'
check "workdir is the workspace"        "/workspace" 'pwd'
check "workspace is writable by node"   "writable"  'test -w /workspace && echo writable'

# --- the no-sudo posture --------------------------------------------------------------
# Load-bearing: the container is the security boundary for agent work in this repo. On the
# new base this is inherited from Playwright's image rather than arranged by us, which is
# exactly why it is asserted.
check "no sudo binary"                  "absent"    'command -v sudo >/dev/null && echo present || echo absent'
check "no su escalation to root"        "denied"    'su -c true root </dev/null >/dev/null 2>&1 && echo escalated || echo denied'

# --- toolchain ------------------------------------------------------------------------
check "node major"                      "v24"       'node -v | cut -d. -f1'
check "npm present"                     "yes"       'command -v npm >/dev/null && echo yes'
check "pnpm on PATH"                    "yes"       'command -v pnpm >/dev/null && echo yes'
check "claude on PATH"                  "yes"       'command -v claude >/dev/null && echo yes'
check "git present"                     "yes"       'command -v git >/dev/null && echo yes'
check "ripgrep present"                 "yes"       'command -v rg >/dev/null && echo yes'
check "jq present"                      "yes"       'command -v jq >/dev/null && echo yes'
check "less present"                    "yes"       'command -v less >/dev/null && echo yes'

# --- npm posture ----------------------------------------------------------------------
# Supply-chain guard. Also the reason nothing load-bearing may live in a lifecycle script;
# CLAUDE.md says so, and this is where the claim is actually true or not.
check "npm ignore-scripts is on"        "true"      'npm config get ignore-scripts'

# --- git identity ---------------------------------------------------------------------
check "git safe.directory set"          "/workspace" 'git config --global --get safe.directory'
check "git user.email set"              "yes"       '[ -n "$(git config --global --get user.email)" ] && echo yes'

# --- claude config --------------------------------------------------------------------
check "CLAUDE_CONFIG_DIR set"           "/home/node/.claude" 'echo $CLAUDE_CONFIG_DIR'
check "autoupdater disabled"            "1"         'echo $DISABLE_AUTOUPDATER'

# --- playwright, the reason for the new base -------------------------------------------
check "browsers path set"               "/ms-playwright" 'echo $PLAYWRIGHT_BROWSERS_PATH'
check "chromium readable by node"       "yes"       'test -x /ms-playwright/chromium-*/chrome-linux/chrome && echo yes'
check "headless shell readable by node" "yes"       'test -x /ms-playwright/chromium_headless_shell-*/chrome-linux/headless_shell && echo yes'

echo
if [[ $failures -eq 0 ]]; then
  echo "all checks passed"
else
  echo "$failures check(s) FAILED"
fi
exit $((failures > 0))
