# PrereqGraph

Choose a subject, find out what you actually know, see the prerequisite graph, and get a personalised learning path to any target concept.

**Stack:** React + Vite + Tailwind + React Flow + Axios · Node.js + Express · MongoDB + Mongoose · JWT + bcrypt · Zod · Jest + Supertest

The dependency logic lives in the backend. React only displays what the API returns.

## How it works

```
React (Dashboard, Graph Explorer, Quiz, Learning Path, Profile)
        │  HTTP / JSON (Axios, JWT)
Express  routes -> middleware -> controllers -> services
        ├─ graphService            adjacency list, DFS, BFS, cycle detection, topological sort, learning path
        ├─ recommendationService   progress + graph -> statuses, actions, "study next"
        └─ assessmentService       quiz scoring, mastery updates, attempt history
MongoDB  users, subjects, concepts, dependencies, quizzes, userprogresses, attempts
```

Learning path for a target concept (`GET /api/users/me/learning-path/:targetId`):

1. Load the subject's concepts and dependency edges and build the adjacency list.
2. DFS backwards from the target finds every direct and indirect prerequisite.
3. Kahn's topological sort puts prerequisites before the concepts that need them.
4. The student's progress is applied to each step: **skip** (mastered), **revise** (weak), **take_quiz** (not assessed).
5. The target is **locked** until every prerequisite is mastered, then **ready**.

The path is computed on every request, so it recalculates automatically whenever progress changes.

Design decisions:

- **Mastery threshold** is per student (default 70%, changeable on the profile page).
- **Quiz scoring** is difficulty weighted: easy 1, medium 2, hard 3 points. Unanswered counts as wrong.
- **Dependencies are validated.** Creating one (admin only) runs cycle detection first, and the seed script refuses a cyclic curriculum.
- **The graph is admin managed.** Public sign-ups are always students; only admins can add subjects, concepts and dependencies.
- **Attempts are kept** in their own collection. `UserProgress` holds the current state, one record per student and concept (unique compound index).

## Run it locally

You need Node 18+ and a MongoDB (local `mongod` or a free MongoDB Atlas cluster).

```bash
# 1. Backend
cd backend
cp .env.example .env        # set MONGO_URI and a long random JWT_SECRET
npm install
npm run seed                # 31 DSA concepts, 51 dependencies, a 3-question quiz per concept, demo admin
npm run dev                 # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173  (/api is proxied to :5000)
```

Demo admin created by the seed: `admin@prereqgraph.dev` / `admin1234`. Change it outside local development (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
Register a normal student account in the UI to try the full flow.

## API

All routes except register and login need `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register`, `/api/auth/login` | Create account / log in |
| GET, PATCH | `/api/auth/me` | Profile, mastery threshold |
| GET | `/api/subjects` | List subjects |
| GET | `/api/subjects/:id/concepts` | Concepts of a subject |
| GET | `/api/subjects/:id/graph` | Whole graph with your status on each node |
| GET | `/api/concepts/:id` | Concept, direct prerequisites, what it unlocks |
| GET | `/api/concepts/:id/graph` | Target plus its prerequisites, with statuses |
| GET | `/api/concepts/:id/prerequisites` | All prerequisites in a valid learning order |
| GET | `/api/concepts/:id/quiz` | Quiz without the answers |
| POST | `/api/quizzes/:id/submit` | Submit answers: score, per-question result, progress update |
| GET | `/api/users/me/progress` | Your progress per concept |
| GET | `/api/users/me/learning-path/:targetId` | Personalised path |
| PATCH | `/api/users/me/progress/:conceptId` | Mark complete / set score |
| GET | `/api/users/me/dashboard` | Subject progress, weak concepts, what to study next |
| GET | `/api/users/me/attempts` | Assessment history |
| POST | `/api/subjects`, `/api/concepts`, `/api/dependencies` | Admin: manage the curriculum (cycles rejected) |
| DELETE | `/api/dependencies/:id` | Admin: remove a dependency |

## Tests

```bash
cd backend
npm test
```

77 tests cover the graph algorithms (spec example, diamonds, disconnected graphs, self loops, cycles, a 20,000-node chain), the seed curriculum (acyclic, references resolve, Dynamic Programming needs exactly Variables, Functions, Recursion and Arrays), quiz scoring, recommendations, and the whole API (auth, roles, cycle rejection, quiz to progress to path recalculation).

The API tests need a running MongoDB and wipe the database named in `MONGO_URI_TEST` (default `mongodb://127.0.0.1:27017/prereqgraph_test`).

## Deploy

- **Database:** create a MongoDB Atlas cluster and use its connection string as `MONGO_URI`. Run `npm run seed` once against it.
- **Backend:** deploy `backend/` to Render, Railway or Fly. Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (your frontend URL) and `NODE_ENV=production`. Start command: `npm start`.
- **Frontend:** deploy `frontend/` to Vercel or Netlify (build `npm run build`, output `dist`). Set `VITE_API_URL` to `https://<your-backend>/api`. Add a rewrite of all routes to `/index.html` so React Router deep links work.

## Ideas for later

Faculty-contributed concepts, one document per quiz question with adaptive difficulty, spaced-repetition reminders, per-concept resources, Docker compose.
