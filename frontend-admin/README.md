# 🛡️ MargRakshak Admin Portal (`frontend-admin`)

Next.js 14 administrative management dashboard for government officials, department heads, and field officers to triage, assign, update, and resolve reported road hazards.

---

## 🚀 Key Features

- **Executive Analytics Dashboard:** Visual trends, severity breakdowns, resolution turnaround rates, and city heatmaps rendered with Recharts.
- **Report Lifecycle Management:** Full triage controls to move hazards across statuses:
  `submitted` ➔ `under_review` ➔ `in_progress` ➔ `resolved` / `rejected`.
- **Department & Officer Assignment:** Allocate issues to specific field officers or departments (e.g., PWD, Municipal Corporation, Electricity Board).
- **Official Citizen Responses:** Post verified updates and remediation photos directly back to citizen report views.
- **Immutable Audit Trail:** Complete audit logging tracking every status change, assignment, and action taken by admins.
- **Role-Based Access Control (RBAC):**
  - `super_admin`: Full system control and user/admin administration.
  - `department_head`: Triage, assignment, and status updates for department.
  - `field_officer`: On-ground status updates and remediation comments.
  - `viewer`: Read-only access for monitoring and audits.

---

## 📁 Directory Structure

```
frontend-admin/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Root redirection to dashboard or login
│   │   ├── login/                    # Administrative login with role check
│   │   └── dashboard/
│   │       ├── page.tsx              # Analytics dashboard & summary KPI cards
│   │       ├── reports/              # Triage table with multi-filter search
│   │       │   └── [id]/page.tsx     # Single report inspector & status control
│   │       └── audit/                # Immutable audit log inspection
│   ├── components/
│   │   ├── ThemeToggle.tsx           # Dark/Light theme mode switch
│   │   └── ThemeProvider.tsx         # Next-themes provider
│   ├── lib/
│   │   └── api.ts                    # Admin Axios HTTP client with Bearer auth
│   └── store/
│       └── authStore.ts              # Admin state & session persistence
└── tailwind.config.js                # Government styling palette
```

---

## 🔒 Environment Variables

Create `.env.local` by copying `.env.example`:

```bash
cp .env.example .env.local
```

### Reference (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🔑 Default Administrator Credentials

- **Portal URL:** [http://localhost:3001/login](http://localhost:3001/login)
- **Official Email / Admin ID:** `admin.gov.in` *(also accepts `admin@gov.in`)*
- **Password:** `admin123`
- **Role:** Super Admin (`super_admin`)

*(If needed, execute `node backend/create_admin.js` to seed or re-hash the account).*

---

## 🛠️ Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Next.js Development Server (Port 3001)
```bash
npm run dev
```
The admin dashboard runs by default on `http://localhost:3001`.

---

## 🐳 Docker Deployment

Build and run standalone container:
```bash
# Build standalone Next.js image
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:5000/api -t margrakshak-admin-portal .

# Run container
docker run -d -p 3001:3001 --name margrakshak-admin-portal margrakshak-admin-portal
```
