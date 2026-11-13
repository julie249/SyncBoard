import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

let authToken = '';
let workspaceId = '';
let boardId = '';
let listId = '';
let cardId = '';

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('SyncBoard Backend API Tests', () => {
  it('GET /api/health should return 200 healthy', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('healthy');
  });

  it('POST /api/auth/login with valid demo admin credentials should issue JWT', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@syncboard.dev',
      password: 'Password123!'
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('admin@syncboard.dev');
    authToken = res.body.token;
  });

  it('POST /api/auth/login with invalid password should fail with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@syncboard.dev',
      password: 'WrongPassword'
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me with valid Bearer token should return user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.name).toBe('Sarah Connor');
  });

  it('GET /api/workspaces should return user workspaces', async () => {
    const res = await request(app)
      .get('/api/workspaces')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.workspaces.length).toBeGreaterThan(0);
    workspaceId = res.body.workspaces[0]._id;
  });

  it('GET /api/boards/workspace/:workspaceId should return boards in workspace', async () => {
    const res = await request(app)
      .get(`/api/boards/workspace/${workspaceId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.boards.length).toBeGreaterThan(0);
    const sprintBoard = res.body.boards.find((b) => b.name.includes('Sprint')) || res.body.boards[0];
    boardId = sprintBoard._id;
  });

  it('GET /api/boards/:boardId should return board with lists and cards', async () => {
    const res = await request(app)
      .get(`/api/boards/${boardId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.lists.length).toBeGreaterThan(0);
    expect(res.body.cards.length).toBeGreaterThan(0);
    listId = res.body.lists[0]._id;
    cardId = res.body.cards[0]._id;
  });

  it('PUT /api/cards/:cardId/move should persist card position', async () => {
    const res = await request(app)
      .put(`/api/cards/${cardId}/move`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        targetListId: listId,
        newPosition: 1500
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.card.position).toBe(1500);
  });

  it('GET /api/notifications/unread-count should return numeric unread counter', async () => {
    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.unreadCount).toBe('number');
  });

  it('GET /api/dashboard/metrics/:workspaceId should return calculated metrics and charts', async () => {
    const res = await request(app)
      .get(`/api/dashboard/metrics/${workspaceId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.metrics.totalBoards).toBeGreaterThan(0);
    expect(res.body.charts.priority).toBeDefined();
    expect(res.body.charts.status).toBeDefined();
  });
});
