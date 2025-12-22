# 📅 Football Club - Project Roadmap

This document outlines the development plan for the "Football Club" application. The goal is to build a "Club Management System" with a specific focus on automating KakaoTalk participation tracking via a "Human-in-the-Loop" Announcer workflow.

## 🏗️ Phase 0: Infrastructure & Initialization

*Goal: Get the "Hello World" stack running on Vercel and connected to Supabase.*

* [x] **Repository Setup**
* [ ] Initialize Monorepo (or separate `frontend`/`backend` folders).
* [ ] Set up `uv` for Python dependency management.
* [ ] Set up `Next.js` with TypeScript & Tailwind CSS.


* [ ] **Supabase Setup**
* [ ] Create Supabase Project.
* [ ] Get `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
* [ ] Configure **Kakao Login** in Supabase Auth (Authentication -> Providers).


* [ ] **Vercel Deployment**
* [ ] Create Vercel Project.
* [ ] Connect GitHub Repo.
* [ ] Configure Environment Variables (`DATABASE_URL`, `CRON_SECRET`, etc.).
* [ ] **Milestone:** Deploy a "Hello World" FastAPI endpoint and a Next.js homepage that talks to it.



## 🔐 Phase 1: Core Domain & Authentication

*Goal: Users can log in via Kakao and Administrators can manage Members/Memberships.*

* [ ] **Backend (Data Models)**
* [ ] Define `Club`, `Member`, `Membership` entities in `SQLModel`.
* [ ] Implement Membership Logic: `Yearly` scope (e.g., 2025).


* [ ] **Authentication Flow**
* [ ] Frontend: Implement `supabase.auth.signInWithOAuth({ provider: 'kakao' })`.
* [ ] Backend: Middleware to verify Supabase JWT token on protected routes.
* [ ] **Auto-Registration:** On first login, automatically create a `Member` row using Kakao profile data (Avatar, Nickname).


* [ ] **Admin Dashboard (Basic)**
* [ ] UI to View/Approve `Memberships` (Pending -> Active).
* [ ] **Milestone:** A user can log in, and an Admin can see them in the database.



## ⚽ Phase 2: Match Management & Scheduling Engine

*Goal: Create the "Events" and the logic that generates them.*

* [ ] **Backend (Match Logic)**
* [ ] Define `Match` and `MatchTemplate` entities.
* [ ] Implement CRUD API for Matches.
* [ ] Implement "Template Generator": Logic to create `Match` instances from `MatchTemplate` (handling recurring logic).

* [ ] **The 3-Phase Scheduler Logic**
* [ ] Add columns for `start_polling_at`, `soft_deadline`, `hard_deadline`.
* [ ] Create the **Cron Endpoint** (`/api/cron/check-deadlines`):
* [ ] Logic: Query matches that hit a deadline window -> Create `NotificationLog`.


* [ ] **Infrastructure (Scheduler)**
* [ ] Set up **GitHub Actions Workflow** to `curl` the Vercel Cron endpoint every 10 minutes (Free tier workaround).


## 📢 Phase 3: The "Announcer" Workflow

*Goal: The core USP. Enabling the "Match Manager" to share reports to Kakao.*

* [ ] **Participation Logic**
* [ ] API: `POST /matches/{id}/join` (Validates Membership Year).
* [ ] API: `GET /matches/{id}/stats` (Calculates Joined vs. Missing vs. Absent).

* [ ] **Announcer Dashboard UI**
* [ ] Create "My Tasks" view for the Announcer.
* [ ] **State Machine UI:**
* [ ] If Phase 1 (Polling): Show "Open Registration" card preview.
* [ ] If Phase 2 (Soft): Show "Missing Members" list.
* [ ] If Phase 3 (Hard): Show "Final Roster".


* [ ] **Kakao Share Integration**
* [ ] Register "Custom Templates" in Kakao Developers Console (Invite Card, Report Card).
* [ ] Implement `Kakao.Share.sendCustom` in React.


## 💅 Phase 4: Polish & Notifications

*Goal: Improving UX and reliability.*

* [ ] **Web Push Notifications (Optional but Recommended)**
* [ ] Integrate Firebase Cloud Messaging (FCM) or Vercel specific push library.
* [ ] Send "Wake up" push to Announcer when Cron triggers.

* [ ] **User Profile**
* [ ] "My History" view (Matches played, Attendance rate).

* [ ] **Final Testing**
* [ ] Test "Year Transition" (e.g., 2024 member tries to join 2025 match).
* [ ] Test "Announcer Delay" (What if they post 2 hours late?).

---

## 🛠️ Tech Stack Reference

| Component | Technology | Hosting |
| --- | --- | --- |
| **Frontend** | Next.js (React 18+), Tailwind CSS | Vercel |
| **Backend** | Python 3.12, FastAPI, SQLModel | Vercel (Serverless) |
| **Package Mgr** | `uv` | N/A |
| **Database** | PostgreSQL | Supabase |
| **Auth** | Supabase Auth (Kakao) | Supabase |
| **Scheduler** | GitHub Actions (Cron) | GitHub |

## 📐 Entity Relationship Diagram (ERD) Reference

erDiagram

    CLUB {
        int id PK
        string name
        string emblem_url
    }

    MEMBER {
        int id PK
        string kakao_id UK "Critical for Auth"
        string name
        jsonb roles "e.g. ['admin', 'viewer']"
    }

    MEMBERSHIP {
        int id PK
        int member_id FK
        int club_id FK
        int year "e.g. 2025"
        enum status "active, pending, suspended"
    }

    MATCH_TEMPLATE {
        int id PK
        string title
        string cron_schedule "e.g. Every Monday 8pm"
        int polling_lead_days "Phase 1 timing"
        int soft_deadline_lead_days "Phase 2 timing"
        int hard_deadline_lead_days "Phase 3 timing"
    }

    MATCH {
        int id PK
        int template_id FK "Optional"
        int manager_id FK "The assigned Announcer"
        datetime starts_at
        datetime start_polling_at "Phase 1 Trigger"
        datetime soft_deadline "Phase 2 Trigger"
        datetime hard_deadline "Phase 3 Trigger"
    }

    PARTICIPANT {
        int id PK
        int match_id FK
        int member_id FK
        enum status "join, absent, tbd"
        string message
    }

    NOTIFICATION_LOG {
        int id PK
        int match_id FK
        int sent_by_member_id FK "Who clicked the button"
        enum type "polling, soft, hard"
        datetime sent_at
    }

    %% Relationships
    CLUB ||--|{ MEMBER : "has base roster"
    CLUB ||--|{ MEMBERSHIP : "issues yearly access"
    MEMBER ||--|{ MEMBERSHIP : "holds yearly status"
    
    MATCH_TEMPLATE ||--o{ MATCH : "generates recurring"
    
    MEMBER ||--o{ MATCH : "manages (as Announcer)"
    MEMBER ||--o{ PARTICIPANT : "registers status"
    MATCH ||--|{ PARTICIPANT : "has roster"
    
    MATCH ||--o{ NOTIFICATION_LOG : "tracks lifecycle phases"
    MEMBER ||--o{ NOTIFICATION_LOG : "executes share action"

## 🚀 Deployment Checklist

* [ ] `KAKAO_CLIENT_ID` (Supabase & Frontend)
* [ ] `DATABASE_URL` (Backend)
* [ ] `CRON_SECRET` (Backend & GitHub Secrets)
* [ ] `NEXT_PUBLIC_API_URL` (Frontend)
