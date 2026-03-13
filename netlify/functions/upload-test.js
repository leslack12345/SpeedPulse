const MAX_BODY_BYTES = 10 * 1024 * 1024; // 10 MB limit

/**
 * POST /api/upload-test
 * Accepts a POST body and immediately responds with the byte count received.
 * Used by the frontend to measure upload speed and ping latency.
 */
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const bodyLength = event.body ? Buffer.byteLength(event.body) : 0;

  if (bodyLength > MAX_BODY_BYTES) {
    return {
      statusCode: 413,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Payload too large' }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bytes: bodyLength }),
  };
}
