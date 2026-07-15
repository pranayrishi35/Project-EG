# Privacy Policy

**Effective Date:** July 15, 2026

Welcome to **ExamPilot**. This Privacy Policy explains how ExamPilot ("we," "our," or "us") collects, uses, protects, and discloses your information when you use our EdTech SaaS platform designed for Indian defense exam preparation (AFCAT, NDA, CDS). As an organization, we are committed to respecting your privacy and protecting your personal data in alignment with industry best practices and global data protection principles.

---

## 1. Data Collection: Information We Collect

To provide you with highly personalized exam preparation tools, we collect specific, limited data points. 

### A. Personally Identifiable Information (PII)
- **Account Information:** We collect your Name and Email Address exclusively through Google OAuth during the registration and authentication process.

### B. Educational & Performance Data
- **User-Uploaded Content:** Syllabi, study materials, or related documents you upload to the platform.
- **Performance Metrics:** Your mock test scores, incorrect test answers, study plans, and historical performance tracking data.

### C. Financial Information
- We use a third-party payment processor, **Razorpay**, to handle transactions. ExamPilot does not directly collect or store your sensitive payment details (such as full credit card numbers or UPI PINs).

---

## 2. Data Minimization & Purpose Limitation

In strict adherence to OWASP privacy guidelines and the principle of data minimization, we only collect data that is strictly necessary for the operation of ExamPilot. 
- **Purpose Limitation:** Your data is used exclusively for generating personalized study plans, tracking your exam performance, providing our "Tactical Coach" analytics, and maintaining your account security. We do not sell your personal data to data brokers or third-party marketers.

---

## 3. Artificial Intelligence (AI) Processing

To deliver our advanced educational features, ExamPilot utilizes third-party Large Language Models (LLMs), specifically the **Google Gemini API**.
- **How it Works:** User-uploaded syllabi and data concerning incorrect test answers are securely transmitted to and processed by Google Gemini.
- **PII Sanitization & Limitations:** We employ a regex-based sanitization utility to strip structured personal identifiers (such as email addresses and phone numbers) from your inputs before they are sent to the Gemini API. However, please be aware that this automated filter cannot reliably catch unstructured personal information (such as your name typed in free-text). We strongly advise against uploading sensitive personal documents (e.g., identity cards) masquerading as syllabi.
- **Data Protection:** ExamPilot utilizes the standard Google Gemini Developer API. Data sent via these standard API keys is subject to Google's standard developer terms. 

---

## 4. Data Storage and Security

We employ enterprise-grade security architecture to ensure your data is protected against unauthorized access, alteration, or destruction.
- **Infrastructure & Server Logs:** All application data is securely stored in **Supabase** (PostgreSQL database) and hosted on **Vercel**. We also temporarily retain server and edge logs (which include IP addresses) for essential security, DDoS mitigation, and anti-fraud purposes.
- **Encryption:** Data at rest is protected using **AES-256 volume-level encryption**. Data in transit is secured via TLS/SSL protocols.
- **Access Control:** We enforce strict **Row Level Security (RLS)** in our database architecture. This ensures that users can only ever access or modify their own data, providing cryptographic-level isolation between tenant accounts.

---

## 5. Your User Rights

You retain full control over your personal data. ExamPilot provides you with the following rights, which you can exercise at any time:

### A. The Right to Access
You have the right to request a comprehensive copy of all personal and educational data ExamPilot holds about you. You can export this data directly from your account settings or by contacting our Data Privacy Officer.

### B. The Right to Delete (The Right to be Forgotten) & Backup Retention
You have the right to request the complete and permanent deletion of your account and all associated personal and educational data. Upon executing a deletion request, all active PII (Name, Email) and educational data will be permanently expunged from our production databases.
- **Backup Retention Disclosure:** For disaster-recovery purposes, ExamPilot maintains encrypted, point-in-time database backups for a rolling retention window of 7 days. During this window, your data may continue to exist within these backups; it is not accessed, processed, or used for any purpose other than restoring service in the event of a technical failure, and is automatically and permanently purged at the end of the retention window.

### C. Right to Nominate
You have the right to nominate another individual who shall, in the event of your death or incapacity, be entitled to exercise your rights under this Privacy Policy and applicable data protection law on your behalf. To register a nominee, please contact our Data Privacy Officer at privacy@exampilot.com.

---

## 6. Age Restriction

The Service is intended for use by individuals who are at least 18 years of age, or minors who have obtained verifiable parental consent. Please refer to Section 8 of our Terms of Service for our complete Age Restriction & Parental Consent policy.

---

## 7. Updates to this Policy

We may update this Privacy Policy periodically to reflect changes in our technology, legal requirements, or business practices. We will notify you of any material changes via email or a prominent notice on our platform prior to the changes taking effect.

---

## 8. Contact Us & Grievance Officer

For any questions, concerns, or requests related to this Privacy Policy or our data practices, please contact our Data Privacy Officer at:
**Email:** privacy@exampilot.com

In accordance with the Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology Rules, 2021, the details of our Grievance Officer are as follows:

**Name:** Grievance Officer
**Designation:** Grievance Officer
**Email:** grievance@exampilot.com
**Address:** ExamPilot Registered Office, Bengaluru, Karnataka, India

The Grievance Officer will acknowledge your complaint within 48 hours of receipt and endeavor to resolve it within one (1) month from the date of receipt, in accordance with applicable law.
