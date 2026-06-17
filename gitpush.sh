#!/usr/bin/env bash
set -uo pipefail
cd /home/runner/workspace

git config user.email "agent@replit.local" >/dev/null 2>&1 || true
git config user.name "Replit Agent" >/dev/null 2>&1 || true
rm -f .git/index.lock 2>/dev/null || true

# Stage ONLY the source files we intend to change (never build artifacts like api/_template.js)
git add artifacts/growitbuddy/src/lib/footerDefaults.ts artifacts/growitbuddy/src/lib/navbarDefaults.ts artifacts/growitbuddy/src/lib/homeDefaults.ts 2>/dev/null || true

if git diff --cached --quiet; then
  echo "[gitpush] no staged source changes -> empty retrigger commit"
  GIT_EDITOR=true git commit --allow-empty -m "${COMMIT_MSG:-chore: retrigger Vercel deploy}"
else
  GIT_EDITOR=true git commit -m "${COMMIT_MSG:-chore: update content defaults}"
fi

echo "[gitpush] pushing to origin main..."
GIT_TERMINAL_PROMPT=0 git \
  -c core.askpass= \
  -c credential.helper= \
  -c credential.helper='!f() { echo username=x-access-token; echo "password=$GITHUB_TOKEN"; }; f' \
  push origin main

echo "[gitpush] push exit code: $?"
git --no-optional-locks log --oneline -3
echo "[gitpush] DONE"
