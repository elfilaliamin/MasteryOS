// backend/tests/rateLimit.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';
import { resetAllLockouts } from '../src/utils/accountLockout.js';

let server;
let baseUrl;

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

describe('Task 16.3: Proxy IP Attribution & Multi-Tiered Rate Limiting Tests', () => {
  before(async () => {
    resetAllLockouts();
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    resetAllLockouts();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('Locks out account after 5 failed login attempts returning 429 Too Many Requests', async () => {
    const targetEmail = `lockout_target_${Date.now()}@test.com`;

    // Attempt 1 through 4 should fail with 401 Invalid email or password
    for (let i = 1; i <= 4; i++) {
      const res = await request('/api/auth/login', {
        method: 'POST',
        headers: { 'CF-Connecting-IP': '198.51.100.1' },
        body: { email: targetEmail, password: 'WrongPassword123!' }
      });
      assert.equal(res.status, 401, `Attempt ${i} should be 401`);
      assert.equal(res.data.error, 'Invalid email or password.');
    }

    // 5th attempt triggers lockout immediately with 429
    const fifthAttempt = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '198.51.100.1' },
      body: { email: targetEmail, password: 'WrongPassword123!' }
    });
    assert.equal(fifthAttempt.status, 429, '5th attempt should trigger 429 lockout');
    assert.match(fifthAttempt.data.error, /Too many failed login attempts/i);

    // 6th attempt from a different IP (distributed brute-force) is still locked out
    const sixthFromOtherIp = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '203.0.113.88' },
      body: { email: targetEmail, password: 'WrongPassword123!' }
    });
    assert.equal(sixthFromOtherIp.status, 429, 'Subsequent attempt from any IP should remain 429');
  });

  it('Successful login resets failed attempt counter for the account', async () => {
    const email = `reset_counter_${Date.now()}@test.com`;
    const password = 'StrongPassword123!';

    // Register user
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '198.51.100.5' },
      body: { full_name: 'Counter Test', email, password }
    });
    assert.equal(regRes.status, 201);

    // Make 2 failed login attempts
    for (let i = 0; i < 2; i++) {
      await request('/api/auth/login', {
        method: 'POST',
        headers: { 'CF-Connecting-IP': '198.51.100.5' },
        body: { email, password: 'WrongPassword!' }
      });
    }

    // Perform successful login
    const successRes = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '198.51.100.5' },
      body: { email, password }
    });
    assert.equal(successRes.status, 200);

    // Now failed attempts should be reset (next wrong password should be 401, not 429)
    const afterSuccessWrong = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '198.51.100.5' },
      body: { email, password: 'WrongPasswordAgain!' }
    });
    assert.equal(afterSuccessWrong.status, 401);
  });

  it('CF-Connecting-IP header is properly attributed and isolated per client IP', async () => {
    const targetEmailA = `ip_test_a_${Date.now()}@test.com`;
    const targetEmailB = `ip_test_b_${Date.now()}@test.com`;

    // Attacking Email A from IP 1.2.3.4
    for (let i = 0; i < 5; i++) {
      await request('/api/auth/login', {
        method: 'POST',
        headers: { 'CF-Connecting-IP': '1.2.3.4' },
        body: { email: targetEmailA, password: 'Bad' }
      });
    }

    // Email A is locked
    const checkA = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '1.2.3.4' },
      body: { email: targetEmailA, password: 'Bad' }
    });
    assert.equal(checkA.status, 429);

    // Email B tested from IP 5.6.7.8 is not locked
    const checkB = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '5.6.7.8' },
      body: { email: targetEmailB, password: 'Bad' }
    });
    assert.equal(checkB.status, 401);
  });
});
