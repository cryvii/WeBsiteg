import 'dotenv/config';
import postgres from 'postgres';

const client = postgres('postgres://user:password@localhost:5432/bunker', { ssl: false });

async function checkData() {
    const result = await client`SELECT id, client_name, status, created_at, accepted_at, completion_date, scheduled_at FROM commissions ORDER BY created_at`;
    console.log(JSON.stringify(result, null, 2));
    await client.end();
}

checkData();
