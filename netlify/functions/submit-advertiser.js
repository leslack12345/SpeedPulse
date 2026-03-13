import { createClient } from '@supabase/supabase-js';

// Simple in-memory rate limit (resets on cold start, but catches bursts)
const submissions = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSIONS_PER_IP = 3;

function isRateLimited(ip) {
  const now = Date.now();
  const record = submissions.get(ip);
  if (!record || now - record.first > RATE_LIMIT_WINDOW) {
    submissions.set(ip, { first: now, count: 1 });
    return false;
  }
  record.count++;
  return record.count > MAX_SUBMISSIONS_PER_IP;
}

const VALID_PACKAGES = ['starter', 'mid-content', 'pro'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LENGTHS = { business_name: 200, contact_name: 200, email: 254, website: 500, headline: 60, description: 120 };

function sanitize(str, maxLen) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

function isValidWebsite(str) {
  // Reject anything with script-like content
  if (/[<>"'`]|javascript:/i.test(str)) return false;
  // Accept plain domains (test4.com) or full URLs (https://test4.com)
  return /^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}/.test(str.replace(/^https?:\/\//, ''));
}

/**
 * POST /api/submit-advertiser
 * Inserts a new advertiser application into Supabase and sends a webhook notification.
 */
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Rate limit: max 3 submissions per IP per hour
  const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  if (isRateLimited(clientIp)) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Too many submissions. Please try again later.' }) };
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

  // Validate website if provided
  if (website && !isValidWebsite(website)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid website' }) };
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

  // Send email notification (fire-and-forget)
  const resendKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  if (resendKey && notifyEmail) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'SpeedPulse <onboarding@resend.dev>',
          to: notifyEmail,
          subject: `New Ad Application: ${business_name}`,
          html: `
            <h2>New Advertiser Application</h2>
            <p><strong>Business:</strong> ${business_name}</p>
            <p><strong>Contact:</strong> ${contact_name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Website:</strong> ${website || 'N/A'}</p>
            <p><strong>Package:</strong> ${pkg}</p>
            <p><strong>Headline:</strong> ${headline}</p>
            <p><strong>Description:</strong> ${description}</p>
          `,
        }),
      });
    } catch {
      // Email failure is non-critical
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true }),
  };
}
