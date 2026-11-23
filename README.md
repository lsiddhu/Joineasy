# Joineazy – Student Group & Assignment Management System

Joineazy is a full-stack web application designed to simplify student group management and assignment tracking. Students can create or join project groups, access assigned coursework, open OneDrive resources, and confirm assignment submissions. Professors can create and manage assignments, assign work to groups or all students, monitor submission progress, and view analytics.

## Project Links

- **GitHub Repository:** https://github.com/lsiddhu/Joineasy
- **Live Demo:** To be added
- **Frontend Deployment:** To be added
- **Backend Deployment:** To be added

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS |
| Routing | React Router DOM |
| API Communication | Axios |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT, bcryptjs |
| Charts | Recharts |
| File Resources | OneDrive links |
| Version Control | Git and GitHub |
| Containerization | Docker – configuration pending |

## Application Roles

The application supports exactly two roles:

### 1. Student (`STUDENT`)

- Register and log in.
- Create a project group.
- Join an existing group using an invitation code.
- Add registered students using their email address or student ID.
- View group members, leader details, and available slots.
- View assignments assigned to all students or their group.
- Open assignment resources through OneDrive.
- Complete the two-step submission confirmation process.
- View group submission progress.

**Group restriction:** Each student can belong to only one group, and each group can contain a maximum of four students.

### 2. Professor (`PROFESSOR`)

- Log in through the professor login interface.
- Create assignments with a title, description, due date, and OneDrive resource link.
- Assign work to all students or selected groups.
- Edit existing assignments.
- View created assignments.
- Track student submission confirmation statuses.
- Monitor group-wise submission progress.
- View overall and assignment-level analytics.

## Core Features

### Authentication and Authorization

- Student registration and login.
- Separate professor login.
- Password hashing using bcryptjs.
- JWT-based authentication.
- Protected API routes using authentication middleware.
- Role-based access control.
- Persistent authentication state using browser local storage.

### Group Management

- Create groups with unique invitation codes.
- Join groups using invitation codes.
- Add registered students by email or student ID.
- Enforce a maximum group size of four.
- Restrict students to one group.
- Display group leader and member information.

### Assignment Management

- Create and edit assignments.
- Assign assignments to all students or selected groups.
- Store OneDrive resource links.
- Set assignment deadlines.
- Display assignments according to student eligibility.

### Two-Step Submission Confirmation

The application implements a two-step confirmation workflow:

1. **Start confirmation:** The student initiates the submission confirmation process.
2. **Final confirmation:** The student confirms that the assignment has been submitted.

The backend stores the confirmation status and timestamp, allowing professors to track submission progress.

### Progress Tracking and Analytics

- Student group progress.
- Assignment-level submission status.
- Confirmed, pending, and not-started statuses.
- Group completion summaries.
- Professor dashboard statistics.
- Assignment completion percentages and charts.

## System Architecture

The application follows a client-server architecture.

```text
                 STUDENT / PROFESSOR
                         |
                         v
                React Frontend (Vite)
                         |
                  React Router
                         |
                    Axios API
                         |
                         v
                 Express.js Backend
                         |
                  JWT Middleware
                         |
              Controllers and Routes
                         |
                         v
                    Prisma ORM
                         |
                         v
                  PostgreSQL DB
```

The React frontend communicates with the Express backend through REST API endpoints. The backend validates requests, checks authentication and authorization, executes database operations through Prisma, and returns JSON responses.

## Database Design

The database uses PostgreSQL with Prisma ORM.

### Main Entities

| Entity | Description |
|---|---|
| User | Stores student and professor account information |
| Group | Stores group details, invitation codes, and group leaders |
| Assignment | Stores assignment details, deadlines, and professor ownership |
| AssignmentGroup | Connects assignments with their target groups |
| SubmissionConfirmation | Stores student assignment confirmation status and timestamps |

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Group : leads
    User }o--o| Group : belongs_to
    User ||--o{ Assignment : creates
    Group ||--o{ AssignmentGroup : receives
    Assignment ||--o{ AssignmentGroup : targets
    User ||--o{ SubmissionConfirmation : submits
    Assignment ||--o{ SubmissionConfirmation : tracks

    User {
        int id PK
        string name
        string email UK
        string studentId UK
        string password
        enum role
        int groupId FK
    }

    Group {
        int id PK
        string name
        string inviteCode UK
        int leaderId FK
    }

    Assignment {
        int id PK
        string title
        text description
        string oneDriveUrl
        datetime dueDate
        boolean assignToAll
        int professorId FK
    }

    AssignmentGroup {
        int id PK
        int assignmentId FK
        int groupId FK
    }

    SubmissionConfirmation {
        int id PK
        int assignmentId FK
        int studentId FK
        boolean confirmed
        datetime confirmedAt
    }
```

## Project Structure

```text
Joineazy/
│
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── layouts/
│       ├── pages/
│       ├── services/
│       ├── App.jsx
│       └── main.jsx
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seedProfessor.js
│   ├── app.js
│   └── server.js
│
├── .gitignore
└── README.md
```

## API Documentation

All backend routes are mounted under `/api`.

Protected endpoints require a JWT access token:

`Authorization: Bearer <JWT_TOKEN>`

### Authentication APIs

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a student |
| POST | `/api/auth/login` | Public | Student login |
| POST | `/api/auth/professor/login` | Public | Professor login |

### Group APIs

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/groups` | Student | Create a group |
| POST | `/api/groups/join` | Student | Join using invitation code |
| GET | `/api/groups/my-group` | Student | Retrieve current group |
| POST | `/api/groups/add-member` | Student | Add a group member |

### Assignment APIs

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/assignments` | Professor | Create an assignment |
| PUT | `/api/assignments/:id` | Professor | Edit an assignment |
| GET | `/api/assignments` | Professor | List professor assignments |
| GET | `/api/assignments/student` | Student | View assigned coursework |
| POST | `/api/assignments/:id/submission/start` | Student | Start confirmation |
| POST | `/api/assignments/:id/submission/confirm` | Student | Confirm submission |
| GET | `/api/assignments/student/group-progress` | Student | View group progress |
| GET | `/api/assignments/:id/submission-status` | Professor | Track assignment submissions |
| GET | `/api/assignments/professor/analytics` | Professor | View professor analytics |

## Installation and Setup

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/lsiddhu/Joineasy.git
cd Joineasy
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory:

```env
PORT=5001
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/joineazy_db?schema=public"
JWT_SECRET="your_secure_random_secret"
JWT_EXPIRES_IN="1d"

PROFESSOR_NAME="Joineazy Professor"
PROFESSOR_EMAIL="professor@joineazy.com"
PROFESSOR_PASSWORD="your_secure_professor_password"
```

Replace the database credentials and professor password with your own values. Never commit this file.

### 3. Database Setup

Create a PostgreSQL database named `joineazy_db`.

Run the Prisma migrations:

```bash
npx prisma migrate deploy
npx prisma generate
```

Seed the initial professor account:

```bash
node prisma/seedProfessor.js
```

### 4. Start the Backend

```bash
npm run dev
```

The backend runs at:

`http://localhost:5001`

### 5. Frontend Setup

Open another terminal:

```bash
cd client
npm install
```

Start the frontend:

```bash
npm run dev
```

The frontend usually runs at:

`http://localhost:5173`

The frontend API base URL defaults to `http://localhost:5001/api`. If required, configure `VITE_API_URL` in `client/.env`.

## Testing

Backend API endpoints were tested during development using Thunder Client in VS Code.

The frontend production build can be checked using:

```bash
cd client
npm run build
```

## Known Limitations and Future Improvements

- A dedicated professor API to retrieve all available groups is still needed for complete group selection when creating assignments.
- Student assignment responses need to expose authoritative per-assignment confirmation records and timestamps for fully synchronized student-side submission status.
- Docker configuration and containerized deployment are still pending.
- Production deployment and live demo links will be added once hosting is configured.

## Author

**Siddharth**

GitHub: https://github.com/lsiddhu

---

This project was developed as part of a full-stack development assignment using React, Node.js, Express, PostgreSQL, and Prisma.
