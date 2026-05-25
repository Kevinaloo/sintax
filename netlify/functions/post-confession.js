// netlify/functions/post-confession.js
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
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { text, category, sin_type, sin_score, verdict, amount_ksh, creator_ref } = JSON.parse(event.body || '{}');

    if (!text || text.length < 20) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Confession too short' }) };
    }

    // Insert confession
    const { data, error } = await supabase.from('confessions').insert({
      text,
      category: category || 'Chaos',
      sin_type: sin_type || null,
      sin_score: sin_score || 50,
      verdict: verdict || 'redeemed',
      amount_ksh: amount_ksh || 0,
      creator_ref: creator_ref || null,
    }).select().single();

    if (error) throw error;

    // Update creator totals if this came through a creator link
    if (creator_ref && amount_ksh > 0) {
      await supabase.rpc('increment_creator_totals', {
        ref: creator_ref,
        amount: amount_ksh,
      }).catch(() => {
        // Fallback if RPC not set up — do a manual update
        supabase.from('creators')
          .select('total_donations_ksh, confession_count')
          .eq('ref_code', creator_ref)
          .single()
          .then(({ data: creator }) => {
            if (creator) {
              supabase.from('creators').update({
                total_donations_ksh: (creator.total_donations_ksh || 0) + amount_ksh,
                confession_count: (creator.confession_count || 0) + 1,
              }).eq('ref_code', creator_ref);
            }
          });
      });
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, id: data.id }) };
  } catch (e) {
    console.error('post-confession error:', e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to save confession' }) };
  }
};
