# Joineazy

Joineazy is a full-stack student group and assignment portal. Students can create or join a project group, review assigned coursework, open OneDrive resources, and confirm submissions. Professors can manage assignments and review submission progress and analytics.

## Project structure

```text
Joineazy/
├── client/                 # React 19 + Vite frontend
│   └── src/
│       ├── components/     # Shared UI, navigation, status and route guards
│       ├── context/        # JWT-backed authentication state
│       ├── layouts/        # Student and professor workspace layouts
│       ├── pages/          # Authentication and role-specific screens
│       └── services/       # Axios configuration and API wrappers
└── server/                 # Express API, Prisma schema and migrations
```

The only application roles are `STUDENT` and `PROFESSOR`.

## Requirements

- Node.js 20.19+ or 22.12+ (required by the installed Vite version)
- npm
- PostgreSQL for the server database

## Configuration

Create `server/.env` for the backend. Keep this file private and never copy its secrets into the client.

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/joineazy_db?schema=public"
JWT_SECRET="a-long-random-secret"
JWT_EXPIRES_IN="1d"
PORT=5001
```

The frontend has an optional `client/.env` setting. Vite exposes `VITE_*` variables to the browser, so this value must only contain the public API origin and path; do not put credentials or signing secrets here.

```dotenv
VITE_API_URL=http://localhost:5001/api
```

When `VITE_API_URL` is omitted, the client uses `http://localhost:5001/api`.

## Install and run

Install dependencies in each project folder:

```sh
cd server
npm install
```

```sh
cd client
npm install
```

Set up the database from the repository root or from `server`:

```sh
cd server
npx prisma migrate deploy
npx prisma generate
```

The repository includes `server/prisma/seedProfessor.js` for creating the initial professor. Review that script and configure its inputs according to your environment before running it. Do not commit real credentials.

Start the API and Vite development server in separate terminals:

```sh
cd server
npm run dev
```

```sh
cd client
npm run dev
```

The Express server defaults to port `5001`. Vite prints the frontend URL (usually `http://localhost:5173`). The backend enables CORS for development.

## Frontend capabilities

### Authentication

- Student registration sends `name`, `email`, `studentId`, and `password`.
- Student and professor login use their role-specific API routes.
- Successful login stores the JWT and profile in `localStorage`; Axios attaches the JWT as a Bearer token.
- A `401` response clears the stored session. Protected routes enforce the two backend roles and route users to their matching workspace.
- Sidebar profile control signs out.

### Student workspace

- Dashboard shows assignments, group details, group submission progress, and (when the student is in a group) completed and pending counts from the group progress response.
- Group management supports creating a group, joining by invite code, adding members by email or student ID, leader display, member list, four-person capacity, and open slots.
- Assignments show due dates and deadlines, OneDrive links, local status labels, the confirmation flow, and confirmation time when it was recorded in the current browser.

### Professor workspace

- Dashboard displays assignment and student counts, total eligible submissions, confirmed and pending counts, completion percentage, an assignment chart, and recent assignments.
- Assignment management supports creation, editing, assign-to-all or selected-group targeting, search, and progress navigation.
- Assignment details show eligible student status, student email and ID, group completion counts, and confirmation timestamps.
- Analytics show aggregate completion measures and assignment-level charts and breakdowns.

### Shared interface

The sidebar, navbar, profile area, common inputs, buttons, cards, loading state, alerts, empty states, and confirmation modal are reusable. Layouts adapt to mobile navigation and narrow screens.

## API routes used by the client

All routes are mounted under `/api` by the Express app. Protected calls send `Authorization: Bearer <JWT>`.

| Method | Route | Role | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Create student account (`name`, `email`, `studentId`, `password`) |
| `POST` | `/auth/login` | Public | Student login (`email`, `password`) |
| `POST` | `/auth/professor/login` | Public | Professor login (`email`, `password`) |
| `POST` | `/groups/` | Student | Create a group (`name`) |
| `POST` | `/groups/join` | Student | Join a group (`inviteCode`) |
| `GET` | `/groups/my-group` | Student | Retrieve current group, members, leader, invite code and capacity |
| `POST` | `/groups/add-member` | Student | Add a student with exactly one of `email` or `studentId` |
| `POST` | `/assignments/` | Professor | Create assignment (`title`, `description`, `oneDriveUrl`, `dueDate`, `assignToAll`, `groupIds`) |
| `PUT` | `/assignments/:id` | Professor | Edit assignment with the same fields |
| `GET` | `/assignments/` | Professor | List professor-created assignments |
| `GET` | `/assignments/student` | Student | List assignments for the student or their group |
| `POST` | `/assignments/:id/submission/start` | Student | Start the confirmation flow |
| `POST` | `/assignments/:id/submission/confirm` | Student | Confirm submission; response includes the confirmation record and timestamp |
| `GET` | `/assignments/student/group-progress` | Student | Return group and member-level confirmed assignment counts |
| `GET` | `/assignments/:id/submission-status` | Professor | Return assignment summary, group summary and student status rows |
| `GET` | `/assignments/professor/analytics` | Professor | Return overall and assignment-level completion aggregates |

## Current API limitations

The client uses the APIs present in `server/routes`. Two requested views cannot yet be populated completely from the backend:

1. **Discover all groups for professor assignment targeting:** the professor API has no group-list route. The assignment editor derives group choices from groups already included in the professor's existing assignment responses. New or never-assigned groups therefore cannot be discovered in that selector.
2. **Retrieve a student's status for each assignment:** the student assignments response does not include the current student's confirmation record. Group progress includes a member's aggregate completed-assignment count but not the assignment IDs, pending rows, or timestamps. The client caches flow state per student in that browser's local storage; this is a convenience cache, not authoritative backend status and does not synchronize across devices. The professor tracking endpoint does return the authoritative status and confirmation timestamp.

These gaps require backend routes/response updates. This frontend work did not change the backend or Prisma schema.

## Build

```sh
cd client
npm run build
```

The build currently succeeds. Vite may print a bundle-size advisory because the main JavaScript bundle is over 500 kB minified; this is a performance warning, not a build failure.
