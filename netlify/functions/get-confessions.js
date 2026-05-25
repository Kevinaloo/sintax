// netlify/functions/get-confessions.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const { category, creator_ref, limit = 50 } = event.queryStringParameters || {};

    let query = supabase
      .from('confessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (creator_ref) {
      query = query.eq('creator_ref', creator_ref);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { statusCode: 200, headers, body: JSON.stringify({ confessions: data }) };
  } catch (e) {
    console.error('get-confessions error:', e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to load confessions' }) };
  }
};
