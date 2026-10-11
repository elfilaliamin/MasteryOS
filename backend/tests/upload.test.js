// backend/tests/upload.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';

let server;
let baseUrl;
let authToken;

const createMultipartPayload = (field, filename, mimeType, buffer) => {
  const boundary = `----WebKitFormBoundary${Math.random().toString(36).substring(2)}`;
  const preamble = `--${boundary}\r\nContent-Disposition: form-data; name="${field}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const epilogue = `\r\n--${boundary}--\r\n`;

  const body = Buffer.concat([
    Buffer.from(preamble, 'utf-8'),
    buffer,
    Buffer.from(epilogue, 'utf-8')
  ]);

  return {
    contentType: `multipart/form-data; boundary=${boundary}`,
    body
  };
};

describe('Task 16.5: Secure File Upload Pipeline & Magic Byte Inspection Tests', () => {
  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Upload Tester',
        email: `upload_tester_${Date.now()}@test.com`,
        password: 'UploadTestPassword123!'
      })
    });
    const regData = await regRes.json();
    authToken = regData.token;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('Successfully uploads authentic PNG image and generates randomized UUID filename', async () => {
    // Valid PNG signature: 89 50 4E 47 0D 0A 1A 0A followed by IHDR chunk
    const validPngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52
    ]);

    const multipart = createMultipartPayload('file', 'photo.png', 'image/png', validPngBuffer);
    const res = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': multipart.contentType,
        Authorization: `Bearer ${authToken}`
      },
      body: multipart.body
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.mimeType, 'image/png');
    assert.ok(data.filename.endsWith('.png'));
    // Ensure filename is a UUID
    const uuidWithoutExt = data.filename.replace('.png', '');
    assert.match(uuidWithoutExt, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('Rejects fake renamed files (e.g. .exe executable renamed to .png) due to magic byte mismatch', async () => {
    // Windows PE / MZ executable signature: 4D 5A
    const fakePngExecutable = Buffer.from([
      0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00,
      0x04, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00
    ]);

    const multipart = createMultipartPayload('file', 'trojan.png', 'image/png', fakePngExecutable);
    const res = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': multipart.contentType,
        Authorization: `Bearer ${authToken}`
      },
      body: multipart.body
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /Invalid file signature/i);
  });

  it('Rejects SVG XML text files to eliminate stored XSS vectors', async () => {
    const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const multipart = createMultipartPayload('file', 'logo.svg', 'image/svg+xml', svgBuffer);
    const res = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': multipart.contentType,
        Authorization: `Bearer ${authToken}`
      },
      body: multipart.body
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /Invalid file signature/i);
  });

  it('Enforces nosniff and forced attachment on PDF uploads', async () => {
    // Valid PDF signature: 25 50 44 46 (%PDF-1.4)
    const validPdfBuffer = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    const multipart = createMultipartPayload('file', 'document.pdf', 'application/pdf', validPdfBuffer);
    const uploadRes = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': multipart.contentType,
        Authorization: `Bearer ${authToken}`
      },
      body: multipart.body
    });

    assert.equal(uploadRes.status, 201);
    const uploadData = await uploadRes.json();

    // Fetch static file
    const fileRes = await fetch(`${baseUrl}/api/upload/file/${uploadData.filename}`);
    assert.equal(fileRes.status, 200);
    assert.equal(fileRes.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(fileRes.headers.get('content-type'), 'application/pdf');
    assert.match(fileRes.headers.get('content-disposition'), /^attachment;/);
  });

  it('Rejects oversized uploads exceeding 5MB limit with 400', async () => {
    // 5.5 MB dummy buffer
    const oversizedBuffer = Buffer.alloc(5.5 * 1024 * 1024, 0x89);
    const multipart = createMultipartPayload('file', 'huge.png', 'image/png', oversizedBuffer);
    const res = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': multipart.contentType,
        Authorization: `Bearer ${authToken}`
      },
      body: multipart.body
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /maximum allowed size/i);
  });
});
