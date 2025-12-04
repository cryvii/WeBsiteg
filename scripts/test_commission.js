// Usage: node scripts/test_commission.js [URL]
// Defaults to http://localhost:5173/api/commission

const url = process.argv[2] || process.env.TEST_URL || 'http://localhost:5173/api/commission';

const payload = {
  name: 'Test User',
  email: 'test@example.com',
  description: 'This is a test commission submission to verify the API.'
};

async function run() {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Request failed:', err);
    process.exit(1);
  }
}

run();
