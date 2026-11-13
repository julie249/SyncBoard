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


⭐ If you find this project interesting, consider giving the repository a star!

**SyncBoard – Plan Together. Work Together. Stay in Sync.**
