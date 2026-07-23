# Task Management System

A high-fidelity Full-Stack Task Management System built with React, TypeScript, Node.js (Express), and PostgreSQL (via Prisma). The application features secure token-based user authentication (with access & refresh token rotation), a responsive dashboard displaying real-time task statistics, full CRUD capabilities for tasks, pagination, dynamic search, multi-filtering, sorting, light/dark mode theme support, Jest unit tests, and full Docker containerization.

---

## Technology Stack

*   **Frontend**: React (Vite), TypeScript, Tailwind CSS v4, Lucide React icons, React Hook Form, Zod.
*   **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, Zod, Bcrypt, JsonWebToken.
*   **Database**: PostgreSQL (v15).
*   **Testing**: Jest, ts-jest.
*   **DevOps / Containerization**: Docker, Docker Compose, Nginx.

---

## Project Structure

```
project/
├── frontend/             # React SPA client code
│   ├── src/
│   │   ├── api/          # Axios instance configurations
│   │   ├── components/   # Shared components (ThemeToggle, TaskModal, ProtectedRoute)
│   │   ├── context/      # Authentication state providers
│   │   ├── pages/        # Main pages (Login, Dashboard)
│   │   └── App.tsx       # Routing and core shell setup
│   ├── Dockerfile
│   └── nginx.conf        # Production SPA server config
├── backend/              # Express API server code
│   ├── src/
│   │   ├── controllers/  # Route controller logic
│   │   ├── middlewares/  # Express middlewares (auth, validation, error)
│   │   ├── routes/       # Endpoint paths
│   │   ├── utils/        # JWT & Error helper utilities
│   │   └── tests/        # Jest unit tests
│   ├── prisma/           # Schema definitions and seeding script
│   └── Dockerfile
├── database/
│   └── schema.sql        # Plain SQL database schema dump
├── docker-compose.yml    # Root Docker orchestration setup
└── README.md             # Project documentation
```

---

## Environment Variables

Copy the `.env.example` in the root directory to your respective environments, or write them directly:

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://postgres:2006ramidu@localhost:5432/tms_db?schema=public"
JWT_SECRET="super_secret_jwt_access_token_key_2026"
JWT_REFRESH_SECRET="super_secret_jwt_refresh_token_key_2026"
PORT=5000
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL="http://localhost:5000/api"
```

---

## Local Setup & Installation

### Prerequisite
Ensure you have **Node.js (v22+)** and a **PostgreSQL** instance running locally on port 5432.

### Step 1: Clone and install dependencies
```bash
# Install backend dependencies
cd backend
npm install --legacy-peer-deps

# Install frontend dependencies
cd ../frontend
npm install --legacy-peer-deps
```

### Step 2: Database Setup & Seeding (via Prisma)
In the `backend/` folder, run:
```bash
# Create database tables and apply initial migration
npx prisma migrate dev --name init

# Generate Prisma Client classes
npx prisma generate

# Seed the database with default credentials
npx prisma db seed
```
*(The default credentials are: **Email:** `admin@test.com`, **Password:** `123456`)*

### Step 3: Run the project
Start the backend Express server:
```bash
cd backend
npm run dev
```

Start the frontend Vite React server:
```bash
cd ../frontend
npm run dev
```
Open your browser to `http://localhost:5173`.

---

## Docker Support

You can spin up the entire application stack (PostgreSQL, Backend API, and Frontend) in one command using Docker Compose:

```bash
# Run from the root directory
docker-compose up --build
```
*   The **Frontend Web Client** is mapped to `http://localhost:3000`.
*   The **Backend Server API** is mapped to `http://localhost:5000`.
*   The **PostgreSQL Database** is exposed on `http://localhost:5432` with username `postgres`, password `2006ramidu`, and database name `tms_db`.

To stop the containers:
```bash
docker-compose down -v
```

---

## Running Tests

We have implemented unit tests for our core cryptographic and JWT security logic. To run the test suite:

```bash
cd backend
npm run test
```

---

## REST API Documentation

### Authentication Endpoints
*   **POST** `/api/auth/login` - Authenticate credentials and establish HttpOnly cookies session.
    *   *Body*: `{ "email": "admin@test.com", "password": "123456" }`
*   **POST** `/api/auth/refresh` - Refresh access tokens using database-backed rotation.
*   **POST** `/api/auth/logout` - Revoke session tokens and clear client cookies.
*   **GET** `/api/auth/me` - Retrieve profile info for the currently authenticated user.

### Task Management Endpoints (Requires Authentication)
*   **GET** `/api/tasks` - Retrieve tasks page list.
    *   *Query Options*:
        *   `search` (string): filter by title match (case-insensitive).
        *   `status` (PENDING | IN_PROGRESS | COMPLETED): filter by status.
        *   `priority` (LOW | MEDIUM | HIGH): filter by priority.
        *   `sortBy` (newest | oldest | dueDate): sort tasks.
        *   `page` (number): pagination index (defaults to 1).
*   **GET** `/api/tasks/stats` - Get counters for Total, Pending, In Progress, Completed, and Overdue tasks.
*   **GET** `/api/tasks/:id` - Fetch single task details by ID.
*   **POST** `/api/tasks` - Create a new task.
    *   *Body*: `{ "title": "string", "description": "string", "priority": "LOW/MEDIUM/HIGH", "status": "PENDING/IN_PROGRESS/COMPLETED", "dueDate": "YYYY-MM-DD" }`
*   **PUT** `/api/tasks/:id` - Update existing task fields.
*   **DELETE** `/api/tasks/:id` - Remove a task from the system.

---

## Assumptions & Design Decisions

1.  **Strict Security with HttpOnly Cookies**: To secure the application against Cross-Site Scripting (XSS), the access and refresh tokens are served and processed inside `HttpOnly` and `SameSite: Lax` cookies. The frontend Axios client sets `withCredentials: true` to auto-attach them. A fallback fallback mechanism is also in place supporting custom request body headers.
2.  **Token Rotation**: Refresh tokens are single-use. Every time a refresh request is made, a database transaction revokes the old refresh token and rotates it with a newly signed token.
3.  **Overdue Status Definition**: A task is flagged as overdue if its status is not `COMPLETED` and its due date is strictly earlier than the start of the current day.
4.  **Due Date Validation**: Zod validators enforce that new or updated task due dates cannot be earlier than today, ignoring timezone details to allow setting tasks due today.
5.  **User Scoping**: All database tasks query scopes are isolated per `userId` to ensure data security.

---

## Known Limitations

1.  **Registration Page**: Per design requirements, no registration interface has been built. The default user is seeded in the database.
2.  **Prisma 7 Drivers**: Prisma 7 relies on client driver adapters (`@prisma/adapter-pg` and `pg`) rather than the native Rust query engine. If you compile the app, ensure Node dependencies are installed.
