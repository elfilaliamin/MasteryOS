import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

describe('Task 16.1: Strict Multi-Tenant Authorization & Cross-Entity Ownership Tests', () => {
  let server;
  let baseUrl;
  let tokenA, userA;
  let tokenB, userB;
  let catA, goalA, courseA, taskA, habitA;
  let catB, goalB, courseB, taskB, habitB;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}/api`;
        resolve();
      });
    });

    const uniqueA = Date.now() + '_a';
    const uniqueB = Date.now() + '_b';

    // Register User A
    const resA = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `usera_${uniqueA}@test.com`,
        password: 'Password123!',
        full_name: 'User Alpha'
      })
    });
    const dataA = await resA.json();
    tokenA = dataA.token;
    userA = dataA.user;

    // Register User B
    const resB = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `userb_${uniqueB}@test.com`,
        password: 'Password123!',
        full_name: 'User Beta'
      })
    });
    const dataB = await resB.json();
    tokenB = dataB.token;
    userB = dataB.user;

    // User A creates resources
    const catResA = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'Alpha Category', color: '#10b981' })
    });
    catA = (await catResA.json()).category;

    const goalResA = await fetch(`${baseUrl}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ title: 'Alpha Goal', priority: 'HIGH' })
    });
    goalA = (await goalResA.json()).goal;

    const courseResA = await fetch(`${baseUrl}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ title: 'Alpha Course', total_lessons: 10, finished_lessons: 2 })
    });
    courseA = (await courseResA.json()).course;

    const taskResA = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        title: 'Alpha Task',
        category_id: catA.id,
        goal_id: goalA.id,
        course_id: courseA.id,
        status: 'TODO'
      })
    });
    taskA = (await taskResA.json()).task;

    const habitResA = await fetch(`${baseUrl}/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ title: 'Alpha Habit', time_of_day: 'MORNING' })
    });
    habitA = (await habitResA.json()).habit;

    // User B creates resources
    const catResB = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ name: 'Beta Category', color: '#3b82f6' })
    });
    catB = (await catResB.json()).category;

    const goalResB = await fetch(`${baseUrl}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ title: 'Beta Goal', priority: 'MEDIUM' })
    });
    goalB = (await goalResB.json()).goal;

    const courseResB = await fetch(`${baseUrl}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ title: 'Beta Course', total_lessons: 5, finished_lessons: 1 })
    });
    courseB = (await courseResB.json()).course;

    const taskResB = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        title: 'Beta Task',
        category_id: catB.id,
        goal_id: goalB.id,
        course_id: courseB.id,
        status: 'TODO'
      })
    });
    taskB = (await taskResB.json()).task;

    const habitResB = await fetch(`${baseUrl}/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ title: 'Beta Habit', time_of_day: 'EVENING' })
    });
    habitB = (await habitResB.json()).habit;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('User B cannot retrieve User A task via GET /api/tasks/:id', async () => {
    const res = await fetch(`${baseUrl}/tasks/${taskA.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert.equal(res.status, 404);
  });

  test('User B cannot update User A task via PUT /api/tasks/:id', async () => {
    const res = await fetch(`${baseUrl}/tasks/${taskA.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ title: 'Hacked Alpha Task' })
    });
    assert.equal(res.status, 404);

    // Verify User A task remains unchanged
    const verifyRes = await fetch(`${baseUrl}/tasks/${taskA.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const verifyData = await verifyRes.json();
    assert.equal(verifyData.task.title, 'Alpha Task');
  });

  test('User B cannot change status of User A task via PATCH /api/tasks/:id/status', async () => {
    const res = await fetch(`${baseUrl}/tasks/${taskA.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ status: 'COMPLETED' })
    });
    assert.equal(res.status, 404);
  });

  test('User B cannot associate User A category when creating a task (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        title: 'Illegal Category Task',
        category_id: catA.id
      })
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.error, /category/i);
  });

  test('User B cannot associate User A goal when creating a task (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        title: 'Illegal Goal Task',
        goal_id: goalA.id
      })
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.error, /goal/i);
  });

  test('User B cannot associate User A course when creating a task (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        title: 'Illegal Course Task',
        course_id: courseA.id
      })
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.error, /course/i);
  });

  test('User B cannot associate User A task when creating or updating a course (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        title: 'Illegal Course Association',
        task_ids: [taskA.id]
      })
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.error, /task/i);
  });

  test('User B cannot associate User A task when creating or updating a goal (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        title: 'Illegal Goal Association',
        task_ids: [taskA.id]
      })
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.error, /task/i);
  });

  test('User B cannot toggle User A habit (404 Not Found)', async () => {
    const res = await fetch(`${baseUrl}/habits/${habitA.id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ date: '2026-10-11' })
    });
    assert.equal(res.status, 404);
  });

  test('Listing endpoints strictly isolate resources by tenant', async () => {
    // Tasks list
    const tasksResB = await fetch(`${baseUrl}/tasks`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const tasksB = (await tasksResB.json()).tasks;
    assert.ok(tasksB.every((t) => t.user_id === userB.id));
    assert.ok(!tasksB.some((t) => t.id === taskA.id));

    // Goals list
    const goalsResB = await fetch(`${baseUrl}/goals`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const goalsB = (await goalsResB.json()).goals;
    assert.ok(goalsB.every((g) => g.user_id === userB.id));
    assert.ok(!goalsB.some((g) => g.id === goalA.id));

    // Courses list
    const coursesResB = await fetch(`${baseUrl}/courses`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const coursesB = (await coursesResB.json()).courses;
    assert.ok(coursesB.every((c) => c.user_id === userB.id));
    assert.ok(!coursesB.some((c) => c.id === courseA.id));

    // Habits list
    const habitsResB = await fetch(`${baseUrl}/habits`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const habitsB = (await habitsResB.json()).habits;
    assert.ok(habitsB.every((h) => h.user_id === userB.id));
    assert.ok(!habitsB.some((h) => h.id === habitA.id));
  });
});
