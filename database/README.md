# 🗄️ MargRakshak Database Architecture

PostgreSQL database schema and migrations for the MargRakshak Road Hazard Reporting Platform, configured for cloud deployment on Supabase or local PostgreSQL.

---

## 🏛️ Schema Overview

The database leverages UUID primary keys, PostgreSQL custom ENUMs, JSONB metadata fields, and relational foreign keys with cascading cleanup.

### Tables

| Table | Description |
|---|---|
| `users` | Citizen profiles, credentials (bcrypt hash), verification & password reset tokens |
| `admins` | Administrative users, role assignments, department associations, JSONB permissions |
| `issue_types` | Catalog of reportable hazards (Pothole, Broken Street Light, Road Crack, Open Manhole, Unsafe Highway, Speed Breaker Damage) |
| `reports` | Citizen reports including GPS coordinates, address, severity, status, source (manual/sensor), and timestamps |
| `report_images` | Associated photographic evidence URLs and upload metadata |
| `report_responses`| Official updates, field comments, and remediation responses by administrators |
| `status_history` | Audit log of every status transition (`submitted` ➔ `under_review` ➔ `in_progress` ➔ `resolved` / `rejected`) |
| `notifications` | In-app notification messages delivered to citizens |
| `admin_audit_logs`| Immutable log of all administrative actions taken across the system |
| `refresh_tokens` | Active JWT refresh tokens for secure session revocation |
| `sensor_events` | Accelerometer & GPS sensor data points ingested for crowdsourced pothole detection |

---

## 🏷️ Custom Enum Types

```sql
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE admin_role AS ENUM ('super_admin', 'department_head', 'field_officer', 'viewer');
CREATE TYPE report_status AS ENUM ('submitted', 'under_review', 'in_progress', 'resolved', 'rejected');
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE notification_type AS ENUM ('email', 'sms', 'in_app');
```

---

## 📊 Pre-Calculated Views

- `reports_detailed`: Joins `reports`, `users`, `issue_types`, and `admins` to provide a complete view for the frontend.
- `admin_dashboard_stats`: Pre-computed counts of total reports, status breakdowns, and active issues for high-performance dashboard loading.

---

## 🚀 Setup Instructions

### 1. Supabase (Recommended)
1. Log into [Supabase](https://supabase.com) and create a project.
2. Navigate to **Project Settings** ➔ **Database** to obtain your `Connection string` (URI mode).
3. Paste the URI into `backend/.env` as `DATABASE_URL`.
4. Open the **SQL Editor** in your Supabase dashboard.
5. Copy and execute the contents of [`database/schema.sql`](schema.sql).

### 2. Local PostgreSQL
1. Create a database named `road_hazard_db`:
   ```bash
   createdb -U postgres road_hazard_db
   ```
2. Execute the schema:
   ```bash
   psql -U postgres -d road_hazard_db -f schema.sql
   ```
3. Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` in `backend/.env`.

---

## 🔑 Initial Data Seeding

Running `schema.sql` automatically inserts default `issue_types`. To seed an initial administrator:

```bash
cd ../backend
node create_admin.js
```
*Creates initial administrator `admin@gov.in` with password `Admin@123`.*
