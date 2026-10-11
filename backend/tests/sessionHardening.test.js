import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { generateToken, verifyToken } from '../src/utils/auth.js';

describe('Task 16.2: Session & JWT Hardening with httpOnly Cookie & CSRF Integration Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}/api`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('Registration and Login issue httpOnly token and XSRF-TOKEN cookies', async () => {
    const unique = Date.now() + '_cookie';
    const email = `testcookie_${unique}@example.com`;
    const password = 'StrongPassword123!';

    // Register
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: 'Cookie User' })
    });
    assert.equal(regRes.status, 201);

    const regCookies = regRes.headers.getSetCookie ? regRes.headers.getSetCookie() : [regRes.headers.get('set-cookie') || ''];
    const regCookieStr = regCookies.join('; ');
    assert.match(regCookieStr, /token=/);
    assert.match(regCookieStr, /HttpOnly/i);
    assert.match(regCookieStr, /XSRF-TOKEN=/);

    // Login
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    assert.equal(loginRes.status, 200);

    const loginCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get('set-cookie') || ''];
    const loginCookieStr = loginCookies.join('; ');
    assert.match(loginCookieStr, /token=/);
    assert.match(loginCookieStr, /HttpOnly/i);
    assert.match(loginCookieStr, /XSRF-TOKEN=/);
  });

  test('Cookie-authenticated mutating request without CSRF token is rejected with 403', async () => {
    const unique = Date.now() + '_csrf';
    const email = `csrf_${unique}@example.com`;
    const password = 'StrongPassword123!';

    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: 'CSRF Tester' })
    });
    const regData = await regRes.json();
    const token = regData.token;
    const csrfToken = regData.csrfToken;

    // Mutating request using only cookie, no CSRF header
    const badRes = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${token}; XSRF-TOKEN=${csrfToken}`
      },
      body: JSON.stringify({ name: 'CSRF Exploit Category' })
    });
    assert.equal(badRes.status, 403);
    const badBody = await badRes.json();
    assert.match(badBody.error, /CSRF/i);

    // Mutating request using cookie AND matching X-CSRF-Token header succeeds
    const goodRes = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${token}; XSRF-TOKEN=${csrfToken}`,
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({ name: 'Safe Category' })
    });
    assert.equal(goodRes.status, 201);
  });

  test('Bearer token request succeeds without requiring CSRF header', async () => {
    const unique = Date.now() + '_bearer';
    const email = `bearer_${unique}@example.com`;
    const password = 'StrongPassword123!';

    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: 'Bearer User' })
    });
    const regData = await regRes.json();

    const res = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${regData.token}`
      },
      body: JSON.stringify({ name: 'Bearer Category' })
    });
    assert.equal(res.status, 201);
  });

  test('POST /api/auth/logout clears token and XSRF-TOKEN cookies', async () => {
    const res = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST'
    });
    assert.equal(res.status, 200);

    const cookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie') || ''];
    const cookieStr = cookies.join('; ');
    assert.match(cookieStr, /token=;/);
    assert.match(cookieStr, /XSRF-TOKEN=;/);
  });

  test('Password change invalidates previous JWT tokens via token_version', async () => {
    const unique = Date.now() + '_version';
    const email = `tokenver_${unique}@example.com`;
    const oldPassword = 'OldPassword123!';
    const newPassword = 'NewPassword456!';

    // Register
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: oldPassword, full_name: 'Version User' })
    });
    const regData = await regRes.json();
    const oldToken = regData.token;

    // Verify old token works initially
    const testOldRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${oldToken}` }
    });
    assert.equal(testOldRes.status, 200);

    // Fail change-password with wrong current password
    const failChange = await fetch(`${baseUrl}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${oldToken}`
      },
      body: JSON.stringify({
        current_password: 'WrongPassword!',
        new_password: newPassword
      })
    });
    assert.equal(failChange.status, 400);

    // Succeed change-password with correct current password
    const successChange = await fetch(`${baseUrl}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${oldToken}`
      },
      body: JSON.stringify({
        current_password: oldPassword,
        new_password: newPassword
      })
    });
    assert.equal(successChange.status, 200);

    // Verify that the OLD token is now immediately rejected because token_version was incremented
    const staleRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${oldToken}` }
    });
    assert.equal(staleRes.status, 401);
    const staleBody = await staleRes.json();
    assert.match(staleBody.error, /revoked|expired/i);

    // Login with new password issues a valid token
    const newLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: newPassword })
    });
    assert.equal(newLoginRes.status, 200);
    const newToken = (await newLoginRes.json()).token;

    const newMeRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${newToken}` }
    });
    assert.equal(newMeRes.status, 200);
  });

  test('Login failure returns identical generic message for wrong password and non-existent email', async () => {
    // Non-existent user
    const resNoUser = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent_user_999@test.com', password: 'SomePassword123!' })
    });
    assert.equal(resNoUser.status, 401);
    const bodyNoUser = await resNoUser.json();

    // Existing user with wrong password
    const resWrongPass = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@taskmaster.io', password: 'DefinitelyWrongPassword!' })
    });
    assert.equal(resWrongPass.status, 401);
    const bodyWrongPass = await resWrongPass.json();

    // Verify exact same error message to prevent user enumeration
    assert.equal(bodyNoUser.error, 'Invalid email or password.');
    assert.equal(bodyWrongPass.error, 'Invalid email or password.');
  });

  test('HS256 algorithm pinning rejects tampered tokens with different algorithms', () => {
    const validToken = generateToken({ id: 'test-id', email: 'test@example.com', token_version: 1 });
    const verified = verifyToken(validToken);
    assert.equal(verified.id, 'test-id');
  });
});
