# ExamPilot 🚀

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_&_Auth-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-AI_Engine-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**ExamPilot** is a production-grade, highly performant EdTech SaaS designed specifically for Indian students preparing for defense exams (AFCAT, CDS, NDA). 

Built to solve the habit-collapse and planning paralysis of competitive exam preparation, ExamPilot transforms raw syllabi into personalized study plans and provides a highly authentic, offline-resilient Computer-Based Test (CBT) engine that mimics real C-DAC/EdCIL testing portals.

---

## 📑 Table of Contents
- [Core Features](#-core-features)
- [Tech Stack](#-tech-stack)
- [System Architecture & Performance](#-system-architecture--performance)
- [Database Schema](#-database-schema)
- [Getting Started (Local Setup)](#-getting-started-local-setup)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Core Features

* **🤖 AI-Driven Study Planner:** Users upload their syllabus, and the Gemini API (3.1-flash-lite) processes it to generate an adaptive, day-by-day study schedule.
* **🎯 Authentic CBT Simulator:** A 1:1 replica of official defense exam portals. Features a 120-minute timer, a strict 5-state question palette (unvisited, unanswered, answered, marked, answered_and_marked), and authentic +3/-1 scoring logic.
* **📶 Offline-Resilient PWA:** Built as a Progressive Web App utilizing `@ducanh2912/next-pwa`. If the internet drops during a 120-minute exam, users can continue flawlessly. Answers auto-sync to the database in the background once the connection is restored.
* **🧠 Post-Mission Analytics (AI Coach):** Upon completing a mock test, the AI Tactical Coach analyzes the user's incorrect answers and generates a concise, 3-step action plan to target critical weaknesses.
* **📰 Daily Defense News Feed:** A mobile-optimized, vertical-swipe defense news feed built with native CSS snap scrolling (no heavy carousel libraries) for daily current affairs updates.
* **🛡️ Secure Admin Command Center:** A zero-day protected command center allowing administrators to dynamically route AI models, view system insights, and utilize a chunked bulk-question generator to securely seed the database.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
* **Backend & Auth:** Supabase (PostgreSQL, Google OAuth, Row Level Security)
* **AI Engine:** Google Gemini API (`gemini-3.1-flash-lite` and `gemini-1.5-flash`)
* **Hosting & Delivery:** Vercel (Edge network, Server Actions)
* **Testing:** Playwright (Automated E2E Testing)

---

## 🏗️ System Architecture & Performance

ExamPilot is engineered to withstand highly volatile traffic patterns with zero operational downtime:

* **Aggressive UI Memoization & Dual-State Ref Pattern:** To prevent React render waterfalls in the 100-question CBT engine, the grid utilizes `useMemo`, and all interactive handlers use `useCallback` with strict functional state updates. The UI thread is completely decoupled from the network thread to prevent stale closures and input lag.
* **Database Indexing:** Optimized B-Tree composite indexes and GIN indexes eliminate sequential scans, ensuring sub-millisecond query lookups across user histories and the question bank.
* **Materialized View Leaderboards:** Calculates real-time All-India Rankings using `pg_cron` and a `get_instant_rank` RPC function, bypassing heavy `COUNT()` queries across the main transactional database.
* **Circuit Breaker Protection:** Background sync features a 30-second exponential backoff mechanism. If Supabase throws a 500 or constraint error, the sync pauses to prevent Vercel Edge function DDoS attacks.

---

## 🗄️ Database Schema

The platform relies on a strict Supabase PostgreSQL architecture guarded by comprehensive **Row Level Security (RLS)** policies:

- `user_profiles`: Manages credits (default 50), streaks, and basic user data.
- `admin_whitelist`: The absolute source of truth for admin rights.
- `news_cache`: Stores fetched defense news and AI-generated MCQs.
- `question_bank`: Stores all mock test questions (standard and PYQs).
- `mock_attempts`: Tracks historical tests (Features a composite Unique Constraint on `user_id`, `exam_target`, `test_number` to prevent network-latency duplication).

---


🤝 Contributing
Contributions are always welcome! Please follow these steps:

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

📝 License

Distributed under the MIT License. See LICENSE for more information.
