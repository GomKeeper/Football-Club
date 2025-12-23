# 🗺️ Project Roadmap: Football Club Management

## 📌 Phase 0: Infrastructure & Architecture (✅ COMPLETED)
- [x] **Monorepo Setup**: Initialize `backend/` (FastAPI) and `frontend/` (Next.js) directories.
- [x] **Database Setup**: Create Supabase project and configure PostgreSQL.
- [x] **Backend Architecture**: Implement 3-Layer Design (Repository - Service - API).
- [x] **Dependency Management**: Setup `uv` for Python and `npm` for Node.js.
- [x] **Cloud Deployment (Hybrid)**:
    - [x] **Backend**: Deploy FastAPI to **Railway** (Persistent Container).
    - [x] **Frontend**: Deploy Next.js to **Vercel**.
    - [x] **Networking**: Connect Frontend (Vercel) to Backend (Railway) via ENV variables.

## 👤 Phase 1: Authentication & Member Management (🚧 IN PROGRESS)
- [x] **Kakao Developers Setup**: Obtain API Keys and configure Redirect URIs.
- [x] **Supabase Auth**: Enable Kakao Login provider in Supabase Dashboard.
- [x] **Backend Member API**:
    - [x] Create `Member` Model & Table.
    - [x] Implement CRUD Endpoints (`GET`, `POST`, `PATCH`, `DELETE`).
    - [x] **Service Layer**: Implement "Get by Kakao ID" logic.
- [ ] **Frontend Auth Integration**:
    - [ ] Implement "Log in with Kakao" button using Supabase Auth Helper.
    - [ ] Create `AuthContext` to manage user session state.
    - [ ] **Auto-Registration**: Call Backend `POST /members` API upon first login to sync data.

## 🏢 Phase 2: Club & Membership Administration (✅ COMPLETED)
- [x] **Club Domain**:
    - [x] Create `Club` Model.
    - [x] Implement CRUD Endpoints.
- [x] **Membership Domain**:
    - [x] Create `Membership` Model (linking Member + Club + Year).
    - [x] **Business Logic**: Prevent duplicate memberships for the same year.
    - [x] Implement CRUD Endpoints.

## ⚽ Phase 3: The Match Lifecycle (👉 NEXT STEP)
- [ ] **Match Templates**:
    - [ ] Create `MatchTemplate` Model (for recurring games like "Tuesday Night Football").
    - [ ] Endpoint to create/manage templates.
- [ ] **Match Management**:
    - [ ] Create `Match` Model (date, location, status).
    - [ ] Implement `POST /matches` (Generate a match from a template).
    - [ ] **Scheduling Logic**: Auto-calculate `polling_start`, `soft_deadline`, and `hard_deadline` based on match time.
- [ ] **Participation System**:
    - [ ] Create `Participant` Model (Member + Match + Status).
    - [ ] Implement `POST /matches/{id}/join` and `POST /matches/{id}/leave`.
    - [ ] **Restriction Logic**: Only allow members with *Active 2025 Membership* to join.

## 📣 Phase 4: The Announcer Interface (Manager View)
- [ ] **Manager Dashboard**:
    - [ ] Frontend page for the "Announcer" (Manager) to see upcoming matches.
    - [ ] **Status Card**: A visual summary component (e.g., "10/18 Joined").
- [ ] **Kakao Sharing**:
    - [ ] Implement Kakao JS SDK to generate "Feed Messages".
    - [ ] Deep Linking: Ensure clicking the Kakao message opens the specific Match page.

## 🤖 Phase 5: Automation & Notifications ("The Ghost Detector")
- [ ] **Cron Jobs**:
    - [ ] Setup Cron endpoint (`/api/cron/trigger`) to check for upcoming deadlines.
    - [ ] **Phase 1 (Polling)**: Notify Manager to start recruiting.
    - [ ] **Phase 2 (Soft Deadline)**: Identify "Ghosts" (Members who haven't replied) and notify Manager.
    - [ ] **Phase 3 (Hard Deadline)**: Finalize roster.
- [ ] **Stats & Logs**:
    - [ ] Create `NotificationLog` to track which alerts have been sent.

---

## 🛠️ Technical Debt & Polish
- [ ] **Validation**: Add Pydantic validators for detailed error messages.
- [ ] **Security**: Secure Backend API with API Key (for Cron) and JWT Verification (for User actions).
- [ ] **UI/UX**: Polish the "Status Toggle" button (Join/Absent) for mobile friendliness.