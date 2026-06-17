#!/usr/bin/env bash
set -uo pipefail
cd /home/runner/workspace

git config user.email "agent@replit.local" >/dev/null 2>&1 || true
git config user.name "Replit Agent" >/dev/null 2>&1 || true
rm -f .git/index.lock 2>/dev/null || true

# Retrigger-only: do NOT stage working-tree changes (avoid committing build artifacts).
# HEAD already contains the footer change; an empty commit nudges Vercel to build it.
GIT_EDITOR=true git commit --allow-empty -m "${COMMIT_MSG:-chore: retrigger Vercel deploy}"

echo "[gitpush] pushing to origin main..."
GIT_TERMINAL_PROMPT=0 git \
  -c core.askpass= \
  -c credential.helper= \
  -c credential.helper='!f() { echo username=x-access-token; echo "password=$GITHUB_TOKEN"; }; f' \
  push origin main

echo "[gitpush] push exit code: $?"
git --no-optional-locks log --oneline -4
echo "[gitpush] DONE"
