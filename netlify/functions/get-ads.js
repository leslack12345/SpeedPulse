import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/get-ads
 * Returns all approved ads from the Supabase ads table.
 */
export async function handler() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase
    .from('ads')
    .select('id, business_name, headline, description, cta_text, cta_url, placement')
    .eq('status', 'approved');

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch ads' }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data || []),
  };
}
