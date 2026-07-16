# NirveonX ERP

Internal management portal for NirveonX — tasks, leaves, certificates, appraisals,
assets, approvals, eSupport, 24x7 support, leadership line, roster, daily reports,
skill matrix, team chat, leaderboard, and team performance.

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + React Router
- **Backend**: Express + Node.js
- **Database**: MongoDB (MongoDB Atlas free tier works fine)
- **Auth**: JWT (7-day tokens), bcrypt password hashing, admin-side account blocking
- **Chat**: Text, image (by URL), and link sharing — no video, no Socket.io (polls every 4s)

## Project structure

```
nirveonx-erp/
  server/         Express API (MongoDB/Mongoose)
    src/
      models/       Mongoose schemas (User, Task, Leave, Certificate, ...)
      middleware/   auth.js - JWT verification + admin-blocking check on every request
      routes/       One file per feature area
      utils/        JWT sign/verify helpers
    seed.js         Creates demo users + sample tasks/assets
    .env.example    Copy to .env and fill in
  client/         React frontend (Vite)
    src/
      pages/        One file per ERP page
      components/   Shared UI (Layout, Sidebar, Modal, Avatar, ...)
      context/       AuthContext (login state, role helpers)
      lib/api.js     Axios client, attaches JWT to every request
    .env.example    Copy to .env and fill in for production builds
```

## How authentication + admin-blocking works

- Login returns a JWT signed with `JWT_SECRET`. The frontend stores it in
  `localStorage` and attaches it as `Authorization: Bearer <token>` on every request.
- The `requireAuth` middleware (`server/src/middleware/auth.js`) decodes the token
  **and then re-fetches the user from MongoDB on every single request**, checking
  `isBlocked`. This is what makes blocking actually work in real time: an admin
  (HR or Leadership role) can block a user from the Users page at any moment, and
  that user's very next API call is rejected — they don't get to keep working
  until their token happens to expire.
- Passwords are hashed with bcrypt (10 salt rounds), not the weak
  `sha256(password + static-salt)` scheme from the earlier prototype.

## Chat: what it does and doesn't do

- Text messages, and messages that are just a URL, are supported.
- If a pasted URL ends in an image extension (`.png`, `.jpg`, `.gif`, `.webp`, etc.)
  it renders inline as an image; otherwise a URL renders as a clickable link.
- There's no file upload and no video — this avoids the earlier version's
  problem of storing base64-encoded file blobs directly in the database, which
  would burn through a free-tier database's storage very quickly.
- No Socket.io: the chat view polls the API every 4 seconds instead. This sidesteps
  the WebSocket cold-start issue on Render's free tier (see deployment notes below).
- If you later want real image uploads instead of pasted URLs, wire up Cloudinary
  or a similar service and point `imageUrl` at the returned hosted URL — the data
  model already supports it, nothing else needs to change.

---

## Running locally

### Prerequisites

- Node.js 18 or later
- A MongoDB connection string — easiest option is a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) M0 cluster (takes about 5 minutes to set up: create a free cluster, create a database user, allow access from your IP or `0.0.0.0/0` for testing, then copy the connection string)

### 1. Backend

```bash
cd server
cp .env.example .env
```

Edit `.env`:
```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/nirveonx-erp?retryWrites=true&w=majority
JWT_SECRET=<generate a long random string, e.g. `openssl rand -hex 32`>
PORT=8080
CLIENT_ORIGIN=http://localhost:5173
```

Install dependencies and seed demo data:
```bash
npm install
npm run seed
```

The seed script prints login credentials to the console. It creates:

| Username | Password | Role |
|---|---|---|
| rahul | admin123 | Leadership |
| priya | hr123 | HR |
| arjun | lead123 | Team Lead |
| kiran | pass123 | Staff (intern, ends in 2 days - triggers the notification banner) |
| ananya | pass123 | Staff (intern, ends in 1 day) |
| vikram | pass123 | Staff |
| meera | pass123 | Staff (intern) |
| deepak | pass123 | Staff |
| sneha | pass123 | Staff |
| rohan | pass123 | Staff |

Start the API server:
```bash
npm run dev
```
It should print `API server listening on port 8080`. Test it: open `http://localhost:8080/api/health` in a browser — you should see `{"status":"ok"}`.

### 2. Frontend

In a second terminal:
```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. Log in with any username/password pair from the table above.

You don't need a `.env` file for local frontend development — `src/lib/api.js`
already defaults to `http://localhost:8080/api` when `VITE_API_URL` isn't set.

### Trying out admin-blocking

1. Log in as `priya` (HR) or `rahul` (Leadership).
2. Go to **Users**, find any staff member, click **Block**.
3. In a private/incognito window, try logging in as that user, or if already
   logged in, refresh any page — they'll be signed out immediately with a
   "blocked by an admin" message.

---

## Deploying

The frontend (Vercel) and backend (Render) deploy independently. Set up the
database first, then the backend, then the frontend, since the frontend needs
the backend's URL and the backend needs the database's connection string.

### Step 1: MongoDB Atlas (if you haven't already)

1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register).
2. Create a free M0 cluster.
3. Under **Database Access**, create a database user with a password.
4. Under **Network Access**, add `0.0.0.0/0` (allow from anywhere) so Render can reach it.
5. Click **Connect** on your cluster, choose "Drivers", and copy the connection string. Replace `<password>` with your database user's password.

### Step 2: Backend on Render

1. Push this project to a GitHub repository.
2. In the [Render dashboard](https://dashboard.render.com), click **New > Web Service**, connect your repo.
3. Set:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. Under **Environment**, add:
   - `MONGODB_URI` — your Atlas connection string
   - `JWT_SECRET` — a long random string (generate with `openssl rand -hex 32`)
   - `CLIENT_ORIGIN` — you'll update this after deploying the frontend (step 3); temporarily set it to `http://localhost:5173`
   - `PORT` — Render sets this automatically, you can leave it out
5. Deploy. Once live, note the URL Render gives you, e.g. `https://nirveonx-erp-api.onrender.com`.
6. Run the seed script once against your production database. Easiest way: temporarily set `MONGODB_URI` in a local `.env` to the same Atlas string and run `npm run seed` from your machine — it seeds whatever database the connection string points to.

**Free-tier note**: Render's free web services spin down after 15 minutes of no traffic and take about a minute to wake back up. The first request after a quiet period (e.g. first thing in the morning) will be slow. An easy mitigation is an external uptime pinger (e.g. UptimeRobot) hitting `/api/health` every 5 minutes during work hours — not officially required, but commonly used to keep free services warm.

### Step 3: Frontend on Vercel

1. In the [Vercel dashboard](https://vercel.com/new), import the same GitHub repo.
2. Set:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
3. Under **Environment Variables**, add:
   - `VITE_API_URL` — your Render backend URL plus `/api`, e.g. `https://nirveonx-erp-api.onrender.com/api`
4. Deploy. Vercel gives you a URL like `https://nirveonx-erp.vercel.app`.

### Step 4: Connect the two

Go back to Render, update the `CLIENT_ORIGIN` environment variable to your Vercel
URL (e.g. `https://nirveonx-erp.vercel.app`), and redeploy the backend so CORS
allows requests from your live frontend. If you also want a custom domain like
`erp.nirveonx.one`, add it in Vercel's project settings under **Domains** and
point your DNS at Vercel per their instructions, then add that domain to
`CLIENT_ORIGIN` too (comma-separated if you keep more than one).

### Verifying the deployment

1. Visit your Vercel URL, log in with a seeded account.
2. Open the Users page as HR/Leadership, block a test account, confirm it locks them out.
3. Open Team Chat, send a text message and an image URL (e.g. paste a link ending in `.jpg`), confirm it renders as an image.
4. Everything runs on free tiers: MongoDB Atlas M0, Render free web service, Vercel hobby plan. No paid services required to run this as-is.

## Known limitations worth knowing about

- **Free-tier cold starts**: as noted above, Render's free tier sleeps after inactivity.
- **MongoDB Atlas M0 storage**: 512MB. Fine for this data model at company scale; if chat history grows large over time, consider periodically archiving old messages.
- **Chat images are pasted URLs, not uploads.** If you want true drag-and-drop image uploads, add Cloudinary (or similar) on the frontend and post the resulting hosted URL to the existing `imageUrl` field — no backend changes needed.
- **In production, rotate `JWT_SECRET`** to something you generate yourself and never commit to version control.
