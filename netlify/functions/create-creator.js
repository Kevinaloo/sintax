// netlify/functions/create-creator.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function generateRef(handle) {
  // Clean handle + short random suffix for uniqueness
  const clean = handle.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
  const suffix = Math.random().toString(36).slice(2, 6);
  return clean + '-' + suffix;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { handle } = JSON.parse(event.body || '{}');

    if (!handle || handle.trim().length < 2) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Handle too short' }) };
    }

    const cleanHandle = handle.trim().replace(/^@/, '');

    // Check if handle already exists
    const { data: existing } = await supabase
      .from('creators')
      .select('ref_code')
      .eq('handle', cleanHandle)
      .single();

    if (existing) {
      // Return existing ref so they can reuse their link
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, ref_code: existing.ref_code, existing: true }),
      };
    }

    // Create new creator
    const ref_code = generateRef(cleanHandle);
    const { data, error } = await supabase.from('creators').insert({
      handle: cleanHandle,
      ref_code,
    }).select().single();

    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, ref_code: data.ref_code, existing: false }),
    };
  } catch (e) {
    console.error('create-creator error:', e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to create creator link' }) };
  }
};
