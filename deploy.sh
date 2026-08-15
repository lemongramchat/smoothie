#!/usr/bin/env bash
set -euo pipefail

# Simple deploy helper for GitHub Pages.
# Usage:
#   ./deploy.sh <github-username> <repo-name>
# Examples:
#   ./deploy.sh alice alice.github.io   # user site -> pushes to main
#   ./deploy.sh alice grinder-game       # project site -> pushes to gh-pages branch

USER=${1:-}
REPO=${2:-}

if [ -z "$USER" ] || [ -z "$REPO" ]; then
  echo "Usage: $0 <github-username> <repo-name>"
  exit 2
fi

REMOTE_URL="git@github.com:${USER}/${REPO}.git"

if ! command -v git >/dev/null 2>&1; then
  echo "git is required"; exit 1
fi

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Using existing git repo"
else
  git init
fi

git add -A
git commit -m "Deploy site" || echo "Nothing to commit"

if ! git remote | grep origin >/dev/null 2>&1; then
  # try to create repo using gh if available
  if command -v gh >/dev/null 2>&1; then
    echo "Creating repo on GitHub using gh..."
    gh repo create ${USER}/${REPO} --public --source=. --remote=origin --push || true
  else
    echo "Adding remote ${REMOTE_URL} (make sure you have access)"
    git remote add origin ${REMOTE_URL}
  fi
fi

if [[ "${REPO}" == *".github.io" ]]; then
  echo "Detected user site; pushing to 'main' branch"
  git push -u origin main
  echo "Published: https://${USER}.github.io/"
else
  echo "Publishing to 'gh-pages' branch (project site)"
  # Create a temporary orphan branch with only current files, push, then return
  git checkout --orphan gh-pages
  git reset --hard
  git add -A
  git commit -m "Deploy to gh-pages"
  git push -f origin gh-pages
  git checkout -
  git branch -D gh-pages
  echo "Published: https://${USER}.github.io/${REPO}/"
fi
