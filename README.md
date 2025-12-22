# ⚽ Football Club Management System

> **A specialized Club Management SaaS for recreational football teams, designed to automate the chaos of attendance tracking on KakaoTalk.**

## 📖 Context: The Problem

Managing a recreational sports club involves a painful weekly ritual:

1. The manager asks "Who is coming?" in a group chat.
2. Members reply sporadically ("Join", "Maybe", "Can't go").
3. The manager manually copy-pastes names into a note, counting heads to see if there are enough players (11 vs 11).
4. People ghost the deadline, requiring manual tagging/nagging.

**Football Club** solves this by bridging a structured web database with the unstructured world of **KakaoTalk Group Chats**.

## 💡 The Solution: "Human-in-the-Loop" Automation

Unlike unstable "Chat Bots" that get blocked or require dedicated Android emulators, this system uses a **Proactive Announcer Workflow**:

1. **Scheduled Triggers:** The system calculates deadlines (Open Registration, Soft Deadline, Hard Deadline) automatically.
2. **Smart Notification:** instead of trying to post to Kakao directly (which is restricted), the system wakes up a designated **Match Manager (Announcer)** via Push/Web Notification.
3. **One-Tap Sharing:** The Manager opens the app to see a pre-generated "Status Report Card" (e.g., "10 Joined, 3 Missing") and taps **[Share to Kakao]**.
4. **Deep Linking:** Members click the card in Kakao to instantly toggle their status (Join/Absent) on the web app.

---

## ✨ Key Features

### 📅 Smart Scheduling & Deadlines

* **3-Phase Lifecycle:** Every match has three critical notification windows:
1. **Start Polling:** "Registration is Open" (Invite).
2. **Soft Deadline:** "Who is missing?" (Nudge).
3. **Hard Deadline:** "Final Roster" (Lock).


* **Recurring Templates:** Define "Every Tuesday at 8 PM" once, and the system generates matches automatically.

### 🎟️ Yearly Membership Enforcement

* **Gatekeeper Logic:** Users can only join matches if they have a valid, active `Membership` for the current year (e.g., 2025).
* **Renewal Flow:** Users must renew their membership annually to remain active in the system.

### 📊 Automated Stats

* **The "Ghost" Detector:** The system automatically calculates the list of "No Response" members by comparing the *Active Membership Roster* against the *Current Match Participants*.

---

## 🏗️ Architecture & Tech Stack

The application is designed as a **Serverless, Zero-Ops** system.

| Layer | Technology | Description |
| --- | --- | --- |
| **Frontend** | **Next.js** (React) | Hosted on Vercel. Handles UI and Kakao OG Tag generation. |
| **Backend** | **FastAPI** (Python) | Hosted on Vercel (Serverless Functions). |
| **Database** | **PostgreSQL** | Managed by **Supabase**. Stores all relational data. |
| **Auth** | **Supabase Auth** | Native **Kakao Login** integration. |
| **Package Mgr** | **uv** | Ultra-fast Python dependency management. |
| **Scheduler** | **GitHub Actions** | Triggers the Cron API endpoints every 10 mins. |

### Entity Relationship Diagram

*(See `docs/erd.png` or reference the project wiki for the full diagram)*

---

## 🚀 Getting Started

### Prerequisites

* Node.js 18+
* Python 3.12+
* `uv` (Installed via `curl -LsSf https://astral.sh/uv/install.sh | sh`)
* A Supabase Project

### 1. Installation

Clone the repo and install dependencies for both frontend and backend.

```bash
# Backend Setup
cd backend
uv sync

# Frontend Setup
cd ../frontend
npm install

```

### 2. Environment Setup

Create a `.env` file in both directories.

**Backend (`backend/.env`):**

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres"
CRON_SECRET="make_up_a_secure_random_string"

```

**Frontend (`frontend/.env.local`):**

```env
NEXT_PUBLIC_SUPABASE_URL="https://xyz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJh..."
NEXT_PUBLIC_KAKAO_CLIENT_ID="your_kakao_js_key"

```

### 3. Local Development

Run the frontend and backend in two separate terminals.

**Terminal 1 (Backend):**

```bash
cd backend
# Running with Vercel Dev or Uvicorn directly
uv run uvicorn app.main:app --reload

```

**Terminal 2 (Frontend):**

```bash
cd frontend
npm run dev

```

Visit `http://localhost:3000`.

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

Distributed under the MIT License.
