# Disaster Recovery & Incident Response Plan

**Project:** Jishnu Platform  
**Owner:** Principal Security Architect & Data Governance Officer  
**Date:** July 15, 2026  

---

## 1. Incident Response Protocol

This protocol defines our immediate, step-by-step actions for mitigating critical system incidents.

### Scenario A: Supabase Database Outage
**Trigger:** Database connection timeouts, failed R/W operations reported by Vercel edge functions.
**Response Steps:**
1. **Verify Status:** Check the Supabase status page and Sentry dashboard metrics to confirm a database-level outage vs. an application networking error.
2. **Enable Maintenance Mode:** Toggle the Vercel environment variable `NEXT_PUBLIC_MAINTENANCE_MODE=true` to gracefully degrade the UI for users and halt all database write attempts.
3. **Escalate:** Open an urgent support ticket with Supabase if the outage is internal to their infrastructure.
4. **Monitor & Resume:** Once Supabase signals stability, perform a rolling health check on read/write endpoints before disabling Maintenance Mode.

### Scenario B: Vercel DDoS Attack
**Trigger:** Massive spike in edge requests, 429 Too Many Requests errors, or billing alert spikes.
**Response Steps:**
1. **Vercel Edge Shield:** Activate Vercel's "Attack Mode" within the Vercel dashboard to enforce aggressive CAPTCHA/JavaScript challenges on all incoming traffic.
2. **Analyze Traffic Patterns:** Review Vercel Edge Logs to identify malicious IP ranges or specific user-agents.
3. **Block IPs:** Implement custom Vercel Edge Middleware rules to drop traffic from identified malicious subnets immediately.
4. **Throttle API Routes:** Lower the global rate limits on high-intensity API routes (especially the Gemini AI generation routes) to protect backend infrastructure.

### Scenario C: Suspected Data Breach
**Trigger:** Unauthorized anomalous database queries, unexpected RLS bypasses, leaked credentials, or any reasonable suspicion of a personal-data breach.
**Response Steps:**
1. **Containment:** Immediately revoke all active Supabase Auth sessions (force global logout) and rotate all Supabase database passwords, service role keys, and API keys.
2. **Isolation:** Disable all external API integrations (including Gemini API) to prevent data exfiltration.
3. **Investigation:** Audit the Supabase `pg_stat_activity` and Vercel logs to identify the intrusion vector and extent of accessed data.
4. **Notification:** Upon reasonable suspicion of a personal-data breach, notify legal counsel immediately to begin the two-tier reporting structure mandated by the DPDP Rules, 2025: an initial notification to the Data Protection Board of India, followed by a fuller report within the required timeframe, as well as notification to affected users.

---

## 2. Disaster Recovery Plan

The Disaster Recovery plan ensures business continuity and data integrity in the event of catastrophic data corruption.

### A. Automated Daily Backups
Jishnu utilizes an automated database backup script (`scripts/pg_dump_backup.sh`) scheduled via GitHub Actions.
- This script connects via the `DATABASE_URL` (Postgres connection string) and performs a full schema and data dump to a timestamped `.sql` file.
- These `.sql` files are retained as GitHub Actions artifacts (and optionally synced to an off-site S3 bucket) providing a 7-day rolling window of database snapshots.
- *Note:* Supabase also natively provides automatic backups on Pro plans, serving as a secondary recovery mechanism.

### B. Restoring Critical Tables
In the event that specific tables (such as `mock_attempts` and `question_bank`) are corrupted, we execute the following procedure:
1. **Locate Backup:** Download the most recent pristine `.sql` backup file from GitHub Actions artifacts or S3.
2. **Spin up a Recovery DB:** Provision a temporary scratch Postgres database.
3. **Extract Data:** Restore the `.sql` dump into the scratch database, and use `pg_dump` to extract the specific uncorrupted tables.
4. **Restore to Production:** Safely apply the exported SQL to the production database, verifying foreign key constraints and RLS policies remain intact. 

> [!IMPORTANT]
> **Data Loss Window:** Users who submitted mock attempts between the last successful daily backup and the corruption event will lose that specific data. Communication protocols must be initiated to inform affected users.

---


