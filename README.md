# 🚀 SyncBoard – Real-Time Collaborative Project Management Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18+-68a063.svg?style=flat&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?style=flat&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg?style=flat&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38b2ac.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101.svg?style=flat&logo=socket.io)](https://socket.io)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47a248.svg?style=flat&logo=mongodb)](https://mongodb.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

SyncBoard is a full-stack, real-time project management application inspired by modern Kanban-based productivity tools. It enables teams to organize projects, manage tasks, collaborate with workspace members, and track progress through an interactive dashboard.

Built with React, Node.js, Express, MongoDB, and Socket.IO, SyncBoard provides seamless task management with real-time synchronization, role-based access control, and workspace-level collaboration.

---

## ✨ Key Features

### 1. Kanban Boards & Drag-and-Drop
- Interactive Kanban boards with customizable lists and task cards.
- Drag and drop lists horizontally.
- Move and reorder task cards vertically or between columns.
- Powered by `@dnd-kit`.
- Fractional position calculations for efficient task ordering.
- Persistent board updates stored in MongoDB.

### 2. Task Management
- Create, edit, and manage task cards.
- Four priority levels: Low, Medium, High, and Urgent.
- Assign multiple workspace members to tasks.
- Checklists with real-time completion progress.
- Due dates with overdue indicators.
- Custom tags and color-coded badges.
- Threaded comments with edit and delete permissions.
- Complete task activity and audit history.

### 3. Workspace Management & Role-Based Access Control
- Create and switch between multiple workspaces.
- Invite members through email.
- Manage workspace member roles.
- Admin and Member permission levels.
- Backend API authorization and role enforcement.

### 4. Real-Time Collaboration
- Real-time updates using Socket.IO.
- JWT-authenticated socket connections.
- Workspace, board, and user-level socket rooms.
- Instant synchronization of task movements, edits, and comments.
- Workspace isolation to prevent unauthorized data sharing.

### 5. Dashboard & Analytics
- Total Boards and Total Tasks.
- Assigned to Me.
- In Progress and Completed Tasks.
- Overdue Task Tracking.
- Tasks by Priority visualization using Recharts.
- Completion Velocity visualization.
- Upcoming deadlines and recent team activity.

### 6. Calendar & My Tasks
- Monthly calendar with task deadlines.
- Month navigation.
- Quick access to task details.
- Dedicated My Tasks section.
- Search and filter tasks by priority and status.
- List and grid viewing modes.

### 7. Notifications & Activity Tracking
- In-app notification center.
- Unread notification counter.
- Real-time notification updates.
- Workspace activity audit trail.
- Actor information and timestamps.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router DOM v6 |
| **Styling** | Tailwind CSS (indigo/violet design system, dark mode) |
| **Drag & Drop** | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| **Backend** | Node.js (ES Modules), Express.js |
| **Database** | MongoDB with Mongoose ODM |
| **Real-Time Communication** | Socket.IO (with JWT authorization) |
| **Authentication** | JWT, bcryptjs |
| **Security** | Helmet, CORS, express-rate-limit |
| **Validation** | express-validator |
| **Charts** | Recharts |
| **Testing** | Vitest, Supertest |
| **Version Control** | Git, GitHub |

---

## 🏗️ Application Architecture

SyncBoard follows a decoupled client-server architecture:

- **Frontend:** React SPA responsible for user interface, task interactions, boards, dashboards, and calendar.
- **Backend:** Express.js REST API responsible for business logic, authentication, authorization, and data persistence.
- **Database:** MongoDB stores users, workspaces, boards, tasks, comments, notifications, and activity records.
- **Real-Time Engine:** Socket.IO handles authenticated connections and broadcasts updates to relevant workspace and board rooms.

---

## 📁 Project Structure

```
syncboard/
├── package.json               # Root scripts for client and server
├── .gitignore                 # Root gitignore excluding node_modules, .env, build output
├── README.md                  # Comprehensive project documentation
├── LICENSE                    # MIT License
├── client/                    # Frontend React + Vite application
│   ├── package.json
│   ├── vite.config.js         # Port 5173 with proxy to backend port 5000
│   ├── tailwind.config.js     # Custom design system & dark mode
│   ├── postcss.config.js
│   ├── index.html
│   ├── .env.example
│   └── src/
│       ├── main.jsx, App.jsx, index.css
│       ├── api/ (axios.js with JWT interceptors)
│       ├── context/ (AuthContext, WorkspaceContext, SocketContext, ThemeContext)
│       ├── components/
│       │   ├── common/ (Button, Avatar, Badge, Modal, ConfirmModal, EmptyState, Skeleton)
│       │   ├── layout/ (Sidebar, TopNav, AppLayout)
│       │   ├── workspace/ (WorkspaceSwitcher, WorkspaceSettingsModal, InviteMemberModal)
│       │   ├── boards/ (BoardCard, CreateBoardModal, FilterBar)
│       │   ├── lists/ (ListColumn with dnd-kit SortableContext)
│       │   ├── cards/ (TaskCard, TaskDetailModal)
│       │   └── notifications/ (NotificationBell)
│       └── pages/ (Landing, Login, Register, ForgotPassword, ResetPassword,
│                  Dashboard, Boards, BoardDetail, MyTasks, Calendar, Activity, Notifications)
└── server/                    # Backend Node.js + Express + Socket.IO application
    ├── package.json
    ├── .env.example           # Example environment template
    ├── .gitignore
    ├── src/
    │   ├── app.js             # Express app setup, security headers, routes, error handling
    │   ├── server.js          # HTTP server, Socket.IO initialization, port listening
    │   ├── seed.js            # Database seeder with realistic demo data and accounts
    │   ├── config/            # Database connection (db.js) & environment parsing (env.js)
    │   ├── models/            # User, Workspace, Board, List, Card, Comment, Activity, Notification, Invitation
    │   ├── middleware/        # authMiddleware, workspaceAuth (strict RBAC), errorHandler, validate
    │   ├── controllers/       # auth, workspace, board, list, card, comment, activity, notification, dashboard, calendar
    │   ├── routes/            # Modular REST API endpoints
    │   ├── services/          # activityService, notificationService
    │   └── sockets/           # socketHandler (JWT auth handshake, workspace/board rooms)
    └── tests/                 # Vitest + Supertest integration test suite
```

---

## 📋 Prerequisites

- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **npm:** v9.0.0 or higher
- **MongoDB:** Local MongoDB instance running on port `27017` or MongoDB Atlas URI

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/julie249/SyncBoard.git
cd SyncBoard
```

### 2. Install Dependencies

Install dependencies for the server and client:

```bash
# In the project root:
cd server && npm install
cd ../client && npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the `server` directory:

```bash
# Copy example configuration
cp server/.env.example server/.env
```

Configure `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/syncboard
JWT_ACCESS_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
CLIENT_URL=http://localhost:5173
COOKIE_SECURE=false
NODE_ENV=development
```

### 4. Seed Demo Data (Optional)

Populate the database with demo users, workspaces, boards, task cards, checklists, comments, and activities:

```bash
npm run seed
```

#### Demo Accounts:
| Role | Email | Password |
|---|---|---|
| **Workspace Admin** | `admin@syncboard.dev` | `Password123!` |
| **Team Member** | `alex@syncboard.dev` | `Password123!` |
| **Team Member** | `sara@syncboard.dev` | `Password123!` |

*(Note: The login page includes 1-click "Quick Fill" demo buttons for instant access.)*

---

## 🏃 Running the Application

### Development Mode

Open two terminal windows:

#### Terminal 1: Backend Server (Port 5000)
```bash
cd server
npm run dev
```

#### Terminal 2: Frontend Client (Port 5173)
```bash
cd client
npm run dev
```

Open your browser to: **`http://localhost:5173`**

### Production Build

```bash
npm run build
```

---

## 🧪 Testing

Run backend integration tests:

```bash
npm test
# Or inside server directory:
cd server && npm test
```

All integration tests verify:
- Health check endpoints
- JWT authentication and bad password rejection
- Workspace RBAC permissions
- Board list & card population
- Drag-and-drop card movement persistence
- Notification unread counters
- Real MongoDB metric calculations

---

## 📡 Socket.IO Real-Time Events Reference

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `board:join` | Client -> Server | `{ boardId }` | Subscribes socket to board room |
| `board:leave` | Client -> Server | `{ boardId }` | Unsubscribes socket from board room |
| `workspace:join` | Client -> Server | `{ workspaceId }` | Subscribes socket to workspace room |
| `workspace:leave` | Client -> Server | `{ workspaceId }` | Unsubscribes socket from workspace room |
| `card:created` | Server -> Board Room | `Card` object | Broadcasts newly created task card |
| `card:updated` | Server -> Board Room | `Card` object | Broadcasts card edits, labels, checklist updates |
| `card:moved` | Server -> Board Room | `{ card, sourceListId, destinationListId, newPosition }` | Broadcasts live drag-and-drop movements |
| `card:deleted` | Server -> Board Room | `{ cardId, listId }` | Broadcasts card removal |
| `list:created` | Server -> Board Room | `List` object | Broadcasts new column added to board |
| `list:updated` | Server -> Board Room | `List` object | Broadcasts list rename |
| `list:reordered` | Server -> Board Room | `{ boardId, lists }` | Broadcasts reordered columns |
| `comment:created` | Server -> Board Room | `{ cardId, comment }` | Broadcasts new comment in task thread |
| `notification:new`| Server -> User Room | `Notification` object | Dispatches instant notification alert to user |
| `activity:new` | Server -> Workspace Room | `Activity` object | Dispatches live audit log item |

---

## 🔒 Security & Authorization

- **Strict Server Validation:** All workspace roles and permissions are enforced in server middleware (`requireWorkspaceMember`, `requireWorkspaceAdmin`).
- **Resource Ownership Resolution:** Operations on cards automatically resolve parent board and workspace IDs to verify membership before permitting read/write actions.
- **Protected Sockets:** Socket connections verify JWT tokens during handshake and validate workspace access before permitting room subscriptions.
- **Sanitized Passwords:** Passwords are never returned in queries or responses (`select: false` on Mongoose schema).
- **Rate Limiting:** Authentication routes are protected with `express-rate-limit`.

---

## 📸 Application Highlights

Explore the following sections after launching the application:

- Dashboard and analytics with live velocity and priority charts
- Interactive Kanban boards with dnd-kit drag-and-drop
- Task details, checklists, priority tags, and due date indicators
- Workspace member management and role assignments
- Monthly calendar mapping tasks by deadline
- My Tasks with search, status filters, and view toggles
- Real-time notifications and workspace activity history

---

## 🔮 Future Enhancements

- File attachments and document sharing.
- Advanced task filtering and sorting presets.
- Email-based invitation and notification delivery via SMTP.
- Public cloud deployment configurations (Docker, Kubernetes).
- Enhanced analytics and productivity velocity reports.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

⭐ If you find this project interesting, consider giving the repository a star!

**SyncBoard – Plan Together. Work Together. Stay in Sync.**
