# RIDERCMS - EV Battery Swapping Management System

**Charge. Swap. Go.**

A CMS/CRM for managing EV battery swapping stations, users, sessions, and payments.

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19, TypeScript |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS 4 |
| Routing | react-router-dom 7 |
| Auth | Firebase Auth (Email/Password + reCAPTCHA) |
| HTTP Client | Axios |
| Forms | react-hook-form + zod |
| Charts | Recharts |
| Maps | @react-google-maps/api |
| Icons | lucide-react, @heroicons/react, react-icons |
| QR | html5-qrcode, qrcode.react |
| Dates | date-fns |
| Notifications | react-hot-toast |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set `VITE_GOOGLE_MAPS_API_KEY` in `.env.local`
3. Run the app:
   `npm run dev`
