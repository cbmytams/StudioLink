#!/bin/bash
# Backup manuel Supabase - a lancer chaque lundi matin
# Usage: ./scripts/backup.sh

set -e

DATE=$(date +%Y%m%d_%H%M)
BACKUP_DIR="$HOME/studiolink-backups"
mkdir -p "$BACKUP_DIR"

echo "Backup StudioLink - ${DATE}"

# Export via Supabase CLI
if command -v supabase &> /dev/null; then
  supabase db dump \
    --linked \
    --file "${BACKUP_DIR}/studiolink_${DATE}.sql" \
    --data-only=false
  echo "Backup cree : ${BACKUP_DIR}/studiolink_${DATE}.sql"
else
  echo "Supabase CLI non installe"
  echo "Installe : npm install -g supabase"
  echo "Puis : supabase login && supabase link --project-ref [ref]"
fi

# Nettoyage : garde seulement les 4 derniers backups
ls -t "${BACKUP_DIR}"/*.sql 2>/dev/null | tail -n +5 | xargs -r rm
echo "Anciens backups nettoyes"

echo "Backup termine"
