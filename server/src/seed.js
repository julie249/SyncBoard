import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Workspace } from './models/Workspace.js';
import { Board } from './models/Board.js';
import { List } from './models/List.js';
import { Card } from './models/Card.js';
import { Comment } from './models/Comment.js';
import { Activity } from './models/Activity.js';
import { Notification } from './models/Notification.js';

const seedDatabase = async () => {
  try {
    if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
      console.warn('[Seed Protection] Direct database wipe is prevented in production mode.');
      console.warn('To confirm seeding demo data in production, run: node src/seed.js --force');
      process.exit(0);
    }

    await connectDB();
    console.log('[Seed] Connected to database. Clearing old data...');

    await Promise.all([
      User.deleteMany({}),
      Workspace.deleteMany({}),
      Board.deleteMany({}),
      List.deleteMany({}),
      Card.deleteMany({}),
      Comment.deleteMany({}),
      Activity.deleteMany({}),
      Notification.deleteMany({})
    ]);

    console.log('[Seed] Creating demo users...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123!', salt);

    const admin = await User.create({
      name: 'Sarah Connor',
      email: 'admin@syncboard.dev',
      passwordHash,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      theme: 'light'
    });

    const alex = await User.create({
      name: 'Alex Rivera',
      email: 'alex@syncboard.dev',
      passwordHash,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      theme: 'light'
    });

    const sara = await User.create({
      name: 'Sara Chen',
      email: 'sara@syncboard.dev',
      passwordHash,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      theme: 'light'
    });

    console.log('[Seed] Creating demo workspace...');
    const workspace = await Workspace.create({
      name: 'Product Engineering',
      description: 'Core software engineering workspace for SyncBoard web and mobile products',
      owner: admin._id,
      members: [
        { user: admin._id, role: 'admin' },
        { user: alex._id, role: 'member' },
        { user: sara._id, role: 'member' }
      ]
    });

    console.log('[Seed] Creating demo boards...');
    const sprintBoard = await Board.create({
      name: 'Sprint Board (Sprint 42)',
      description: 'Bi-weekly sprint tasks, bug fixes, and feature releases',
      workspace: workspace._id,
      background: '#4F46E5', // Indigo
      starredBy: [admin._id, alex._id],
      createdBy: admin._id
    });

    const mobileBoard = await Board.create({
      name: 'Mobile App Roadmap',
      description: 'iOS and Android client architecture and release milestones',
      workspace: workspace._id,
      background: '#0EA5E9', // Sky blue
      starredBy: [admin._id],
      createdBy: admin._id
    });

    const marketingBoard = await Board.create({
      name: 'Growth & Marketing',
      description: 'Product launches, SEO campaigns, and landing page conversions',
      workspace: workspace._id,
      background: '#10B981', // Emerald
      starredBy: [],
      createdBy: alex._id
    });

    console.log('[Seed] Creating lists for Sprint Board...');
    const listsData = [
      { name: 'Backlog', position: 1000 },
      { name: 'To Do', position: 2000 },
      { name: 'In Progress', position: 3000 },
      { name: 'Code Review', position: 4000 },
      { name: 'Done', position: 5000 }
    ];

    const lists = [];
    for (const item of listsData) {
      const list = await List.create({
        name: item.name,
        board: sprintBoard._id,
        position: item.position
      });
      lists.push(list);
    }

    const [backlogList, todoList, inProgressList, reviewList, doneList] = lists;

    console.log('[Seed] Creating task cards...');
    const now = new Date();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
    const overdueDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    // Card 1: Urgent overdue bug
    const card1 = await Card.create({
      title: 'Fix race condition in Socket.IO room subscriptions',
      description: 'When switching between boards rapidly, the previous board listener is not consistently unsubscribed.',
      board: sprintBoard._id,
      list: inProgressList._id,
      position: 1000,
      priority: 'Urgent',
      dueDate: overdueDate,
      assignedTo: [alex._id, admin._id],
      createdBy: admin._id,
      labels: [
        { name: 'Bug', color: '#EF4444' },
        { name: 'Backend', color: '#6366F1' }
      ],
      checklist: [
        { title: 'Reproduce with 2 browser tabs', completed: true },
        { title: 'Add room unsubscribe hook in Board.jsx', completed: true },
        { title: 'Write unit test simulating disconnect', completed: false }
      ]
    });

    // Card 2: High priority UI redesign
    const card2 = await Card.create({
      title: 'Implement modern Glassmorphism theme & dark mode toggle',
      description: 'Revamp card shadows, borders, sidebar colors, and add smooth theme transition switch.',
      board: sprintBoard._id,
      list: inProgressList._id,
      position: 2000,
      priority: 'High',
      dueDate: tomorrow,
      assignedTo: [sara._id],
      createdBy: alex._id,
      labels: [
        { name: 'UI/UX', color: '#EC4899' },
        { name: 'Frontend', color: '#3B82F6' }
      ],
      checklist: [
        { title: 'Setup Tailwind dark mode class', completed: true },
        { title: 'ThemeContext provider and hook', completed: true },
        { title: 'Test contrast ratios on mobile', completed: false }
      ]
    });

    // Card 3: In Review
    const card3 = await Card.create({
      title: 'Design database schema for Audit Activity Trail',
      description: 'Store workspace, board, card actor, action type, description, and metadata.',
      board: sprintBoard._id,
      list: reviewList._id,
      position: 1000,
      priority: 'Medium',
      dueDate: tomorrow,
      assignedTo: [admin._id, alex._id],
      createdBy: alex._id,
      labels: [{ name: 'Backend', color: '#6366F1' }],
      checklist: [
        { title: 'Define Mongoose schema with indexes', completed: true },
        { title: 'Create activity service helper', completed: true },
        { title: 'Add pagination endpoint', completed: true }
      ]
    });

    // Card 4: To Do
    const card4 = await Card.create({
      title: 'Add CSV & JSON export for Board Tasks',
      description: 'Allow workspace admins to export tasks with assignees, labels, and timestamps.',
      board: sprintBoard._id,
      list: todoList._id,
      position: 1000,
      priority: 'Low',
      dueDate: nextWeek,
      assignedTo: [sara._id],
      createdBy: admin._id,
      labels: [{ name: 'Feature', color: '#10B981' }],
      checklist: [
        { title: 'Backend streaming export route', completed: false },
        { title: 'Frontend download button modal', completed: false }
      ]
    });

    // Card 5: Done
    const card5 = await Card.create({
      title: 'JWT Authentication and HTTP-Only Cookie Session',
      description: 'Complete registration, login, token refresh, and protected API routes.',
      board: sprintBoard._id,
      list: doneList._id,
      position: 1000,
      priority: 'High',
      dueDate: twoDaysAgo,
      assignedTo: [alex._id, admin._id],
      createdBy: admin._id,
      labels: [
        { name: 'Security', color: '#F59E0B' },
        { name: 'Backend', color: '#6366F1' }
      ],
      checklist: [
        { title: 'Password bcrypt hashing', completed: true },
        { title: 'JWT sign and verify middleware', completed: true },
        { title: 'Cross-workspace authorization checks', completed: true }
      ]
    });

    // Card 6: Backlog
    const card6 = await Card.create({
      title: 'Implement drag-and-drop column reordering',
      description: 'Use dnd-kit sortable to allow entire lists to be dragged horizontally across the board canvas.',
      board: sprintBoard._id,
      list: backlogList._id,
      position: 1000,
      priority: 'Medium',
      dueDate: null,
      assignedTo: [sara._id],
      createdBy: alex._id,
      labels: [{ name: 'Frontend', color: '#3B82F6' }]
    });

    console.log('[Seed] Creating comments...');
    await Comment.create([
      {
        card: card1._id,
        author: admin._id,
        content: 'I noticed this happens specifically when a user clicks between Sprint Board and Mobile App Roadmap within 500ms.'
      },
      {
        card: card1._id,
        author: alex._id,
        content: 'Good catch. I added an explicit `socket.emit("board:leave")` in the cleanup callback of useEffect and verified it works.'
      },
      {
        card: card2._id,
        author: sara._id,
        content: 'Dark mode colors are aligned with Tailwind slate-900 palette. Looks very crisp!'
      }
    ]);

    console.log('[Seed] Creating activity logs...');
    await Activity.create([
      {
        workspace: workspace._id,
        board: sprintBoard._id,
        card: card5._id,
        actor: alex._id,
        action: 'card:move',
        description: 'Alex Rivera moved "JWT Authentication and HTTP-Only Cookie Session" from In Progress to Done'
      },
      {
        workspace: workspace._id,
        board: sprintBoard._id,
        card: card1._id,
        actor: admin._id,
        action: 'card:create',
        description: 'Sarah Connor added "Fix race condition in Socket.IO room subscriptions" to In Progress'
      },
      {
        workspace: workspace._id,
        board: sprintBoard._id,
        card: card2._id,
        actor: sara._id,
        action: 'comment:create',
        description: 'Sara Chen commented on "Implement modern Glassmorphism theme & dark mode toggle"'
      },
      {
        workspace: workspace._id,
        board: sprintBoard._id,
        actor: admin._id,
        action: 'board:create',
        description: 'Sarah Connor created board "Sprint Board (Sprint 42)"'
      }
    ]);

    console.log('[Seed] Creating notifications...');
    await Notification.create([
      {
        recipient: alex._id,
        sender: admin._id,
        type: 'assignment',
        title: 'Task Assigned',
        message: 'Sarah Connor assigned you to "Fix race condition in Socket.IO room subscriptions"',
        entityId: card1._id,
        entityType: 'Card',
        read: false
      },
      {
        recipient: sara._id,
        sender: alex._id,
        type: 'assignment',
        title: 'Task Assigned',
        message: 'Alex Rivera assigned you to "Implement modern Glassmorphism theme & dark mode toggle"',
        entityId: card2._id,
        entityType: 'Card',
        read: false
      },
      {
        recipient: admin._id,
        sender: alex._id,
        type: 'comment',
        title: 'New Comment',
        message: 'Alex Rivera replied to your thread on "Fix race condition in Socket.IO room subscriptions"',
        entityId: card1._id,
        entityType: 'Card',
        read: false
      }
    ]);

    console.log('---------------------------------------------------------');
    console.log('✅ Demo Seed Data successfully created in MongoDB!');
    console.log('Workspace: Product Engineering');
    console.log('Demo Accounts:');
    console.log('  1. Admin:  admin@syncboard.dev / Password123!');
    console.log('  2. Member: alex@syncboard.dev  / Password123!');
    console.log('  3. Member: sara@syncboard.dev  / Password123!');
    console.log('---------------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
