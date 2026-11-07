# 🛣️ MargRakshak (मार्ग रक्षक) — Road Hazard Reporting Platform

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.18-lightgrey.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-blue.svg)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**MargRakshak** (मार्ग रक्षक) is a modern, full-stack civic technology platform empowering citizens to report road hazards (potholes, damaged streetlights, road cracks, open manholes) in real-time and allowing civic authorities to triage, manage, assign, and resolve them efficiently.

---

## 🏗️ Monorepo Architecture

```
proj/
├── backend/                  # Express.js REST API + Real-time WebSockets
│   ├── config/               # Database pool and environment configuration
│   ├── middleware/           # JWT auth, RBAC permissions, audit logger
│   ├── migrations/           # Database migration scripts
│   ├── routes/               # API endpoints (auth, reports, admin, AI, sensors)
│   ├── services/             # WebSocket server, image upload, notifications
│   ├── uploads/              # Local storage for uploaded hazard images
│   ├── utils/                # Password hashing, JWT utils, Joi validations
│   └── server.js             # Express & HTTP/WS server entrypoint
│
├── frontend-user/            # Citizen Portal (Next.js 14 App Router)
│   ├── public/               # Manifest, PWA service worker, branding assets
│   ├── src/
│   │   ├── app/              # Next.js routes (login, register, forgot-password, submit, reports, heatmap)
│   │   ├── components/       # UI components, Leaflet maps, Saarthi Chatbot, Theme toggles
│   │   ├── lib/              # Axios HTTP client, WebSocket listener
│   │   └── store/            # Zustand global state (auth, notifications)
│   └── tailwind.config.js    # Custom branding styling and theme tokens
│
├── frontend-admin/           # Administrative Dashboard (Next.js 14 App Router)
│   ├── src/
│   │   ├── app/              # Admin routes (login, dashboard, reports triage, audit logs)
│   │   ├── components/       # Analytics charts, report drawers, theme providers
│   │   ├── lib/              # Admin Axios HTTP client
│   │   └── store/            # Admin Zustand store
│   └── tailwind.config.js    # Admin dashboard styling
│
└── database/                 # Database schema and migration scripts
    ├── schema.sql            # PostgreSQL schema with UUIDs, Enums, Views, and Indexes
    └── README.md             # Database architecture and setup guide
```

---

## 🚀 Tech Stack

| Layer | Technologies |
|---|---|
| **Backend API** | Node.js (v18+), Express.js, `ws` (WebSockets), `pg` (Connection Pooling), Joi, Multer |
| **Citizen Portal** | Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion, Leaflet, PWA |
| **Admin Dashboard** | Next.js 14 (App Router), React 18, Tailwind CSS, Recharts, Framer Motion |
| **Database** | PostgreSQL (Supabase cloud database with SSL pooling) |
| **Authentication** | JWT (Dual user/admin secret isolation, HTTP Bearer tokens, Bcrypt salt rounds) |
| **AI Capabilities** | Google Gemini Vision API (Automatic hazard classification), Groq Llama (Saarthi Chatbot) |

---

## 🔒 Security & Environment Variables

All sensitive credentials, API keys, and connection strings are strictly decoupled from the codebase and loaded via environment files. **Never commit `.env` or `.env.local` to git.**

### Environment Setup Files

| Component | Target File | Template File | Notes |
|---|---|---|---|
| **Backend** | `backend/.env` | `backend/.env.example` | Database credentials, JWT secrets, AI keys |
| **Citizen Portal** | `frontend-user/.env.local` | `frontend-user/.env.example` | Backend API URL (`NEXT_PUBLIC_API_URL`) |
| **Admin Dashboard** | `frontend-admin/.env.local` | `frontend-admin/.env.example` | Backend API URL (`NEXT_PUBLIC_API_URL`) |

### 1. Backend (`backend/.env`)
```env
NODE_ENV=development
PORT=5000

# Database (Supabase PostgreSQL URL)
DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres

# JWT Secrets (Separate keys for user and admin tokens)
JWT_SECRET_USER=your_secure_user_jwt_secret_min_32_characters
JWT_SECRET_ADMIN=your_secure_admin_jwt_secret_min_32_characters
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS Allowed Origins
USER_FRONTEND_URL=http://localhost:3000
ADMIN_FRONTEND_URL=http://localhost:3001

# AI Integration
GEMINI_API_KEY=your_gemini_vision_api_key
GROQ_API_KEY=your_groq_api_key
```

### 2. Frontend User & Admin (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🌐 Port Mapping & Services

| Service | Port | Local URL | Description |
|---|---|---|---|
| **Backend REST API** | `5000` | `http://localhost:5000` | Express REST API endpoints |
| **Backend WebSocket** | `5000` | `ws://localhost:5000/ws` | Real-time status update broadcast |
| **Citizen Portal** | `3000` | `http://localhost:3000` | Public citizen hazard reporting portal |
| **Admin Dashboard** | `3001` | `http://localhost:3001` | Government official resolution workspace |

---

## 🛠️ Step-by-Step Installation & Running

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [npm](https://www.npmjs.com/) v9.0.0 or higher
- Supabase account or local PostgreSQL instance

### 1. Install Dependencies

You can install all dependencies across the monorepo using the root script:
```bash
npm run install:all
```
*Or manually in each subfolder:*
```bash
cd backend && npm install
cd ../frontend-user && npm install
cd ../frontend-admin && npm install
```

### 2. Configure Environment Files
Copy the example templates and add your actual credentials:
```bash
# Backend
cp backend/.env.example backend/.env

# User Frontend
cp frontend-user/.env.example frontend-user/.env.local

# Admin Frontend
cp frontend-admin/.env.example frontend-admin/.env.local
```

### 3. Initialize Database Schema
1. Open your Supabase SQL editor (or PostgreSQL CLI).
2. Execute the schema script located at [`database/schema.sql`](database/schema.sql).
3. (Optional) Run the admin seed script:
```bash
cd backend && node create_admin.js
```

### 4. Running the Project

Open 3 terminal windows to run all three services concurrently:

#### Terminal 1 — Backend API:
```bash
npm run dev:backend
# Or: cd backend && npm run dev
# Running on http://localhost:5000
```

#### Terminal 2 — Citizen Frontend:
```bash
npm run dev:user
# Or: cd frontend-user && npm run dev
# Running on http://localhost:3000
```

#### Terminal 3 — Admin Frontend:
```bash
npm run dev:admin
# Or: cd frontend-admin && npm run dev
# Running on http://localhost:3001
```

---

## 🔑 Administrator Portal Login Credentials

For administrative access to the MargRakshak Admin Portal at `http://localhost:3001/login`:

- **Portal URL:** [http://localhost:3001/login](http://localhost:3001/login)
- **Official Email / Admin ID:** `admin.gov.in` *(also accepts `admin@gov.in`)*
- **Password:** `admin123`
- **Role:** `super_admin` (Full access to hazard triage, field crew assignment, SLA tracking, and audit trail)
- **Role:** Super Admin (All permissions enabled)

---

## 📡 API Reference Overview

### Public & User Routes
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/health` | Server health check | Public |
| `POST` | `/api/auth/register` | Register citizen account | Public |
| `POST` | `/api/auth/login` | Citizen authentication & token issue | Public |
| `POST` | `/api/auth/forgot-password` | Generate 6-digit OTP for password reset | Public |
| `POST` | `/api/auth/reset-password` | Verify OTP and set new password | Public |
| `POST` | `/api/reports` | Submit road hazard report with photos & coordinates | User JWT |
| `GET` | `/api/reports/my` | Retrieve authenticated user's submitted reports | User JWT |
| `POST` | `/api/ai/classify` | Vision AI hazard detection (Gemini) | Public |
| `POST` | `/api/chatbot/message` | Saarthi conversational road safety assistant | Public |
| `POST` | `/api/sensor/event` | Ingest accelerometer & GPS pothole detection event | User JWT |

### Admin Routes
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/admin/auth/login` | Administrative authentication | Public |
| `GET` | `/api/admin/dashboard/stats` | Real-time aggregate statistics & charts data | Admin JWT |
| `GET` | `/api/admin/reports` | List, search, filter, and paginate reports | Admin JWT |
| `PUT` | `/api/admin/reports/:id/status` | Update hazard status (`submitted` → `in_progress` → `resolved`) | Admin JWT |
| `POST` | `/api/admin/reports/:id/respond` | Add official department response/notes | Admin JWT |
| `GET` | `/api/admin/audit` | View immutable administrative audit trail | Admin JWT |

---

## 📱 Core Features

- **Automated AI Hazard Classification:** Citizens upload road pictures, and Gemini Vision analyzes the defect (pothole, crack, damaged light) and suggests severity level.
- **Saarthi AI Assistant:** Conversational AI supporting English and Hindi for road rules, reporting advice, and platform FAQs.
- **Sensor Road Bump Detection:** Automatic detection of road anomalies using mobile device accelerometer spikes and crowd verification.
- **Real-time Live Updates:** WebSocket connection immediately alerts citizens when an official updates the status of their submitted report.
- **Interactive Geospatial Maps:** Visual heatmap and clustering of hazards using Leaflet.

---

## 📄 License
This project is licensed under the MIT License.
