# 🗺️ Project Roadmap: Football Club Management

## 📌 Phase 0: Infrastructure & Architecture (✅ COMPLETED)
- [x] **Monorepo Setup**: Initialize `backend/` (FastAPI) and `frontend/` (Next.js) directories.
- [x] **Database Setup**: Configure PostgreSQL with SQLAlchemy.
    - [x] **Resilience**: Implement `pool_pre_ping=True` for self-healing connections.
- [x] **Backend Architecture**:
    - [x] Implement 3-Layer Design (Repository - Service - API).
    - [x] **API Routing**: Fix route shadowing issues (`/members/me` vs `/members/{id}`).
    - [x] **CORS**: Configure middleware for cross-origin requests (`localhost` & `vercel`).
- [x] **Dependency Management**: Setup `uv` for Python and `npm` for Node.js.
- [x] **Cloud Deployment**: Backend on **Railway**, Frontend on **Vercel**.

## 👤 Phase 1: Authentication & Member Management (✅ COMPLETED)
- [x] **Authentication Overhaul (v0.2.0)**:
    - [x] **Remove Supabase**: Migrate to custom Backend JWT + Kakao Logic.
    - [x] **Kakao Integration**:
        - [x] Register JavaScript Key & Whitelist Domains (Localhost/Vercel).
        - [x] Implement Legacy V1 SDK for reliable Popup Login flow.
        - [x] **Backend Validation**: Verify Kakao Access Tokens server-side.
    - [x] **Frontend Auth Logic**:
        - [x] **Bulletproof AuthProvider**: Use `onLoad` strategy for SDK loading.
        - [x] **Traffic Controller**: Auto-redirect users to Dashboard upon login.
        - [x] **Session Management**: Handle `signOut` and Token persistence.
- [x] **Member API**:
    - [x] `Member` Model with `MemberStatus` Enum (PENDING, ACTIVE, REJECTED).
    - [x] Service Layer for "Get by Kakao ID" & "Auto-Registration".
- [x] **Approval Workflow**:
    - [x] **Waiting Room**: `/pending` page for unapproved users.
    - [x] **Route Protection**: Prevent "Infinite Loop" redirects on Dashboard.

## 🏢 Phase 2: Club & Membership Administration (✅ COMPLETED)
- [x] **Club Domain**: Create `Club` Model & CRUD Endpoints.
- [x] **Membership Domain**: `Membership` Model linking Member + Club + Year.

## ⚽ Phase 3: The Match Lifecycle & Participation (✅ COMPLETED)
- [x] **Match Management (Basic)**:
    - [x] Create `Match` Model (date, location, status).
    - [x] Implement Match Detail View.
- [x] **Participation System (Core)**:
    - [x] **Schema Standardization**: Enforce `UPPERCASE` Enums (`ATTENDING`, `ABSENT`, `PENDING`) across DB/API/Frontend.
    - [x] **Voting Logic**:
        - [x] **Soft Deadline**: Block `PENDING` votes after T-2 days.
        - [x] **Hard Deadline**: Block all voting at match start.
    - [x] **Frontend Integration**: Connect Vote Modal to Backend API with correct type safety.

## 📣 Phase 4: Match Management & Administration (👉 NEXT STEP)
- [ ] **Match Administration (Admin UI)**:
    - [ ] **Create/Edit Match**: Frontend form for Managers to schedule games.
    - [ ] **Match Templates**: Create `MatchTemplate` model for recurring games (e.g., "Tuesday Night Football").
    - [ ] **Scheduling Logic**: Auto-calculate `polling_start`, `soft_deadline`, and `hard_deadline` defaults.
- [ ] **Roster Management**:
    - [ ] **Manager Dashboard**: View "Who is coming" vs "Who is missing".
    - [ ] **Manual Override**: Allow Managers to forcefully set a member's status (e.g., if they text instead of using the app).

## 📢 Phase 5: The Announcer Interface & Sharing
- [ ] **Kakao Sharing**:
    - [ ] Implement Kakao Link v2 to send "Vote Now" cards to chat rooms.
    - [ ] **Deep Linking**: Ensure clicking the Kakao message opens the specific Match Detail modal.
- [ ] **Status Summary Card**:
    - [ ] Generate a text/image summary of the roster to paste into chat rooms.

## 🤖 Phase 6: Automation ("The Ghost Detector")
- [ ] **Cron Jobs**:
    - [ ] Setup Cron endpoint (`/api/cron/trigger`) to check deadlines.
    - [ ] **Ghost Detection**: Identify members who are `PENDING` after Soft Deadline.
    - [ ] **Auto-Alerts**: Send "Please Vote" reminders via Kakao (future scope).

---

## 🛠️ Technical Debt & Polish
- [ ] **UX Polish**: Add Toast Notifications (replace `alert()`) for success/error messages.
- [ ] **Validation**: Add stricter Pydantic validators for Match dates (e.g., `end_time` > `start_time`).
- [ ] **Security**: Secure Backend API with JWT Verification middleware for all sensitive routes.