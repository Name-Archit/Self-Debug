# Nexus control server

Nexus is a small chaos-engineering control plane for a Dockerized web application. It can stop target services, simulate monitored latency, diagnose failures, create an isolated backend sandbox, validate it, and only then repair production.

## Run

1. Copy `backend/.env.example` to `backend/.env`. Set `OPENAI_API_KEY` to a real key before starting; Nexus stops with a clear configuration error when it is missing. Do not commit this file.
2. From this directory, run `docker compose up --build`.
3. Open the dashboard at `http://localhost:8080`. It proxies its API calls to the control API at `http://localhost:5000`; the bundled Compose file includes safe demo target containers.

For local development, run `npm install` then `npm run dev` from `backend` for the control API, and from `frontend` for the React dashboard. Every backend setting is loaded through `backend/config.js`; edit `.env`, not source files. Docker access is required for container operations; without it, status reports the targets as unavailable rather than crashing the server.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Control-server liveness |
| GET | `/api/status` | Target containers and health summary |
| POST | `/api/break/backend` | Stop the target backend |
| POST | `/api/break/database` | Stop the target database |
| POST | `/api/break/latency` | Enable monitored latency simulation (`{ "delayMs": 2000 }`) |
| GET | `/api/diagnostics` | Failure diagnosis and evidence |
| POST | `/api/sandbox/create` | Create an isolated backend sandbox |
| POST | `/api/sandbox/validate` | Validate the current sandbox |
| POST | `/api/rebuild` | Diagnose, validate, and repair production |
| GET | `/api/timeline` | In-memory recovery event history |
| POST | `/api/ai/analyze` | Optional GPT-5 diagnosis from status, health checks, and logs |

Structured JSON logs are written to `backend/logs/nexus.log`. The monitor samples target state every five seconds and records state transitions in the timeline.

## AI diagnosis

Nexus uses the OpenAI Responses API with GPT-5 only to explain a failure and suggest a repair plan. The rebuild workflow is deterministic: it never waits for, or executes, an AI recommendation.

## End-to-end check

After the stack is healthy, run `npm run test:integration` from `backend`. The script checks discovery and status, stops the backend, confirms the failure, runs the recovery workflow, then creates, validates, and removes a sandbox. Its JSON report is suitable for CI logs.
