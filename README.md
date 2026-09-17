# CoopConnect — Digital Operating System for Cooperative Workforces

> **Tagline:** *Fair Work. Skilled Workers. Smarter Cooperatives.*
>
> Built for the **Smart India Hackathon (SIH)**.

---

## 1. Executive Summary & Vision

**CoopConnect** is a digital operating system engineered specifically for cooperative worker societies and federations. 

Unlike traditional aggregator platforms (such as Uber or Urban Company) that solely dispatch the physically nearest worker—often causing extreme worker burnout, income inequality, and zero skill transparency—**CoopConnect** introduces a multi-tier governance model:

1. ⭐ **Fair Work Allocation Engine:** A 5-factor weighted algorithm ($35\%$ Skill Match, $25\%$ Workload Equity, $20\%$ Availability, $10\%$ Proximity, $10\%$ Certification) that distributes jobs equitably while maintaining maximum service quality.
2. ⭐ **Dynamic Skill Bank:** Multi-tiered skill tracking (Beginner $	o$ Expert), verifiable trade credentials, and real-time workforce capacity metrics.
3. ⭐ **AI Demand Forecasting & Skill Gap Engine:** Scikit-learn regression models that analyze monthly historical demand across Chennai service hubs, identifying shortages and generating actionable training recommendations before surges occur.

---

## 2. Core Technological Innovations

### 🌟 1. Fair Work Allocation Engine
When a booking is made:
1. **Candidate Filtering:** Identifies active workers possessing the required `skill_id`, matching availability, and without active scheduling conflicts or rejections for this booking.
2. **Multi-Factor Scoring (0 to 100 Normalized):**
   $$	ext{Final Score} = (S_{	ext{skill}} 	imes 0.35) + (S_{	ext{workload}} 	imes 0.25) + (S_{	ext{avail}} 	imes 0.20) + (S_{	ext{dist}} 	imes 0.10) + (S_{	ext{cert}} 	imes 0.10)$$
3. **Workload Fairness:** Workers with fewer active jobs receive significantly higher workload scores, preventing single-worker monopolization and spreading earnings across the cooperative.
4. **Transparent Explainability:** Persists complete score breakdown and human-readable decision logic for every candidate in `allocation_results`.
5. **Worker Rejection & Auto-Reassignment:** If a worker declines, the booking transitions to `REASSIGNING`, blacklists the declining worker for this request, and automatically dispatches to the next best candidate.

### 🌟 2. Dynamic Skill Bank
- Hierarchical structure: Service Category $	o$ Service $	o$ Specific Skills.
- Worker Skill Profiles: Skill level (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`), verified status, years of experience, and verifiable certifications.

### 🌟 3. AI Demand Forecasting & Skill Gap Engine
- Historical booking aggregation across Chennai hubs (Anna Nagar, Tambaram, Ambattur, Avadi, Velachery, Adyar, T. Nagar, Guindy, Porur, Mylapore).
- Scikit-learn Ridge Regression predicting upcoming monthly volume and growth rates.
- **Skill Gap Detection:** Computes expected demand vs. available workforce capacity ($	ext{Available Workers} 	imes 	ext{Capacity per worker}$) to highlight critical shortages and training suggestions (e.g., *"Train 3 additional workers in Tank Installation for Anna Nagar"*).

---

## 3. Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React icons, Recharts, React Router v6.
- **Backend:** Python 3.10+, FastAPI, SQLAlchemy ORM, Pydantic v2, Python-Jose (JWT), Passlib / Bcrypt.
- **Database:** PostgreSQL with automated SQLite fallback for zero-config local execution.
- **Machine Learning & Analytics:** Scikit-learn, Pandas, NumPy.
- **Testing:** Pytest, HTTPX TestClient.

---

## 4. Default SIH Demo Accounts

All demo accounts use the standard password: `coopconnect123`

| Role | Email | Password | Persona & Key Capability |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@coopconnect.demo` | `coopconnect123` | Arun Sundaram — Workforce Intelligence & Allocation Inspector |
| **Worker** | `worker@coopconnect.demo` | `coopconnect123` | Kumar Swaminathan — Star Plumbing Specialist (Tank Installation Expert) |
| **Customer** | `customer@coopconnect.demo` | `coopconnect123` | Lakshmi Narayanan — Verified Consumer |

---

## 5. Quick Start & Execution Guide

### Prerequisites
- Node.js (v18+) & npm
- Python (3.10+) & pip

### Backend Setup
```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*The database automatically creates and seeds 30+ workers, 15+ customers, 20+ skills, and 125+ historical bookings on first launch.*

### Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 6. SIH Complete Demonstration Flow

1. **Explore the Landing Page (`/`):**
   - Review the Hero tagline, Traditional vs CoopConnect Architecture comparison, and the 3 Core Innovations.
2. **Customer Service Booking (`/customer/book`):**
   - Log in as Customer (`customer@coopconnect.demo`).
   - Select **Plumbing** $	o$ **Tank Installation**.
   - Select **Anna Nagar**, Date: **September 10**, Time: **10:00 AM**.
   - Click **Confirm & Dispatch Booking**.
   - The Fair Allocation Engine executes, immediately scoring qualified candidates and assigning Kumar with a top score of 92/100.
3. **Admin Allocation Inspection (`/admin/allocations`):**
   - Switch to Admin (`admin@coopconnect.demo`).
   - Open the **Allocation Inspector** to review the complete 5-factor radar and score breakdown explaining why Kumar was selected over Ravi and Mani.
4. **Worker Job Lifecycle (`/worker/jobs`):**
   - Switch to Worker (`worker@coopconnect.demo`).
   - Accept the pending assignment.
   - Click **Start Job (In Progress)** $	o$ **Mark Service Completed**.
5. **Customer Rating (`/customer/bookings`):**
   - Switch back to Customer $	o$ Rate the completed job 5.0 stars with feedback.
6. **Admin Demand Forecasting & Skill Gaps (`/admin/forecast` & `/admin/skill-gaps`):**
   - Inspect the Scikit-learn trend chart showing the surge in Plumbing demand for October 2026.
   - Inspect the **Skill Gap Shortage Alert** for Tank Installation with the actionable recommendation: *"Train and onboard 3 additional workers in Tank Installation before next month."*
7. **Chennai Demand Heatmap (`/admin/heatmap`):**
   - View topological booking clusters across Anna Nagar, Tambaram, Ambattur, and other hubs.
