# SHIELD 2026 — Registration, Digital Entry Pass & Attendance System

A full-stack app for a 5-day bootcamp: import your participant list once, each
student verifies their identity and gets a QR "digital pass," volunteers scan
that QR at the door, and an admin dashboard shows live attendance.

**Attendance is tracked 2 times a day (a morning session and an evening
session) across all 5 days — 10 possible check-ins per participant in
total.**

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB (via Mongoose)

---

## 1. What's in this zip

```
shield2026/
├── backend/              Node/Express API + MongoDB models
│   ├── server.js
│   ├── models/           Participant, Ticket, Attendance, Admin
│   ├── routes/           /api/verify, /api/generate-ticket, /api/attendance/*, /api/admin/*
│   ├── scripts/createAdmin.js   creates your first admin login
│   ├── public/           pre-built frontend (see section 4 - single-server mode)
│   └── .env.example      copy to .env and fill in
├── frontend/             React + Vite source (Home, Verify, My Ticket, Scan, Admin)
├── build-frontend.sh     rebuilds frontend/ and copies it into backend/public
└── sample_participants.csv   example roster format for the CSV upload
```

---

## 2. Prerequisites

- **Node.js 18+** and npm — check with `node -v`
- **A MongoDB database.** The free tier of MongoDB Atlas is the easiest way to
  get one without installing anything locally:
  1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
  2. Create a free "M0" cluster (any provider/region is fine).
  3. Under **Database Access**, create a database user with a username and password.
  4. Under **Network Access**, add `0.0.0.0/0` (allow from anywhere) — fine for a
     student event; tighten it later if you want.
  5. Click **Connect → Drivers**, copy the connection string. It looks like:
     `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/`
  6. Add a database name to the end of it, e.g. `.../shield2026?retryWrites=true...`

  (If you already run MongoDB locally, `mongodb://127.0.0.1:27017/shield2026` works too.)

---

## 3. Run it locally (development mode — frontend and backend as two servers)

### Backend

```bash
cd backend
npm install
cp .env.example .env
```

Now open `.env` and fill in at least:

- `MONGO_URI` — your Atlas connection string (or local Mongo URI)
- `JWT_SECRET` — any long random string
- `EVENT_START_DATE` — Day 1's date, e.g. `2026-09-21`
- `DEFAULT_ADMIN_USERNAME` / `DEFAULT_ADMIN_PASSWORD` — your admin login

Create your admin account (only needs to be run once, or again any time you
want to reset the password):

```bash
npm run seed-admin
```

Start the API:

```bash
npm run dev
```

You should see `SHIELD 2026 API listening on port 5000`.

### Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the printed URL (usually `http://localhost:5173`). The dev server
automatically proxies `/api/...` calls to the backend on port 5000
(see `frontend/vite.config.js`), so you don't need to configure anything.

### Try the whole flow

1. Log in to `http://localhost:5173/admin` with your admin credentials.
2. Go to **Upload roster** and upload `sample_participants.csv` (or your real
   100-student CSV — same column format: `UID, Name, Email, Phone, Branch`).
3. Open `http://localhost:5173/verify` in another tab/incognito window, and
   verify as one of the uploaded students (e.g. UID `24BDA001`, email
   `aarav.sharma@example.com`) — you'll get a QR ticket.
4. Go to `http://localhost:5173/scan`, log in with the same admin/volunteer
   account, and scan that QR with your webcam/phone camera. You'll see
   "Entry verified" and the admin Overview tab will show the check-in.

---

## 4. Single-server mode (recommended for actually deploying)

Instead of running two servers, you can build the frontend once and let the
Express backend serve it directly — one URL, one process, easiest to deploy
anywhere.

```bash
./build-frontend.sh
```

This builds the React app and copies it into `backend/public`. Then just run
the backend:

```bash
cd backend
npm start
```

Open `http://localhost:5000` — the whole app (student pages, scan page, admin
dashboard) is served from there, with the API underneath at `/api/...`.

**Whenever you change frontend code, re-run `./build-frontend.sh` and restart
the backend** so it picks up the new build.

---

## 5. How the attendance rules work

Configured entirely through `backend/.env`:

| Variable | What it controls |
|---|---|
| `EVENT_START_DATE` | Calendar date of Day 1. Day 2–5 are worked out automatically. |
| `EVENT_DAYS` | How many days the bootcamp runs (default 5). |
| `SESSION_SPLIT_TIME` | Clock time that divides "morning" from "evening" scans (default `13:00`). A scan before this time counts toward the morning session; at/after, the evening session. |
| `MORNING_ON_TIME_UNTIL` | Scans at/before this time are `ON_TIME`; after, `LATE` (still recorded, just labeled). |
| `EVENING_ON_TIME_UNTIL` | Same, for the evening session. |

So across 5 days × 2 sessions, each participant has **10** possible
attendance records. The Scan page also lets a volunteer manually force
"Morning" or "Evening" instead of relying on the clock, for catching
stragglers just after the cutover.

The system already handles, exactly as specified:

- **Duplicate scans** → `Already checked in` (one record per participant per session)
- **Fake/garbage QR** → `Invalid ticket`
- **Ticket not linked to a real participant** → `Unauthorized`
- **Late entry** → recorded, just flagged `LATE` instead of `ON_TIME`

---

## 6. Deploying for real (so students can use it from their phones)

Any of these work — pick whichever you're most comfortable with:

**Option A — one host, single-server mode (simplest)**
Deploy the `backend/` folder (with `public/` already built in) to a Node
host like Render, Railway, or a small VPS. Set the environment variables
from `.env.example` in that host's dashboard. One URL for everything.

**Option B — split hosting**
Deploy `backend/` to Render/Railway as the API, and `frontend/` to
Vercel/Netlify as a static site. If you do this, set `CLIENT_URL` in the
backend's env to your frontend's URL, and in `frontend/src/lib/api.js`
change the `baseURL` from `/api` to your backend's full URL
(e.g. `https://your-api.onrender.com/api`).

Either way, before going live:

- Set a strong, random `JWT_SECRET`.
- Set a real `DEFAULT_ADMIN_PASSWORD` and re-run `npm run seed-admin`.
- Make sure the host gives you HTTPS (camera access for QR scanning requires
  it on most phones, `localhost` is exempt but a real domain needs it).

---

## 7. Adding/removing admin or volunteer accounts

`npm run seed-admin` creates or resets one account from your `.env`. To add
more volunteer accounts for extra entry desks, connect to your MongoDB
database (Atlas has a built-in "Collections" browser) and either duplicate
that script with different values, or add a document directly to the
`admins` collection with a bcrypt-hashed password.

---

## 8. Troubleshooting

- **"Something went wrong" on every page** → your backend probably can't
  reach MongoDB. Check `MONGO_URI` in `.env` and the backend's terminal log.
- **Camera doesn't open on the Scan page** → browsers require HTTPS (or
  `localhost`) for camera access, and you'll need to grant permission when
  prompted.
- **CSV upload rejects everything** → make sure the header row is exactly
  `UID,Name,Email,Phone,Branch` (case doesn't matter, order doesn't matter).
- **"Already checked in" appears immediately** → someone (maybe you, while
  testing) already scanned that participant for the current session. Check
  the Overview tab in the admin dashboard.
