# 🗺️ Project Roadmap: Football Club Management

## 📌 Phase 0: Infrastructure & Architecture (✅ COMPLETED)
- [x] **Monorepo Setup**: Initialize `backend/` (FastAPI) and `frontend/` (Next.js) directories.
- [x] **Database Setup**: Create Supabase project and configure PostgreSQL.
- [x] **Backend Architecture**:
    - [x] Implement 3-Layer Design (Repository - Service - API).
    - [x] **API Versioning**: Dynamic version reading from `pyproject.toml` (via `tomllib`).
    - [x] **Testing**: Setup `pytest` with in-memory SQLite for unit tests.
    - [x] **CORS**: Configure middleware for cross-origin requests.
- [x] **Dependency Management**: Setup `uv` for Python and `npm` for Node.js.
- [x] **Cloud Deployment (Hybrid)**:
    - [x] **Backend**: Deploy FastAPI to **Railway** (Persistent Container).
    - [x] **Frontend**: Deploy Next.js to **Vercel**.
    - [x] **Networking**: Connect Frontend (Vercel) to Backend (Railway) via ENV variables.

## 👤 Phase 1: Authentication & Member Management (✅ COMPLETED)
- [x] **Kakao Developers Setup**: Obtain API Keys and configure Redirect URIs.
- [x] **Supabase Auth**: Enable Kakao Login provider in Supabase Dashboard.
- [x] **Backend Member API**:
    - [x] Create `Member` Model (with `MemberStatus` Enum: PENDING, ACTIVE, REJECTED).
    - [x] Implement CRUD Endpoints (`GET`, `POST`, `PATCH`, `DELETE`).
    - [x] **Service Layer**: Implement "Get by Kakao ID" & "Auto-set Pending Status" logic.
- [x] **Frontend Auth Integration**:
    - [x] **Login Flow**: Implement "Log in with Kakao" button (Korean UI).
    - [x] **Auth Context**: Create `AuthProvider` to manage user session & backend sync.
    - [x] **Scope Handling**: Fix `KOE205` error by forcing `queryParams` for specific scopes.
- [x] **Approval Workflow (Gatekeeper)**:
    - [x] **Waiting Room**: Create `/pending` page for unapproved users.
    - [x] **Route Protection**: Redirect `pending` users away from Dashboard.
    - [x] **Dashboard**: Create basic `/dashboard` for active members.

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
    - [ ] **Scheduling Logic**: Auto-calculate `polling_start`, `soft_deadline`, and `hard_deadline`.
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
- [x] **Versioning**: Implement `get_app_version()` fallback logic.
- [x] **Unit Testing**: Create `tests/test_models.py` to safeguard Enum values.
- [ ] **Validation**: Add more complex Pydantic validators for date logic.
- [ ] **Security**: Secure Backend API with API Key (for Cron) and JWT Verification (for User actions).
- [ ] **UI/UX**: Polish the "Status Toggle" button (Join/Absent) for mobile friendliness.
