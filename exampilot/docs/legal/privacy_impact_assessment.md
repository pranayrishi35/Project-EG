# Internal Privacy Impact Assessment (PIA)

**Project:** ExamPilot Platform  
**Owner:** Principal Security Architect & Data Governance Officer  
**Date:** July 15, 2026  

---

## 1. Executive Summary
This Privacy Impact Assessment (PIA) evaluates the data lifecycle and privacy risks associated with the ExamPilot EdTech SaaS platform. Our architecture utilizes a Next.js frontend hosted on Vercel Edge, a Supabase PostgreSQL backend, and external integrations with the Google Gemini API. This document focuses heavily on protecting Personally Identifiable Information (PII) and mitigating risks tied to third-party LLM processing.

---

## 2. Data Catalog
The following data elements are collected, processed, and stored within the ExamPilot ecosystem:

- **Identifiable Data (PII):** 
  - User Full Name (via Google OAuth)
  - User Email Address (via Google OAuth)
- **Educational / Sensitive Data:**
  - Uploaded Examination Syllabi
  - Historical Mock Test Scores and Answers
  - System-generated Study Plans

---

## 3. Data Flow Architecture

The data flow from the end-user to persistent storage and third-party processing is strictly governed:

1. **Client Interaction:** User interacts with the Next.js client application (browser).
2. **Transport Layer:** Data is transmitted securely via TLS 1.3 to the Vercel Edge network.
3. **Authentication & API Gateway:** Vercel serverless functions handle API requests and validate Supabase Auth JWTs.
4. **Persistent Storage:** Authorized requests write/read data to the Supabase PostgreSQL database, utilizing Row Level Security (RLS) to enforce tenant isolation.
5. **AI Processing:** Only authorized Vercel serverless backend routes communicate with the Google Gemini API. **Direct client-to-Gemini communication is strictly prohibited.**

---

## 4. Third-Party Risk Assessment: Google Gemini API

Our "Tactical Coach" relies on the Google Gemini API to parse syllabi and incorrect test answers to generate actionable study plans. 

### Identified Privacy Risks
- **Accidental PII Exposure:** Sending un-sanitized prompts containing user names or emails to the LLM.
- **Model Training:** The risk of user intellectual property (uploaded syllabi) being used to train public LLM models.

### Mitigation Strategies

> [!CAUTION]
> **PII Stripping Protocol:** ExamPilot employs a regex-based `sanitizePrompt()` utility before Vercel backend routes dispatch payloads to the Gemini API.
> - This utility reliably strips structured identifiers, specifically **email addresses** and **phone numbers**, replacing them with `[REDACTED_EMAIL]` and `[REDACTED_PHONE]`.
> - **Limitation Acknowledgment:** This regex layer does **not** reliably catch unstructured PII, such as free-text names (e.g., "Rahul" or "Priya Sharma") that a user might type into the chat box. Full name-redaction would require a complex Named Entity Recognition (NER) approach, which is scoped for a future improvement.

- **Standard Developer API Usage:** ExamPilot utilizes the standard Google Gemini Developer API. We do not currently have a negotiated Vertex AI enterprise agreement. While we take steps to limit the exposure of PII, data sent via standard API keys is subject to Google's standard developer terms. We recommend users do not upload highly sensitive personal documents (e.g., identity cards) masquerading as syllabi.
