import { createClient } from '@supabase/supabase-js';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    // ignore parse errors
  }

  const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || event.headers['client-ip']
    || 'unknown';

  await supabase.from('page_views').insert({
    path: body.path || '/',
    referrer: body.referrer || null,
    user_agent: event.headers['user-agent'] || null,
    ip_address: ip,
    country: event.headers['x-country'] || event.headers['x-nf-client-connection-ip'] || null,
  });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  };
}
