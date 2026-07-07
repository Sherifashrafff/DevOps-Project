# TaskFlow

Project & task tracker. Node.js + Express backend, static HTML/JS frontend served by nginx, PostgreSQL (in-cluster Kubernetes StatefulSet) via Knex.

## Directory tree

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── config/       db.js, env.js
│   │   ├── middleware/   auth.js, errorHandler.js, rateLimiter.js, validate.js
│   │   ├── routes/       index.js, auth.js, users.js, projects.js, tasks.js, comments.js
│   │   ├── controllers/  authController.js, userController.js, projectController.js,
│   │   │                 taskController.js, commentController.js
│   │   ├── models/       userModel.js, projectModel.js, taskModel.js, commentModel.js
│   │   ├── schemas/      authSchema.js, projectSchema.js, taskSchema.js, commentSchema.js
│   │   └── app.js
│   ├── db/
│   │   ├── migrations/   001_users, 002_projects, 003_tasks, 004_comments
│   │   └── seeds/        01_seed.js
│   ├── server.js
│   ├── knexfile.js
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── public/           index.html, login.html, register.html,
│   │                     dashboard.html, project.html, task.html, style.css
│   │   └── js/           api.js, auth.js, dashboard.js, project.js, task.js
│   ├── nginx.conf.template
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Run locally with Docker Compose

```bash
# 1. Clone / enter the project
cd taskflow

# 2. Copy env file (docker-compose sets all vars inline for local dev)
cp backend/.env.example backend/.env
# Edit backend/.env if you want to run the backend directly (not via compose)

# 3. Start everything (postgres + backend + frontend)
docker compose up --build

# 4. Seed the database (in a second terminal, after services are healthy)
docker compose exec backend npx knex seed:run --knexfile knexfile.js

# 5. Open http://localhost:8080
# Seed accounts (all password: Password123!)
#   admin@taskflow.local   (admin role)
#   alice@taskflow.local   (project owner)
#   bob@taskflow.local     (project member)
```

## Run the backend directly (no Docker)

```bash
cd backend
npm install
cp .env.example .env   # fill in real values
npm run migrate        # knex migrate:latest
npm run seed           # optional seed data
npm start              # or: npm run dev  (nodemon)
```

## Environment variables

All variables documented in `backend/.env.example`.

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | no | `development` | Set to `production` in prod |
| `PORT` | no | `3000` | Backend listen port |
| `DATABASE_URL` | * | — | Full DSN — overrides individual DB_* vars |
| `DB_HOST` | * | `localhost` | DB hostname |
| `DB_PORT` | no | `5432` | DB port |
| `DB_NAME` | * | `taskflow` | Database name |
| `DB_USER` | * | `taskflow_user` | DB user |
| `DB_PASSWORD` | yes | — | DB password |
| `DB_SSL` | no | `false` | Set `true` when connecting to a TLS-terminated DB (validates cert chain) |
| `JWT_SECRET` | yes | — | Min 32 chars, random |
| `JWT_EXPIRES_IN` | no | `7d` | Token lifetime |
| `CORS_ORIGINS` | no | — | Comma-separated allowed origins |
| `RATE_LIMIT_WINDOW_MS` | no | `900000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | no | `100` | Max requests per window per IP |

Frontend nginx container vars (set at container start via `docker run -e`):

| Variable | Required | Description |
|---|---|---|
| `BACKEND_HOST` | yes | Hostname/IP of the backend service (k8s: ClusterIP service name) |
| `BACKEND_PORT` | yes | Backend port (usually `3000`) |

## Migrations

```bash
cd backend

# Apply all pending migrations
npm run migrate

# Roll back the last batch
npm run migrate:rollback

# Create a new migration
npx knex migrate:make add_labels --knexfile knexfile.js
```

## Database (production) notes

PostgreSQL runs **in-cluster as a Kubernetes StatefulSet** — see [`k8s/`](k8s/). It is no
longer a managed RDS/Aurora instance and is not provisioned by Terraform.

- The backend connects via the `DB_*` vars — `DB_HOST=postgres.taskflow.svc.cluster.local`,
  `DB_PORT=5432`, and name/user/password from the `taskflow-secrets` Kubernetes Secret.
- `DB_SSL=false` for in-cluster traffic (pod-to-pod within the cluster network).
- The StatefulSet uses `volumeClaimTemplates`, so its data persists across pod restarts and
  rescheduling on a PersistentVolume (requires a default StorageClass, e.g. the EBS CSI driver).

## API routes

All routes prefixed `/api/v1`.

### Auth (no auth required)
| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/auth/register` | `{email, password, full_name}` | Create account, returns JWT |
| `POST` | `/auth/login` | `{email, password}` | Returns JWT |

### Users (JWT required)
| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/users/me` | — | Get current user profile |
| `PATCH` | `/users/me` | `{full_name?, email?}` | Update profile |

### Projects (JWT required)
| Method | Path | Query / Body | Description |
|---|---|---|---|
| `GET` | `/projects` | `?status=&page=&limit=` | List projects you're a member of |
| `POST` | `/projects` | `{name, description?, status?}` | Create project (you become owner) |
| `GET` | `/projects/:id` | — | Get project |
| `PATCH` | `/projects/:id` | `{name?, description?, status?}` | Update (owner only) |
| `DELETE` | `/projects/:id` | — | Delete (owner only) |
| `GET` | `/projects/:id/members` | — | List members |
| `POST` | `/projects/:id/members` | `{user_id, role?}` | Add member (owner only) |
| `DELETE` | `/projects/:id/members/:userId` | — | Remove member (owner only) |

### Tasks (JWT + project membership required)
| Method | Path | Query / Body | Description |
|---|---|---|---|
| `GET` | `/projects/:projectId/tasks` | `?status=&priority=&assignee_id=&page=&limit=` | List tasks |
| `POST` | `/projects/:projectId/tasks` | `{title, description?, status?, priority?, assignee_id?, due_date?}` | Create task |
| `GET` | `/tasks/:id` | — | Get task with assignee/creator details |
| `PATCH` | `/tasks/:id` | any task field | Update task |
| `DELETE` | `/tasks/:id` | — | Delete (task creator or project owner) |

### Comments (JWT + project membership required)
| Method | Path | Query / Body | Description |
|---|---|---|---|
| `GET` | `/tasks/:taskId/comments` | `?page=&limit=` | List comments (oldest first) |
| `POST` | `/tasks/:taskId/comments` | `{body}` | Post comment |
| `PATCH` | `/comments/:id` | `{body}` | Edit own comment |
| `DELETE` | `/comments/:id` | — | Delete (author or project owner) |

### Health
| Method | Path | Description |
|---|---|---|
| `GET` | `/healthz` | Liveness — returns `200 {status:"ok"}` always |
| `GET` | `/readyz` | Readiness — returns `200` if DB reachable, `503` otherwise |
