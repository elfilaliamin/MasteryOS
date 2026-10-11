// backend/tests/validation.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';

let server;
let baseUrl;
let authToken;

const request = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const headers = { ...(options.headers || {}) };

  if (options.body && typeof options.body === 'object' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined
  });

  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return {
    status: res.status,
    headers: res.headers,
    data
  };
};

describe('Task 16.4: Strict Request Schema Validation (Zod) & Sanitization Tests', () => {
  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // Register a test user
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        full_name: 'Zod Tester',
        email: `zod_tester_${Date.now()}@test.com`,
        password: 'ValidPassword123!'
      }
    });
    authToken = regRes.data.token;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('Rejects non-UUID route parameters with 400 Bad Request', async () => {
    const res = await request('/api/tasks/not-a-valid-uuid', {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` }
    });

    assert.equal(res.status, 400);
    assert.equal(res.data.error, 'Validation failed');
    assert.ok(res.data.details.some(d => d.field === 'id'));
  });

  it('Rejects invalid URL protocols (e.g. javascript:) on profile avatar', async () => {
    const res = await request('/api/auth/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        avatar: 'javascript:alert("xss")'
      }
    });

    assert.equal(res.status, 400);
    assert.equal(res.data.error, 'Validation failed');
    assert.ok(res.data.details.some(d => d.field === 'avatar'));
  });

  it('Rejects invalid URL protocols on course cover_image and certificate_url', async () => {
    const res = await request('/api/courses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        title: 'Dangerous Course',
        cover_image: 'data:text/html,<script>alert(1)</script>',
        certificate_url: 'file:///etc/passwd'
      }
    });

    assert.equal(res.status, 400);
    assert.equal(res.data.error, 'Validation failed');
    assert.ok(res.data.details.some(d => d.field === 'cover_image' || d.field === 'certificate_url'));
  });

  it('Accepts valid https:// URLs for course assets', async () => {
    const res = await request('/api/courses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        title: 'Safe Course',
        cover_image: 'https://images.unsplash.com/photo-12345',
        certificate_url: 'https://cert.example.com/verify/123'
      }
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.course.title, 'Safe Course');
  });

  it('Rejects unallowed sort fields in task query with 400', async () => {
    const res = await request('/api/tasks?sortBy=malicious_injected_column;DROP+TABLE', {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` }
    });

    assert.equal(res.status, 400);
    assert.equal(res.data.error, 'Validation failed');
    assert.ok(res.data.details.some(d => d.field === 'sortBy'));
  });

  it('Rejects pagination limit greater than 100 with 400', async () => {
    const res = await request('/api/tasks?limit=500', {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` }
    });

    assert.equal(res.status, 400);
    assert.equal(res.data.error, 'Validation failed');
    assert.ok(res.data.details.some(d => d.field === 'limit'));
  });

  it('Rejects oversized payloads exceeding 100kb body limit with 413 Payload Too Large', async () => {
    const hugeDescription = 'A'.repeat(150 * 1024); // 150KB
    const res = await request('/api/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        title: 'Huge Task',
        description: hugeDescription
      }
    });

    assert.equal(res.status, 413);
  });
});
