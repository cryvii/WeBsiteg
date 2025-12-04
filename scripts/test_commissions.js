#!/usr/bin/env node

// Test script to generate 10 dummy commission requests
const baseURL = process.argv[2] || 'http://localhost:5173';

const dummyCommissions = [
  {
    name: 'Alice',
    email: 'alice@example.com',
    description: 'Portrait of my cat in fantasy armor. Wants vibrant colors and magical aura.'
  },
  {
    name: 'Bob',
    email: 'bob@example.com',
    description: 'Character design for D&D campaign - half-elf ranger with nature theme.'
  },
  {
    name: 'Charlie',
    email: 'charlie@example.com',
    description: 'Fanart of my favorite anime character in modern outfit.'
  },
  {
    name: 'Diana',
    email: 'diana@example.com',
    description: 'Commissions sticker pack - 5 cute animal designs (16x16 pixels each).'
  },
  {
    name: 'Ethan',
    email: 'ethan@example.com',
    description: 'Book cover illustration - sci-fi dystopian city landscape.'
  },
  {
    name: 'Fiona',
    email: 'fiona@example.com',
    description: 'Wedding portrait of me and my partner - oil painting style preferred.'
  },
  {
    name: 'George',
    email: 'george@example.com',
    description: 'Logo design for my indie game studio. Modern and minimalist style.'
  },
  {
    name: 'Hannah',
    email: 'hannah@example.com',
    description: 'Concept art for my novel - mystical forest with ancient ruins.'
  },
  {
    name: 'Isaac',
    email: 'isaac@example.com',
    description: 'Commission 3 OCs (original characters) - full body, colored, with backgrounds.'
  },
  {
    name: 'Julia',
    email: 'julia@example.com',
    description: 'Product mockup illustration - cute mascot character for SaaS app.'
  }
];

async function sendCommission(data) {
  try {
    const res = await fetch(`${baseURL}/api/commission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    
    if (res.ok) {
      console.log(`✓ ${data.name} (${data.email})`);
    } else {
      console.log(`✗ ${data.name}: ${result.error}`);
    }
  } catch (err) {
    console.error(`✗ ${data.name}: ${err.message}`);
  }
}

async function sendAll() {
  console.log(`Sending 10 test commissions to ${baseURL}...\n`);
  
  for (const commission of dummyCommissions) {
    await sendCommission(commission);
    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between requests
  }
  
  console.log('\n✓ Done! Check the admin dashboard at http://localhost:5173/admin');
}

sendAll();
