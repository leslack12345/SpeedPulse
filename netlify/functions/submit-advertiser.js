import { createClient } from '@supabase/supabase-js';

const VALID_PACKAGES = ['starter', 'mid-content', 'pro'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LENGTHS = { business_name: 200, contact_name: 200, email: 254, website: 500, headline: 60, description: 120 };

function sanitize(str, maxLen) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * POST /api/submit-advertiser
 * Inserts a new advertiser application into Supabase and sends a webhook notification.
 */
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  // Sanitize all string inputs
  const business_name = sanitize(body.business_name, MAX_LENGTHS.business_name);
  const contact_name = sanitize(body.contact_name, MAX_LENGTHS.contact_name);
  const email = sanitize(body.email, MAX_LENGTHS.email);
  const website = sanitize(body.website, MAX_LENGTHS.website);
  const headline = sanitize(body.headline, MAX_LENGTHS.headline);
  const description = sanitize(body.description, MAX_LENGTHS.description);
  const pkg = sanitize(body.package, 20);

  // Validate required fields
  if (!business_name || !contact_name || !email || !headline) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  // Validate email format
  if (!EMAIL_RE.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email address' }) };
  }

  // Validate website URL if provided
  if (website && !isValidUrl(website)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid website URL — must start with http:// or https://' }) };
  }

  // Validate package selection
  if (!VALID_PACKAGES.includes(pkg)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid package selection' }) };
  }

  // Insert into advertisers table with pending status
  const { error } = await supabase.from('advertisers').insert({
    business_name,
    contact_name,
    email,
    website,
    package: pkg,
    headline,
    description,
    status: 'pending',
  });

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save application' }),
    };
  }

  // Send webhook notification (fire-and-forget)
  const webhookUrl = process.env.NOTIFY_WEBHOOK;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `New advertiser application: ${business_name} (${email}) — ${pkg} package`,
        }),
      });
    } catch {
      // Webhook failure is non-critical
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true }),
  };
}
