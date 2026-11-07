# 👤 MargRakshak Citizen Portal (`frontend-user`)

Next.js 14 citizen-facing web application and Progressive Web App (PWA) for reporting and tracking road hazards.

---

## 🚀 Key Features

- **PWA & Mobile Ready:** Installable to mobile home screen with offline caching via service worker (`public/sw.js`).
- **AI Hazard Classification:** Instant visual classification using Gemini Vision API via backend proxy upon image capture.
- **Saarthi AI Assistant:** Road safety and rules conversational chatbot in English and Hindi.
- **Geospatial Reporting:** Pinpoint hazard locations using browser GPS or interactive Leaflet map dragging.
- **Real-Time Status Tracking:** Live notifications and report detail views driven by WebSockets.
- **OTP Password Recovery:** Secure 6-digit OTP verification flow.
- **Theme Support:** Polished Dark and Light mode powered by `next-themes` and Tailwind CSS.
- **Crowdsourced Sensors:** Mobile accelerometer monitoring to detect sudden road impacts (potholes/bumps).

---

## 📁 Directory Structure

```
frontend-user/
├── public/
│   ├── manifest.json       # PWA manifest configuration
│   ├── sw.js               # Service Worker for offline caching
│   └── margrakshak-logo.webp # Official MargRakshak branding logo
├── src/
│   ├── app/
│   │   ├── page.tsx        # Landing page with interactive hero, stats, and action CTAs
│   │   ├── login/          # Citizen login page
│   │   ├── register/       # Citizen registration page
│   │   ├── forgot-password/# Multi-step OTP password reset
│   │   ├── submit-report/  # Multi-step report form with AI image preview & map picker
│   │   ├── reports/[id]/   # Detailed report viewer with status timeline and admin responses
│   │   ├── dashboard/      # Citizen dashboard with personal submissions and settings
│   │   └── heatmap/        # City-wide geospatial hazard heatmap
│   ├── components/
│   │   ├── SaarthiChatbot.tsx    # Floating Saarthi AI chatbot modal
│   │   ├── ProximityAlerts.tsx   # Real-time nearby hazard proximity warnings
│   │   ├── NotificationManager.tsx # WebSocket notification handler
│   │   ├── ThemeToggle.tsx       # Dark / Light theme switch
│   │   └── PWAInstallPrompt.tsx  # Install app banner
│   ├── lib/
│   │   ├── api.ts          # Central Axios HTTP client with auth interceptors
│   │   └── websocket.ts    # WebSocket client connection manager
│   └── store/
│       └── authStore.ts    # Zustand state for user profile and authentication tokens
└── tailwind.config.js      # Government styling color palette
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

> 🛡️ **Security Note:** All external AI keys (Gemini, Groq) are protected on the backend server. The browser client only communicates with the backend API URL, preventing secret leaks.

---

## 🛠️ Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Next.js Development Server
```bash
npm run dev
```
The citizen portal will open at `http://localhost:3000`.
