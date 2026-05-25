// netlify/functions/mpesa-callback.js
// PayHero calls this URL after payment completes
// Extend this to update Supabase with confirmed payment status

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    console.log('PayHero callback received:', JSON.stringify(body));

    // TODO: Update Supabase `donations` table with confirmed status
    // const { createClient } = require('@supabase/supabase-js');
    // const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    // await supabase.from('donations').update({ status: 'confirmed' })
    //   .eq('reference', body.external_reference);

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (e) {
    console.error('Callback error:', e);
    return { statusCode: 500, body: 'Error' };
  }
};











