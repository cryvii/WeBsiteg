#!/usr/bin/env node
/**
 * Self-Hosting Deployment Verification Script
 * 
 * This script verifies that a self-hosting deployment meets all the
 * requirements specified in the design document.
 * 
 * Tests:
 * - Example 1: Application Accessibility
 * - Example 2: Database Connectivity
 * - Example 3: Data Persistence
 * - Example 9: Connection String Format
 */

import 'dotenv/config';
import postgres from 'postgres';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function success(message: string) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function error(message: string) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function info(message: string) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${message}`);
}

function warning(message: string) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function section(message: string) {
  console.log(`\n${colors.blue}${message}${colors.reset}`);
}

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function recordResult(name: string, passed: boolean, message?: string) {
  results.push({ name, passed, message });
  if (passed) {
    success(message || name);
  } else {
    error(message || name);
  }
}

/**
 * Example 1: Application Accessibility
 * Validates: Requirements 1.1, 1.2, 7.1
 */
async function testApplicationAccessibility(url: string): Promise<void> {
  section('Example 1: Application Accessibility');
  
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    if (response.ok && response.status === 200) {
      const html = await response.text();
      
      // Check if it's actually HTML content
      if (html.includes('<!DOCTYPE html') || html.includes('<html')) {
        recordResult('Application Accessibility', true, `Application is accessible at ${url}`);
      } else {
        recordResult('Application Accessibility', false, 'Application returns non-HTML content');
      }
    } else {
      recordResult('Application Accessibility', false, `Application returned status ${response.status}`);
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      recordResult('Application Accessibility', false, 'Connection timeout - is the application running?');
    } else {
      recordResult('Application Accessibility', false, `Failed to reach application: ${err}`);
    }
    info('Make sure the application is running: ./scripts/start-app.sh');
  }
}

/**
 * Example 2: Database Connectivity
 * Validates: Requirements 8.1, 8.2
 */
async function testDatabaseConnectivity(): Promise<postgres.Sql | null> {
  section('Example 2: Database Connectivity');
  
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    recordResult('Database Connectivity', false, 'DATABASE_URL not set in .env file');
    return null;
  }

  try {
    const client = postgres(connectionString, {
      max: 1,
      ssl: connectionString.includes('sslmode=require') ? 'require' : undefined,
    });

    // Execute a simple query
    const result = await client`SELECT 1 as test`;
    
    if (result[0]?.test === 1) {
      recordResult('Database Connectivity', true, 'Successfully connected and queried database');
      return client;
    } else {
      recordResult('Database Connectivity', false, 'Query returned unexpected result');
      await client.end();
      return null;
    }
  } catch (err) {
    recordResult('Database Connectivity', false, `Connection failed: ${err}`);
    info('Check your DATABASE_URL in .env file');
    return null;
  }
}

/**
 * Example 3: Data Persistence
 * Validates: Requirements 8.4
 */
async function testDataPersistence(client: postgres.Sql): Promise<void> {
  section('Example 3: Data Persistence');
  
  try {
    // Create a test commission
    const testData = {
      client_name: 'Test Client (Self-Hosting)',
      email: 'test-selfhost@example.com',
      description: 'Test commission for self-hosting verification',
      status: 'pending' as const,
    };

    const inserted = await client`
      INSERT INTO commissions (client_name, email, description, status)
      VALUES (${testData.client_name}, ${testData.email}, ${testData.description}, ${testData.status})
      RETURNING id, client_name, email, description, status
    `;

    if (inserted.length === 0) {
      recordResult('Data Persistence', false, 'Failed to insert test data');
      return;
    }

    const insertedId = inserted[0].id;

    // Query the data back
    const queried = await client`
      SELECT id, client_name, email, description, status
      FROM commissions
      WHERE id = ${insertedId}
    `;

    if (queried.length === 0) {
      recordResult('Data Persistence', false, 'Failed to query inserted data');
      return;
    }

    // Verify data matches
    const match = 
      queried[0].client_name === testData.client_name &&
      queried[0].email === testData.email &&
      queried[0].description === testData.description &&
      queried[0].status === testData.status;

    if (match) {
      recordResult('Data Persistence', true, 'Data persisted correctly to local database');
      
      // Clean up test data
      await client`DELETE FROM commissions WHERE id = ${insertedId}`;
      info('Test data cleaned up');
    } else {
      recordResult('Data Persistence', false, 'Queried data does not match inserted data');
    }
  } catch (err) {
    recordResult('Data Persistence', false, `Persistence test failed: ${err}`);
  }
}

/**
 * Example 9: Connection String Format
 * Validates: Requirements 8.2
 */
async function testConnectionStringFormat(): Promise<void> {
  section('Example 9: Connection String Format');
  
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    recordResult('Connection String Format', false, 'DATABASE_URL not set');
    return;
  }

  // Check if it's a valid PostgreSQL connection string
  const isPostgres = connectionString.startsWith('postgres://') || 
                     connectionString.startsWith('postgresql://');
  
  if (!isPostgres) {
    recordResult('Connection String Format', false, 'DATABASE_URL must start with postgres:// or postgresql://');
    return;
  }

  // Check if it's a localhost connection (typical for self-hosting)
  const isLocalhost = connectionString.includes('localhost') || 
                      connectionString.includes('127.0.0.1');
  
  // Check if it's a Neon connection (also valid for self-hosting)
  const isNeon = connectionString.includes('neon.tech');

  if (isLocalhost) {
    recordResult('Connection String Format', true, 'Using local PostgreSQL database');
    info('Connection type: Local PostgreSQL');
    
    // Validate localhost format
    const localhostPattern = /postgresql:\/\/[^:]+:[^@]+@(localhost|127\.0\.0\.1):\d+\/\w+/;
    if (localhostPattern.test(connectionString)) {
      info('Format is correct: postgresql://user:password@localhost:port/database');
    } else {
      warning('Connection string format may be non-standard');
    }
  } else if (isNeon) {
    recordResult('Connection String Format', true, 'Using Neon database with self-hosted app');
    info('Connection type: Neon (managed database)');
    
    // Check for SSL requirement
    if (connectionString.includes('sslmode=require')) {
      info('SSL mode correctly configured for Neon');
    } else {
      warning('Neon connections should include ?sslmode=require');
    }
  } else {
    recordResult('Connection String Format', true, 'Using remote PostgreSQL database');
    info('Connection type: Remote PostgreSQL');
  }
}

// Main verification function
async function verifySelfHosting() {
  console.log(`${colors.cyan}🔍 Verifying Self-Hosting Deployment${colors.reset}\n`);
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const urlIndex = args.indexOf('--url');
  const appUrl = urlIndex !== -1 ? args[urlIndex + 1] : 'http://localhost:3000';

  info(`Testing application at: ${appUrl}`);
  info('Make sure the application is running before verification');
  console.log('');

  let client: postgres.Sql | null = null;

  try {
    // Run all tests
    await testApplicationAccessibility(appUrl);
    await testConnectionStringFormat();
    client = await testDatabaseConnectivity();
    
    if (client) {
      await testDataPersistence(client);
    } else {
      warning('Skipping data persistence test due to connection failure');
    }

    // Print summary
    section('📊 Verification Summary');
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    console.log('');
    info(`Total tests: ${total}`);
    success(`Passed: ${passed}`);
    if (failed > 0) {
      error(`Failed: ${failed}`);
    }

    console.log('');
    if (failed === 0) {
      success('All verification checks passed! ✨');
      console.log('');
      info('Your self-hosted deployment is working correctly!');
      console.log('');
      info('Next steps:');
      console.log('  1. Set up Cloudflare Tunnel for public access');
      console.log('  2. See: docs/cloudflare-tunnel-setup.md');
      console.log('  3. Or run: ./scripts/start-with-tunnel.sh');
      console.log('');
      process.exit(0);
    } else {
      error('Some verification checks failed.');
      console.log('\nFailed tests:');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}: ${r.message || 'Failed'}`);
      });
      console.log('');
      info('Troubleshooting:');
      console.log('  - Ensure application is running: ./scripts/start-app.sh');
      console.log('  - Check .env file has DATABASE_URL set');
      console.log('  - Verify database is running (PostgreSQL service)');
      console.log('  - Run migrations: npx drizzle-kit push');
      console.log('');
      process.exit(1);
    }
  } catch (err) {
    error('Verification failed with unexpected error:');
    console.error(err);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Run verification
verifySelfHosting().catch((err) => {
  error('Unexpected error:');
  console.error(err);
  process.exit(1);
});
