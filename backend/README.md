# 🔧 MargRakshak Backend API & WebSocket Server

Backend service for the MargRakshak Road Hazard Reporting Platform, built with Node.js, Express.js, PostgreSQL (Supabase), and WebSocket real-time event broadcasting.

---

## 📁 Directory Structure

```
backend/
├── config/
│   ├── database.js          # PostgreSQL connection pool with retry & SSL support
│   └── env.js               # Centralized config loader from .env
├── middleware/
│   ├── auth.js              # User & Admin JWT verification, role & permission guards
│   └── logger.js            # HTTP Morgan logger + administrative audit logs
├── migrations/
│   └── add_password_reset_tokens.js # Migration utilities
├── routes/
│   ├── auth.js              # Citizen register, login, refresh tokens, profile
│   ├── passwordReset.js     # 6-digit OTP request, verification, password update
│   ├── reports.js           # Hazard reporting CRUD, image upload, status querying
│   ├── notifications.js     # Citizen notification inbox & read status
│   ├── ai.js                # Gemini Vision API for automatic road hazard image classification
│   ├── chatbot.js           # Saarthi road safety chatbot powered by Groq Llama
│   ├── sensor.js            # Mobile accelerometer pothole detection & auto-reporting
│   └── admin/
│       ├── auth.js          # Administrative login & token issues
│       ├── dashboard.js     # Aggregate analytics, status breakdowns, time-series data
│       ├── reports.js       # Admin triage, status updates, officer assignment, comments
│       └── audit.js         # Immutable administrative action log
├── services/
│   ├── imageUpload.js       # Multer file storage & mime verification
│   ├── notifications.js     # Multi-channel notification dispatcher
│   └── websocket.js         # Real-time WebSocket server attached to HTTP server
├── utils/
│   ├── hash.js              # Bcrypt password hashing & validation
│   ├── jwt.js               # Dual-secret JWT issuance & signature verification
│   └── validation.js        # Joi schema validators
├── uploads/                 # Local directory for stored hazard images
├── create_admin.js          # Seed script for initial administrative account
└── server.js                # Application entrypoint
```

---

## 🔒 Environment Configuration

All sensitive keys, database connection strings, and JWT secrets must be placed inside `backend/.env`.

> ⚠️ **Security Notice:** `backend/.env` is ignored by git. Never commit live credentials or secrets to version control. Use `backend/.env.example` as a template.

### Configuration Reference (`.env`)

| Variable | Type | Default | Description |
|---|---|---|---|
| `PORT` | Number | `5000` | Port on which the HTTP & WebSocket server listens |
| `NODE_ENV` | String | `development` | Runtime environment (`development` or `production`) |
| `DATABASE_URL` | String | - | Supabase or PostgreSQL connection string (`postgresql://...`) |
| `DB_HOST` | String | `localhost` | Local database host fallback |
| `DB_PORT` | Number | `5432` | Local database port |
| `DB_NAME` | String | `road_hazard_db` | Local database name |
| `DB_USER` | String | `postgres` | Local database username |
| `DB_PASSWORD` | String | - | Local database password |
| `JWT_SECRET_USER` | String | - | Strong secret for signing citizen tokens (min 32 chars) |
| `JWT_SECRET_ADMIN` | String | - | Strong secret for signing administrator tokens (min 32 chars) |
| `JWT_ACCESS_EXPIRY` | String | `15m` | Lifetime of access tokens |
| `JWT_REFRESH_EXPIRY`| String | `7d` | Lifetime of refresh tokens |
| `USER_FRONTEND_URL` | String | `http://localhost:3000` | Allowed CORS origin for Citizen portal |
| `ADMIN_FRONTEND_URL`| String | `http://localhost:3001` | Allowed CORS origin for Admin portal |
| `GEMINI_API_KEY` | String | - | Google Gemini Vision API key for road hazard image detection |
| `GROQ_API_KEY` | String | - | Groq API key for Saarthi AI chatbot responses |
| `UPLOAD_DIR` | String | `./uploads` | Destination directory for uploaded report images |
| `MAX_FILE_SIZE` | Number | `5242880` | Maximum file upload size in bytes (5MB) |

---

## ⚡ Real-Time WebSocket Events

The backend exposes a WebSocket server at `ws://localhost:5000/ws`.

- **Client Subscription:** Clients connect and send their auth token to join private notification rooms.
- **`status_change` Event:** Emitted to the user when their hazard report status changes (`under_review`, `in_progress`, `resolved`).
- **`new_report` Event:** Emitted to connected admin dashboards whenever a citizen submits a new report.

---

## 🛠️ Local Development & Scripts

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your actual Supabase URL and secrets
```

### 3. Create Default Admin
```bash
node create_admin.js
```
*Creates initial administrator `admin@gov.in` with password `Admin@123`.*

### 4. Start Development Server
```bash
npm run dev
```
Server will start on `http://localhost:5000` with hot-reloading via nodemon.
