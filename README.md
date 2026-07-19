# Resume-to-Job Matching Portal

A full-stack application that turns a PDF resume into a structured candidate profile and ranks relevant job opportunities. It combines a React user experience, an Express API, PostgreSQL with pgvector, and optional OpenAI-powered resume parsing and embeddings.

> The app works without external AI or PostgreSQL during local development by falling back to a lightweight mock parser, local embeddings, and JSON-backed data. For production-quality matching, configure both OpenAI and a PostgreSQL database with the `vector` extension.

## Highlights

- Upload PDF resumes up to 10 MB.
- Extract candidate details, skills, education, and experience.
- Create and browse job listings.
- Rank jobs using vector similarity.
- Use OpenAI for richer parsing and embeddings when `OPENAI_API_KEY` is configured.
- Deploy the Vite frontend and Express backend together on one Vercel domain through Vercel Services.

## Architecture

```text
Browser (React + Vite)
        |
        | /api/*
        v
Express API
        |
        +-- OpenAI (optional): parsing and embeddings
        |
        +-- PostgreSQL + pgvector (recommended)
            \-- JSON/local fallback (development only)
```

The frontend calls relative API paths in production. Vercel routes `/api/*` to the backend service and routes all other requests to the frontend service.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Resume uploads | Multer, pdf-parse |
| AI | OpenAI API (optional) |
| Database | PostgreSQL, pgvector, `pg` |
| Local database | Docker Compose with `ankane/pgvector` |
| Deployment | Vercel Services |

## Project structure

```text
.
├── frontend/              # Vite + React client
├── backend/               # Express API and matching engine
│   ├── src/services/      # Database, parser, embeddings, ranking
│   └── .env.example       # Backend environment variable template
├── docker-compose.yml     # Local PostgreSQL + pgvector service
└── vercel.json            # Vercel Services routing configuration
```

## Prerequisites

- Node.js 20 or later
- npm
- Docker Desktop (recommended for local PostgreSQL)
- An OpenAI API key (optional locally; recommended in production)

## Run locally

1. Install the root dependencies, then dependencies for both apps:

   ```bash
   npm install
   npm run install:all
   ```

2. Create `backend/.env` from the example file and set your values:

   ```bash
   cp backend/.env.example backend/.env
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   ```

3. Optional but recommended: start PostgreSQL with pgvector:

   ```bash
   docker compose up -d db
   ```

4. Start both applications:

   ```bash
   npm run dev
   ```

5. Open the frontend at `http://localhost:5173`. The API runs at `http://localhost:5000`.

To run services separately, use `npm run dev:frontend` and `npm run dev:backend`.

## Configuration

Configure backend variables in `backend/.env`. Never commit real secrets.

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | Local API port; defaults to `5000`. |
| `DATABASE_URL` | Recommended | PostgreSQL connection string. Leave empty to use the local fallback. |
| `OPENAI_API_KEY` | Recommended | Enables OpenAI resume parsing and embeddings. |
| `VITE_API_URL` | No | Frontend API base URL. Omit it locally to use `http://localhost:5000`; set it to an empty string for same-domain production routing. |

The included Docker Compose database uses:

```text
postgresql://postgres:password@localhost:5432/job_matching
```

## API reference

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/status` | Reports API availability and active database mode. |
| `GET` | `/api/jobs` | Lists all available jobs. |
| `POST` | `/api/jobs` | Creates a job and its embedding. |
| `POST` | `/api/applications` | Saves an Easy Apply submission with applicant contact details and an optional cover letter. |
| `POST` | `/api/resume/upload` | Uploads a PDF as multipart form data using the `resume` field and returns the parsed profile plus ranked matches. |

Example health check:

```bash
curl http://localhost:5000/api/status
```

## Production deployment on Vercel

This repository includes a root-level `vercel.json` for Vercel Services:

- `frontend` is built as a Vite service.
- `backend` is built as an Express service with `src/index.ts` as its entrypoint.
- `/api/*` is routed to the Express service before the frontend catch-all route.

Before deployment:

1. Import the repository into Vercel.
2. In **Project Settings → Build and Deployment**, set **Framework Preset** to **Services**.
3. Add production environment variables in Vercel:
   - `DATABASE_URL` for an externally hosted PostgreSQL database with pgvector enabled.
   - `OPENAI_API_KEY`.
   - `VITE_API_URL` set to an empty value so browser requests use `/api/...` on the same domain.
4. Deploy and verify `https://<your-domain>/api/status` returns `200`.

The backend exports its Express application for Vercel’s function runtime and starts a port listener only outside Vercel. This prevents the common “backend offline” symptom caused by treating a serverless function like a permanently running server.

## Build and verification

```bash
npm run build --prefix backend
npm run build --prefix frontend
```

For a Vercel-like local experience, install the Vercel CLI and run:

```bash
vercel dev
```

## Production notes

- The JSON fallback is intended only for local development. Vercel’s filesystem is ephemeral, so use managed PostgreSQL in production.
- Keep `OPENAI_API_KEY` and `DATABASE_URL` only in your deployment provider’s encrypted environment-variable settings.
- The database user must be able to use the `vector` extension, or the extension must already be installed by the database provider.
- Resume uploads are processed in memory and are limited to 10 MB.

## License

No license has been specified for this project.
