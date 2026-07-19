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

Live Demo-https://job-application-six-sepia.vercel.app/

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
