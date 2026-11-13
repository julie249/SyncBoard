# 🚀 SyncBoard – Real-Time Collaborative Project Management Platform

SyncBoard is a full-stack, real-time project management application inspired by modern Kanban-based productivity tools. It enables teams to organize projects, manage tasks, collaborate with workspace members, and track progress through an interactive dashboard.

Built with React, Node.js, Express, MongoDB, and Socket.IO, SyncBoard provides seamless task management with real-time synchronization, role-based access control, and workspace-level collaboration.

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

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite |
| Styling | Tailwind CSS |
| Drag & Drop | @dnd-kit |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Real-Time Communication | Socket.IO |
| Authentication | JWT, bcrypt |
| Charts | Recharts |
| Testing | Vitest, Supertest |
| Version Control | Git, GitHub |

## 🏗️ Application Architecture

SyncBoard follows a client-server architecture.

- **Frontend:** React application responsible for the user interface, task interactions, dashboards, and calendar.
- **Backend:** Express.js REST API responsible for business logic, authentication, authorization, and task operations.
- **Database:** MongoDB stores users, workspaces, boards, tasks, comments, notifications, and activity records.
- **Real-Time Engine:** Socket.IO handles authenticated connections and broadcasts updates to relevant workspace and board members.

## ⚙️ Installation & Setup

### Prerequisites

Make sure you have installed:

- Node.js (LTS recommended)
- npm
- MongoDB (local installation or MongoDB Atlas)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/SyncBoard.git
cd SyncBoard
```

### 2. Install Dependencies

Install the root dependencies:

```bash
npm install
```

If frontend and backend have separate package.json files, install their dependencies separately:

```bash
cd client
npm install

cd ../server
npm install
```

Adjust these folder names according to your actual project structure.

### 3. Configure Environment Variables

Create a `.env` file in the appropriate backend directory.

Example configuration:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/syncboard
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

Use the actual variable names expected by your application. Never commit your real `.env` file or credentials to GitHub.

### 4. Start the Application

Start the backend:

```bash
npm run dev
```

Start the frontend in a separate terminal:

```bash
npm run dev
```

Run each command from the appropriate directory as defined by your package.json scripts.

### 5. Access the Application

| Service | Local URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Health Check | http://localhost:5000/api/health |

## 🧪 Testing & Verification

The project has been tested with:

- **10/10 automated integration tests passed** using Vitest and Supertest.
- Production build successfully compiled using Vite.
- Backend health endpoint verified.
- Frontend-to-backend communication verified through the Vite proxy.
- MongoDB database connectivity verified.
- Real-time collaboration tested using multiple browser sessions.

## 🔐 Demo Accounts

The development database includes pre-seeded accounts for testing.

| Role | Email | Password |
|---|---|---|
| Admin | admin@syncboard.dev | Password123! |
| Member | alex@syncboard.dev | Password123! |
| Member | sara@syncboard.dev | Password123! |

**Note:** These are local development demo credentials, not production accounts. Seeded data must be configured separately if not included in the repository.

## 📸 Application Highlights

Explore the following sections after launching the application:

- Dashboard and analytics
- Interactive Kanban boards
- Task details and checklist management
- Workspace member management
- Monthly calendar
- My Tasks
- Real-time notifications
- Workspace activity history

## 🔮 Future Enhancements

- File attachments and document sharing.
- Advanced task filtering and sorting.
- Email-based invitation and notification delivery.
- Public cloud deployment.
- Enhanced analytics and productivity reports.
- Mobile-responsive collaboration experience.

## 👩‍💻 Author

**Julie Kumari**

B.Tech – Computer Science and Engineering

GitHub: https://github.com/YOUR_USERNAME

---

⭐ If you find this project interesting, consider giving the repository a star!

**SyncBoard – Plan Together. Work Together. Stay in Sync.**
