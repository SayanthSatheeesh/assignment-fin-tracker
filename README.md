# Finance Portfolio Tracker

## 1. Project Overview
The Finance Portfolio Tracker is a full-stack web application designed for users to log, manage, and review their financial investments with precision. It features a sleek, "Coinbase-inspired" dark-mode authentication flow and a clean, light-mode institutional dashboard. Built with a robust **NestJS (Node.js)** backend utilizing **TypeORM** over a **Neon PostgreSQL** database, and a highly responsive **Next.js (React)** frontend styled with **Tailwind CSS** and **shadcn/ui**.

## 2. Local Setup
Follow these steps to run the application locally.

**Prerequisites**: Node 20+, Docker Desktop

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd finance-portfolio-tracker
   ```
2. Set up the backend environment variables:
   ```bash
   cp backend/.env.example backend/.env
   ```
3. Set up the frontend environment variables:
   ```bash
   cp frontend/.env.example frontend/.env.local
   ```
4. Fill in `backend/.env` with your secure values (at minimum `DATABASE_URL` and `JWT_SECRET`).
5. Start the local PostgreSQL database:
   ```bash
   docker compose up -d postgres
   ```
6. Install backend dependencies and run database migrations:
   ```bash
   cd backend
   npm install
   npm run migration:run
   ```
7. Start the backend development server:
   ```bash
   npm run start:dev
   ```
   *(Keep this terminal running)*
8. In a new terminal, install frontend dependencies and start the UI:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
9. Open [http://localhost:3001](http://localhost:3001) in your browser.

## 3. Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `DATABASE_URL` | The PostgreSQL connection string. Use the **pooled** string if using Neon. |
| `JWT_SECRET` | A secure, random string (minimum 32 characters) used to sign Auth tokens. |
| `PORT` | The port the NestJS server runs on (defaults to 3000). |
| `FRONTEND_URL` | Used to configure CORS allowing the frontend to call the API. |
| `NODE_ENV` | Should be set to `production` when deployed. |

### Frontend (`frontend/.env.local` / `frontend/.env`)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | The URL of the backend API (e.g., `http://localhost:3000` or the Render URL). |

## 4. API Documentation

| Endpoint | Method | Auth Required | Description |
|---|---|---|---|
| `/auth/register` | POST | No | Register a new user. Returns 201 Created. |
| `/auth/login` | POST | No | Authenticate user. Returns JWT `accessToken` and user object. |
| `/investments` | POST | Yes | Create a new investment. Returns the created record. |
| `/investments` | GET | Yes | Fetch investments (Supports `page`, `limit`, `search`, `investmentType`). |
| `/investments/:id` | GET | Yes | Fetch a specific investment by ID. |
| `/investments/:id` | PUT | Yes | Update an existing investment by ID. |
| `/investments/:id` | DELETE | Yes | Delete an investment. Returns 204 No Content. |
| `/portfolio/summary` | GET | Yes | Retrieve aggregated stats (`totalInvested`, `currentValue`, `totalProfit`). |

## 5. Migration Instructions

The backend relies on TypeORM migrations. `synchronize` is strictly disabled.
To manage migrations, run these commands from the `backend/` directory:

```bash
npm run migration:run     # Apply all pending migrations
npm run migration:revert  # Undo the last applied migration
npm run migration:show    # List applied and pending migrations
```

## 6. Known Limitations
- **JWT-only auth (no refresh token)**: Implemented due to strict deadline constraints. Users will be required to re-login after 1 hour.
- **Token in localStorage / Next.js proxy route**: Implemented for a simpler flow. In a strict production environment, an `httpOnly` cookie should be managed directly by the backend or a dedicated Next.js API route.
- **Manual Data Entry**: Investment prices and current values are user-entered. There is no live market data API integration.
- **No Email Verification**: Account creation does not currently require email verification (noted as a future roadmap addition).

## 7. Live Links
- **Frontend (Vercel):** *[Insert your Vercel URL here]*
- **Backend API (Render):** *[Insert your Render URL here]*
