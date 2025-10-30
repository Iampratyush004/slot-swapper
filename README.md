SlotSwapper
===========

Peer‑to‑peer time‑slot scheduling. Users mark events as swappable and exchange them with others via swap requests.

Monorepo Structure
------------------

- `backend/` — Node.js, Express, TypeScript, Prisma (SQLite). JWT auth, events CRUD, swap logic.
- `frontend/` — Vite + React + TypeScript. Auth pages, dashboard, marketplace, requests.

Tech Choices & Design
---------------------

- **SQLite + Prisma**: fast to set up, easy to swap later (Prisma abstracts DB).
- **Modular folders**: `modules/{auth,events,swaps}` with controller/service/routes for loose coupling.
- **JWT**: stateless auth via `Authorization: Bearer <token>`.
- **Transactions**: swap accept/reject uses Prisma transactions for consistency.
- **Simple UI state**: minimal hooks; could grow into a global store later.

Quick Start
-----------

Prereqs: Node 18+, pnpm/npm, and PowerShell or a POSIX shell.

1) Backend

```bash
cd backend
cp .env.example .env  # if available; otherwise create variables shown below
pnpm i  # or: npm i
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

Env variables (create `backend/.env`):

```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-change-me"
PORT=4000
```

2) Frontend

```bash
cd frontend
pnpm i  # or: npm i
echo VITE_API_URL=http://localhost:4000/api > .env
pnpm dev
```

Open `http://localhost:5173`.

API Endpoints
-------------

Auth
- POST `/api/auth/signup` — body: `{ name, email, password }` → `{ token, user }`
- POST `/api/auth/login` — body: `{ email, password }` → `{ token, user }`

Events (Bearer required)
- GET `/api/events` — list own events
- POST `/api/events` — `{ title, startTime, endTime, status? }`
- PUT `/api/events/:id` — partial update, e.g. `{ status: "SWAPPABLE" }`
- DELETE `/api/events/:id`

Marketplace & Swaps (Bearer required)
- GET `/api/swappable-slots` — other users' `SWAPPABLE` events
- POST `/api/swap-request` — `{ mySlotId, theirSlotId }` → creates `PENDING`, sets both slots `SWAP_PENDING`
- POST `/api/swap-response/:requestId` — `{ accept: true|false }`
  - accept: swap owners, both `BUSY`, request `ACCEPTED`
  - reject: revert both to `SWAPPABLE`, request `REJECTED`
- GET `/api/requests` — lists `{ incoming, outgoing }`

Database Schema
---------------

- `User(id, name, email, password)`
- `Event(id, title, startTime, endTime, status: BUSY|SWAPPABLE|SWAP_PENDING, ownerId)`
- `SwapRequest(id, requesterId, responderId, mySlotId, theirSlotId, status: PENDING|ACCEPTED|REJECTED)`

Assumptions
-----------

- No overlapping validation for events (can be added easily).
- Timestamps are ISO strings on the API and stored as DateTime.
- Minimal UI without a calendar grid; list views for speed.

Future Enhancements
-------------------

- Real‑time notifications via WebSockets for swap request updates.
- Role‑based permissions, advanced validation, and calendar UI.
- Docker + docker‑compose for one‑command local setup.
- Tests for swap transactions and auth flows.





