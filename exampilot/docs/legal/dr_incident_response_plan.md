# Disaster Recovery & Incident Response Plan

**Project:** ExamPilot Platform  
**Owner:** Principal Security Architect & Data Governance Officer  
**Date:** July 15, 2026  

---

## 1. Incident Response Protocol

This protocol defines our immediate, step-by-step actions for mitigating critical system incidents.

### Scenario A: Supabase Database Outage
**Trigger:** Database connection timeouts, failed R/W operations reported by Vercel edge functions.
**Response Steps:**
1. **Verify Status:** Check the Supabase status page and internal Datadog metrics to confirm a database-level outage vs. an application networking error.
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

### A. Point-in-Time Recovery (PITR) Strategy
ExamPilot relies heavily on **Supabase's Point-in-Time Recovery (PITR)** infrastructure to protect against accidental data deletion or corruption (e.g., a botched migration).
- PITR allows us to restore the entire database state to any exact second within our backup retention window.

### B. Restoring Critical Tables
In the event that specific tables (such as `mock_attempts` and `question_bank`) are corrupted, we execute the following procedure:
1. **Spin up a Recovery DB:** Provision a parallel Supabase project restored to a PITR timestamp immediately preceding the corruption event.
2. **Extract Data:** Use `pg_dump` to export the pristine `mock_attempts` and `question_bank` tables from the recovery database.
3. **Restore to Production:** Safely apply the exported SQL dump to the production database, verifying foreign key constraints and RLS policies remain intact. 

> [!IMPORTANT]
> **Data Loss Window:** Users who submitted mock attempts between the PITR timestamp and the corruption event will lose that specific data. Communication protocols must be initiated to inform affected users.

---

## 3. Infrastructure Stability: The Circuit Breaker

To prevent our own scalable serverless architecture from overwhelming our database or third-party APIs (self-inflicted DDoS), we implement a strict circuit breaker pattern.

> [!TIP]
> **30-Second Exponential Backoff Circuit Breaker**
> - If Vercel functions detect three consecutive connection timeouts or 5xx errors from either Supabase or the Gemini API, the circuit breaker **trips open**.
> - Once tripped, all subsequent requests to the failing service instantly return a 503 Service Unavailable to the client to shed load.
> - The system waits for an initial 30 seconds before allowing a single "probe" request through (half-open state). 
> - If the probe fails, the wait time increases exponentially (60s, 120s, up to 5 minutes) before the next probe. If it succeeds, the circuit closes and normal traffic resumes.
