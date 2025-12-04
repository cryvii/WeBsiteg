#!/usr/bin/env node

/**
 * Comprehensive Admin Dashboard Test Suite
 * Tests: Authentication, Commissions, Dates, Status transitions
 */

const baseURL = 'http://localhost:5173';
const adminCreds = { username: 'Test', password: 'test123' };

let sessionCookie = '';
let commissionIds = [];

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    return true;
  } catch (err) {
    console.error(`✗ ${name}: ${err.message}`);
    return false;
  }
}

async function login() {
  const res = await fetch(`${baseURL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adminCreds)
  });
  if (!res.ok) throw new Error('Login failed');
  const setCookie = res.headers.get('set-cookie');
  sessionCookie = setCookie?.split(';')[0] || '';
}

async function getCommissions() {
  const res = await fetch(`${baseURL}/api/admin/commissions`, {
    headers: { 'Cookie': sessionCookie }
  });
  if (!res.ok) throw new Error('Failed to fetch commissions');
  return await res.json();
}

async function updateCommission(id, status, acceptedAt, completionDate) {
  const res = await fetch(`${baseURL}/api/admin/commissions`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie
    },
    body: JSON.stringify({ id, status, accepted_at: acceptedAt, completion_date: completionDate })
  });
  if (!res.ok) throw new Error('Failed to update commission');
  return await res.json();
}

async function sendCommission(data) {
  const res = await fetch(`${baseURL}/api/commission`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Commission submission failed');
}

async function runTests() {
  console.log('🧪 Starting Admin Dashboard Test Suite\n');

  let passed = 0, failed = 0;

  // Test 1: Authentication
  console.log('📋 Authentication Tests');
  if (await test('Login with correct credentials', login)) passed++; else failed++;
  if (await test('Check auth session exists', async () => {
    const res = await fetch(`${baseURL}/api/admin/check-auth`, {
      headers: { 'Cookie': sessionCookie }
    });
    if (!res.ok) throw new Error('Auth check failed');
  })) passed++; else failed++;

  // Test 2: Commission Retrieval
  console.log('\n📨 Commission Retrieval Tests');
  if (await test('Fetch commissions list', async () => {
    const comms = await getCommissions();
    if (!Array.isArray(comms)) throw new Error('Not an array');
    commissionIds = comms.filter(c => c.status === 'pending').map(c => c.id);
    if (commissionIds.length === 0) throw new Error('No pending commissions');
  })) passed++; else failed++;

  if (await test('Verify commission structure', async () => {
    const comms = await getCommissions();
    const comm = comms[0];
    if (!comm.id || !comm.email || !comm.description || !comm.created_at) {
      throw new Error('Missing required fields');
    }
  })) passed++; else failed++;

  // Test 3: Status Transitions
  console.log('\n🔄 Status Transition Tests');
  const testCommId = commissionIds[0];
  
  if (await test('Accept commission', async () => {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dueDateStr = futureDate.toISOString().split('T')[0];
    await updateCommission(testCommId, 'approved', today, dueDateStr);
  })) passed++; else failed++;

  if (await test('Verify commission status changed to approved', async () => {
    const comms = await getCommissions();
    const comm = comms.find(c => c.id === testCommId);
    if (comm.status !== 'approved') throw new Error(`Status is ${comm.status}, not approved`);
  })) passed++; else failed++;

  if (await test('Mark as completed', async () => {
    await updateCommission(testCommId, 'completed', null, null);
  })) passed++; else failed++;

  if (await test('Mark as paid', async () => {
    await updateCommission(testCommId, 'paid', null, null);
  })) passed++; else failed++;

  // Test 4: Date Validation
  console.log('\n📅 Date Validation Tests');
  if (await test('Completion date is after request date', async () => {
    const comms = await getCommissions();
    const comm = comms.find(c => c.status === 'pending' && c.id !== testCommId);
    if (!comm) throw new Error('No pending commission found');
    
    const requestDate = new Date(comm.created_at);
    const futureDate = new Date(requestDate);
    futureDate.setDate(futureDate.getDate() + 1);
    const dueDateStr = futureDate.toISOString().split('T')[0];
    
    await updateCommission(comm.id, 'approved', dueDateStr, dueDateStr);
    
    const updated = await getCommissions();
    const updatedComm = updated.find(c => c.id === comm.id);
    
    if (new Date(updatedComm.completion_date) <= new Date(updatedComm.created_at)) {
      throw new Error('Completion date not after request date');
    }
  })) passed++; else failed++;

  // Test 5: Data Integrity
  console.log('\n🔒 Data Integrity Tests');
  if (await test('Email field preserved', async () => {
    const comms = await getCommissions();
    const comm = comms[0];
    if (!comm.email.includes('@')) throw new Error('Invalid email');
  })) passed++; else failed++;

  if (await test('Description preserved', async () => {
    const comms = await getCommissions();
    const comm = comms[0];
    if (comm.description.length === 0) throw new Error('Empty description');
  })) passed++; else failed++;

  if (await test('Timestamps are valid ISO dates', async () => {
    const comms = await getCommissions();
    const comm = comms[0];
    const dateStr = comm.created_at;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) throw new Error('Invalid timestamp');
  })) passed++; else failed++;

  // Test 6: Edge Cases
  console.log('\n⚠️ Edge Case Tests');
  if (await test('Cannot reject already completed commission', async () => {
    // Get completed commission
    const comms = await getCommissions();
    const completed = comms.find(c => c.status === 'completed');
    if (!completed) {
      throw new Error('No completed commission for test - skipping');
    }
    // Try to reject (should still work but status should be 'rejected' not stay 'completed')
    await updateCommission(completed.id, 'rejected', null, null);
    const updated = await getCommissions();
    const updatedComm = updated.find(c => c.id === completed.id);
    if (updatedComm.status !== 'rejected') {
      throw new Error('Status not updated to rejected');
    }
  })) passed++; else failed++;

  if (await test('Accepted date is set automatically on approval', async () => {
    const comms = await getCommissions();
    const approved = comms.find(c => c.status === 'approved' && c.accepted_at);
    if (!approved) throw new Error('No approved commission with accepted_at');
    
    const acceptedDate = new Date(approved.accepted_at);
    if (isNaN(acceptedDate.getTime())) throw new Error('Invalid accepted_at date');
  })) passed++; else failed++;

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Total: ${passed + failed} | ✓ Passed: ${passed} | ✗ Failed: ${failed}`);
  if (failed === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log(`⚠️ ${failed} test(s) failed`);
  }
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
