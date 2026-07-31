#!/bin/bash
# pg_dump_backup.sh
# 
# Purpose: Automated Point-in-Time database backup script using pg_dump.
# Intended to be run via a CI/CD cron job (e.g., GitHub Actions) or a dedicated cron server.
# 
# Environment Variables Required:
# - DATABASE_URL: Postgres connection string (e.g. postgres://postgres.[project]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres)
# - BACKUP_DIR (optional): Directory to store the output (defaults to ./backups)
# - S3_BUCKET (optional): S3 bucket to sync to, if AWS CLI is configured

set -e

echo "Starting automated database backup process..."

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set."
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="db_backup_${TIMESTAMP}.sql"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

echo "Dumping database to ${FILEPATH}..."
# Using --clean --if-exists to make it easy to restore over an existing scratch DB
pg_dump --clean --if-exists --no-owner --no-privileges "$DATABASE_URL" > "$FILEPATH"

echo "Backup successful! File size:"
ls -lh "$FILEPATH"

if [ -n "$S3_BUCKET" ]; then
  echo "Syncing to remote S3 bucket: $S3_BUCKET..."
  # If AWS CLI is configured
  # aws s3 cp "$FILEPATH" "s3://${S3_BUCKET}/backups/${FILENAME}"
  echo "S3 Sync simulated (AWS CLI not invoked in this script)."
fi

echo "Backup process completed."
