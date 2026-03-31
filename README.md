<div align="center">

# 🚀 FlowBoard

### Beautiful full-stack project management for modern teams

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248.svg)](https://mongodb.com)

> A production-quality Kanban board inspired by Trello, Notion, and Linear.
> Built as a portfolio-level full-stack project.

---

![FlowBoard Screenshot](docs/screenshot-board.png)

</div>

---

## ✨ Features

### 🗂️ Task Management
- Create, edit, delete tasks with rich details
- Priority levels: **Low / Medium / High** with color-coded badges
- Status columns: **To Do → In Progress → Done**
- Due dates with overdue highlighting
- Tag system for categorisation
- Description with full markdown-style preview

### 🎯 Kanban Board
- Smooth **drag-and-drop** between columns (@hello-pangea/dnd)
- Animated drop-zone highlights
- Optimistic UI updates — no waiting for the server

### 💬 Comments
- Per-task comment threads
- Real-time comment sync via Socket.io
- Delete your own comments

### 📊 Analytics
- KPI cards: total, completed, in-progress, overdue
- Priority distribution bar charts
- Status breakdown with visual stacked bar
- Overall completion progress ring

### 🔐 Authentication
- JWT-based auth with bcrypt password hashing
- Persistent sessions via localStorage
- Protected routes — each user sees only their own tasks
- Auto-logout on token expiry

### ⚡ Real-Time (Socket.io)
- Task create / update / delete events sync instantly
- Comment events scoped to task rooms

### 🎨 UI/UX
- **Light & dark mode** (system preference + manual toggle)
- Framer Motion animations throughout
- Fully responsive (mobile + desktop)
- Toast notifications for every action
- Hover lift effects on cards

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Animations | Framer Motion |
| Drag & Drop | @hello-pangea/dnd |
| HTTP Client | Axios |
| Routing | React Router v6 |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| Real-time | Socket.io |
| Fonts | Outfit, DM Sans (Google Fonts) |

---

## 📁 Project Structure

```
flowboard/
├── client/                   # React frontend (Vite)
│   └── src/
│       ├── components/
│       │   ├── auth/         # AuthForm
│       │   ├── board/        # Column, TaskCard, TaskForm, TaskDetailModal
│       │   ├── comments/     # CommentsPanel
│       │   ├── analytics/    # AnalyticsPanel
│       │   ├── layout/       # Navbar, Sidebar
│       │   └── ui/           # Modal, Avatar, Badge, Spinner…
│       ├── context/          # AuthContext, TaskContext, ThemeContext
│       ├── hooks/            # useComments
│       ├── pages/            # BoardPage, AnalyticsPage, LoginPage, SignupPage
│       └── services/         # api.js (Axios), socket.js (Socket.io)
│
└── server/                   # Express backend
    ├── config/               # db.js (Mongoose connection)
    ├── controllers/          # authController, taskController, commentController
    ├── middleware/           # auth.js (JWT protect), errorHandler.js
    ├── models/               # User, Task, Comment
    ├── routes/               # auth, tasks, comments
    └── socket/               # Socket.io event handlers
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local install or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/flowboard.git
cd flowboard
```

### 2. Configure environment variables
```bash
cp server/.env.example server/.env
```
Edit `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/flowboard
JWT_SECRET=your_very_long_random_secret_here
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

### 3. Install all dependencies
```bash
npm run install:all
```

### 4. Start development servers
```bash
npm run dev
```
This starts both the backend (port 5000) and frontend (port 5173) concurrently.

### 5. Open in browser
```
http://localhost:5173
```

---

## 🌐 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login`  | Login + get JWT |
| GET  | `/api/auth/me`     | Get current user (protected) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/tasks`            | Get all tasks (filterable) |
| GET    | `/api/tasks/analytics`  | Get analytics data |
| POST   | `/api/tasks`            | Create a task |
| PUT    | `/api/tasks/:id`        | Update a task |
| DELETE | `/api/tasks/:id`        | Delete a task |

#### Query params for `GET /api/tasks`
- `?search=keyword` — search title, description, tags
- `?priority=high|medium|low`
- `?status=todo|inprogress|done`

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/comments/:taskId` | Get comments for task |
| POST   | `/api/comments`         | Create comment |
| DELETE | `/api/comments/:id`     | Delete own comment |

---

## ⚡ Socket.io Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `taskCreated` | server → client | task object |
| `taskUpdated` | server → client | task object |
| `taskDeleted` | server → client | task id string |
| `commentAdded`   | server → room | comment object |
| `commentDeleted` | server → room | comment id |
| `joinRoom`  | client → server | `{ userId }` |
| `joinTask`  | client → server | `{ taskId }` |
| `leaveTask` | client → server | `{ taskId }` |

---

## 🔮 Future Improvements

- [ ] Team workspaces with role-based access (Admin / Member / Viewer)
- [ ] File attachments on tasks (S3 or Cloudinary)
- [ ] Email notifications for due dates and assignments
- [ ] Markdown support in task descriptions
- [ ] Keyboard shortcuts (N = new task, / = search)
- [ ] Board templates (Sprint, Bug Tracker, Roadmap)
- [ ] Activity feed / audit log per board
- [ ] Export board to CSV / PDF
- [ ] Recurring tasks
- [ ] Mobile app (React Native)

---

## 📸 Screenshots

| Board (Dark) | Board (Light) | Analytics |
|---|---|---|
| ![dark](docs/screenshot-dark.png) | ![light](docs/screenshot-light.png) | ![analytics](docs/screenshot-analytics.png) |

---

## 📄 License

MIT © 2024 — Built with ❤️ for portfolios and hackathons.
