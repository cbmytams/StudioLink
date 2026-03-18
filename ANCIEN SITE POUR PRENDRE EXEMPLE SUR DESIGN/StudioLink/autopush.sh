#!/bin/bash

BRANCH="main"
REPO_DIR="$(pwd)"

echo "👀 Surveillance active sur : $REPO_DIR"
echo "🚀 Auto-push vers origin/$BRANCH"
echo "--- Ctrl+C pour arrêter ---"

fswatch -0 --recursive \
  --exclude '\.git/' \
  --exclude 'node_modules/' \
  --exclude '\.next/' \
  --exclude '\.swp$' \
  "$REPO_DIR" | while read -d "" event; do

  sleep 1  # attend que tous les fichiers soient sauvegardés

  git add -A

  # vérifie s'il y a vraiment des changements
  if ! git diff-index --quiet HEAD 2>/dev/null; then
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    git commit -m "Auto-commit: $TIMESTAMP"
    git push origin "$BRANCH"
    echo "✅ Push effectué à $TIMESTAMP"
  fi

done
