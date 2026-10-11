// backend/tests/securityHeaders.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app, { isOriginAllowed } from '../src/app.js';

let server;
let baseUrl;

describe('Task 16.6: Security Headers, CORS Lockdown & Error Redaction Tests', () => {
  before(async () => {
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
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('Emits X-Frame-Options: DENY for clickjacking defense', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.ok([200, 503].includes(res.status));
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
  });

  it('Emits Content Security Policy (CSP) header with restrictive directives', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const csp = res.headers.get('content-security-policy') || '';
    assert.ok(csp.includes("default-src 'self'"), 'CSP must specify default-src self');
    assert.ok(csp.includes("frame-ancestors 'none'"), 'CSP must specify frame-ancestors none');
  });

  it('Emits Referrer-Policy: strict-origin-when-cross-origin', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  });

  it('Excludes Strict-Transport-Security (HSTS) locally because edge Cloudflare handles HSTS', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.headers.get('strict-transport-security'), null);
  });

  it('Emits X-Content-Type-Options: nosniff on API endpoints', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  });

  it('Centralized error handler returns JSON error structure and sanitizes 404 endpoints', async () => {
    const res = await fetch(`${baseUrl}/api/non-existent-route`);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.error, 'Endpoint not found');
  });

  it('Accurately validates allowed origins including all elfilaliamin and elfilaiamin subdomains and localhost', () => {
    // Both spelling variants with subdomains and apex
    assert.equal(isOriginAllowed('https://masteryos.elfilaliamin.online'), true);
    assert.equal(isOriginAllowed('https://masteryos.elfilaiamin.online'), true);
    assert.equal(isOriginAllowed('http://masteryos.elfilaliamin.online/'), true);
    assert.equal(isOriginAllowed('https://elfilaliamin.online'), true);
    assert.equal(isOriginAllowed('https://elfilaiamin.online'), true);
    assert.equal(isOriginAllowed('https://app.elfilaliamin.online'), true);
    assert.equal(isOriginAllowed('https://masteryos.app'), true);
    assert.equal(isOriginAllowed('https://dev.masteryos.app'), true);

    // Localhost on any port
    assert.equal(isOriginAllowed('http://localhost:5173'), true);
    assert.equal(isOriginAllowed('http://localhost:3000'), true);
    assert.equal(isOriginAllowed('http://127.0.0.1:5173'), true);
    assert.equal(isOriginAllowed('http://127.0.0.1:8080'), true);

    // Empty/missing origin (curl/mobile/server-to-server)
    assert.equal(isOriginAllowed(null), true);
    assert.equal(isOriginAllowed(''), true);

    // Unauthorized domains
    assert.equal(isOriginAllowed('https://evil-attacker.com'), false);
    assert.equal(isOriginAllowed('https://notelfilaliamin.online.fake.com'), false);
    assert.equal(isOriginAllowed('https://fake-masteryos.app.attacker.com'), false);
  });
});
