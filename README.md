```markdown
NEXUS

DETERMINISTIC SELF-HEALING INFRASTRUCTURE

Nexus is a Docker-based self-healing platform that detects controlled application failures, applies the appropriate recovery action, and verifies recovery.

The project demonstrates the core self-healing loop:

**Break → Detect → Repair → Verify**

---

## Features

- 🔴 **Backend Failure** — stops the target backend and automatically restarts it.
- 🗄️ **Database Failure** — stops PostgreSQL and restores it when Rebuild is triggered.
- ⏱️ **Latency Injection** — introduces artificial latency and removes it during recovery.
- 🔄 **Automatic Rebuild** — detects the current failure and applies the correct fix.
- ✅ **Recovery Verification** — confirms the service is actually healthy after recovery.
- 📜 **Recovery Timeline** — shows what happened during the recovery process.
- 🐳 **Dockerized** — the complete system runs through Docker Compose.

---

## How It Works

```text
       Failure Injected
              ↓
      Detect the Failure
              ↓
     Identify Failure Type
              ↓
        Apply Fix
              ↓
      Verify Recovery
              ↓
           Healthy
```

Nexus supports three controlled failure scenarios:

| Failure | Recovery |
|---|---|
| Backend stopped | Start backend + verify health |
| Database stopped | Start database + verify connectivity |
| High latency | Reset latency + verify response time |

---

## Architecture

```text
                  Nexus Dashboard
                         │
                         ▼
                 Nexus Backend
                    Express.js
                         │
                  Docker Socket
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     Frontend         Backend        PostgreSQL
       Nginx          Express          Database
```

### Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Infrastructure:** Docker + Docker Compose
- **Docker Control:** Dockerode
- **Web Server:** Nginx

---

## Getting Started

### Requirements

- Docker Desktop
- Git

### Run

```bash
git clone <REPOSITORY_URL>
cd nexus
docker compose up --build
```

Open:

```text
http://localhost:8080
```

---

## Demo

1. Start Nexus and confirm the system is **Healthy**.
2. Click **Break Backend**, **Break Database**, or **Inject Latency**.
3. Observe the system becoming unhealthy.
4. Click **Rebuild**.
5. Nexus detects the failure and applies the corresponding recovery.
6. Nexus verifies the recovery and returns the system to **Healthy**.

The recovery can be repeated without restarting the entire application:

```text
Break → Rebuild → Healthy
Break → Rebuild → Healthy
Break → Rebuild → Healthy
```

---

## Safety

Nexus does not consider a service recovered simply because its Docker container is running.

Recovery is only successful after verification:

- Backend → health and API checks
- Database → database connectivity
- Latency → fresh response-time check

> **Recovery is not complete until it has been verified.**

---

## Project Scope

Nexus is a **portfolio MVP** focused on deterministic self-healing.

It intentionally does not use Kubernetes, Prometheus, Grafana, Redis, Kafka, or other unnecessary infrastructure.

The goal is to demonstrate the fundamental concept clearly:

> **Detect a failure, fix it automatically, and prove that the fix worked.**

---

## Author

**Archit**

Built as a portfolio project exploring resilient systems, Docker automation, and self-healing infrastructure.
```

This is the version I'd actually put on GitHub. It's **short enough to read in 1–2 minutes**, but still tells a recruiter/interviewer what Nexus is, how it works, what technologies you used, and how to run the demo.
