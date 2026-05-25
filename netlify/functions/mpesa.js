// netlify/functions/mpesa.js
// Proxies PayHero STK Push — solves CORS, keeps credentials server-side

const PAYHERO_AUTH = 'Basic cUZPM2JnUmF0c3J3TXF4ODZhSXk6WGR2dG5WcmVaWGZxdlRVSUxYSENBSE96UHJUcTdFS0l5WFZzZ1h6SA==';
const PAYHERO_CHANNEL_ID = 5916;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { amount, phone, reference } = JSON.parse(event.body || '{}');

    if (!amount || !phone) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'amount and phone are required' }) };
    }

    // Ensure amount is a positive integer (KSh)
    const kshAmount = Math.max(1, Math.round(Number(amount)));

    const payload = {
      amount: kshAmount,
      phone_number: phone,
      channel_id: PAYHERO_CHANNEL_ID,
      provider: 'm-pesa',
      external_reference: reference || ('SINTAX-' + Date.now()),
      callback_url: 'https://sintax.netlify.app/.netlify/functions/mpesa-callback',
    };

    const res = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': PAYHERO_AUTH,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok && (data.success || data.status === 'SUCCESS' || data.CheckoutRequestID)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'STK Push sent', data }),
      };
    } else {
      console.error('PayHero error:', JSON.stringify(data));
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: data.message || data.error || 'Payment failed' }),
      };
    }
  } catch (e) {
    console.error('mpesa function error:', e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Internal server error' }),
    };
  }
};
