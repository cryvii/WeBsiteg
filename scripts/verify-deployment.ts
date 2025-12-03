#!/usr/bin/env node
/**
 * Managed Hosting Deployment Verification Script
 * 
 * This script verifies that a managed hosting deployment (Vercel + Neon)
 * meets all the requirements specified in the design document.
 * 
 * Tests:
 * - Example 1: Application Accessibility
 * - Example 2: Database Connectivity
 * - Example 3: Data Persistence
 * - Example 4: Build Success
 * - Example 5: Build Artifacts Present
 * - Example 6: Environment Variable Access
 * - Example 7: Environment Variable Security
 * - Example 8: Schema Initialization
 */

import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

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
 * Validates: Requirements 1.1, 1.2
 */
async function testApplicationAccessibility(url?: string): Promise<void> {
  section('Example 1: Application Accessibility');
  
  if (!url) {
    warning('No deployment URL provided. Skipping accessibility test.');
    info('To test: npm run verify-deployment -- --url https://your-app.vercel.app');
    // Don't record as failed - it's optional when no URL is provided
    return;
  }

  try {
    const response = await fetch(url);
    
    if (response.ok && response.status === 200) {
      const html = await response.text();
      
      // Check if it's actually HTML content
      if (html.includes('<!DOCTYPE html') || html.includes('<html')) {
        recordResult('Application Accessibility', true, 'Application is accessible and returns HTML');
      } else {
        recordResult('Application Accessibility', false, 'Application returns non-HTML content');
      }
    } else {
      recordResult('Application Accessibility', false, `Application returned status ${response.status}`);
    }
  } catch (err) {
    recordResult('Application Accessibility', false, `Failed to reach application: ${err}`);
  }
}

/**
 * Example 2: Database Connectivity
 * Validates: Requirements 2.1, 2.2, 2.4
 */
async function testDatabaseConnectivity(): Promise<postgres.Sql | null> {
  section('Example 2: Database Connectivity');
  
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    recordResult('Database Connectivity', false, 'DATABASE_URL not set');
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
    return null;
  }
}

/**
 * Example 3: Data Persistence
 * Validates: Requirements 2.3, 8.4, 6.5
 */
async function testDataPersistence(client: postgres.Sql): Promise<void> {
  section('Example 3: Data Persistence');
  
  try {
    // Create a test commission
    const testData = {
      client_name: 'Test Client',
      email: 'test@example.com',
      description: 'Test commission for verification',
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
      recordResult('Data Persistence', true, 'Data persisted correctly');
      
      // Clean up test data
      await client`DELETE FROM commissions WHERE id = ${insertedId}`;
    } else {
      recordResult('Data Persistence', false, 'Queried data does not match inserted data');
    }
  } catch (err) {
    recordResult('Data Persistence', false, `Persistence test failed: ${err}`);
  }
}

/**
 * Example 4: Build Success
 * Validates: Requirements 3.1, 3.5
 */
async function testBuildSuccess(): Promise<void> {
  section('Example 4: Build Success');
  
  // Check if build directory exists
  const buildDirs = ['.vercel/output', 'build', '.svelte-kit'];
  let buildDirFound = false;
  let buildDir = '';

  for (const dir of buildDirs) {
    if (existsSync(dir)) {
      buildDirFound = true;
      buildDir = dir;
      break;
    }
  }

  if (buildDirFound) {
    recordResult('Build Success', true, `Build output found at ${buildDir}`);
  } else {
    recordResult('Build Success', false, 'No build output directory found. Run: npm run build');
  }
}

/**
 * Example 5: Build Artifacts Present
 * Validates: Requirements 3.2, 3.4
 */
async function testBuildArtifacts(): Promise<void> {
  section('Example 5: Build Artifacts Present');
  
  // Check for Vercel output structure
  if (existsSync('.vercel/output')) {
    const hasConfig = existsSync('.vercel/output/config.json');
    const hasStatic = existsSync('.vercel/output/static');
    const hasFunctions = existsSync('.vercel/output/functions');

    if (hasConfig && (hasStatic || hasFunctions)) {
      recordResult('Build Artifacts', true, 'Vercel build artifacts present');
      
      // Check for static assets
      if (existsSync('.vercel/output/static')) {
        const staticFiles = readdirSync('.vercel/output/static');
        info(`  Static assets: ${staticFiles.length} file(s)`);
      }
    } else {
      recordResult('Build Artifacts', false, 'Incomplete Vercel build artifacts');
    }
  } else if (existsSync('build')) {
    // Check for adapter-node build
    const hasIndex = existsSync('build/index.js');
    
    if (hasIndex) {
      recordResult('Build Artifacts', true, 'Node adapter build artifacts present');
    } else {
      recordResult('Build Artifacts', false, 'Incomplete build artifacts');
    }
  } else {
    recordResult('Build Artifacts', false, 'No build artifacts found. Run: npm run build');
  }
}

/**
 * Example 6: Environment Variable Access
 * Validates: Requirements 4.1, 4.2
 */
async function testEnvironmentVariableAccess(): Promise<void> {
  section('Example 6: Environment Variable Access');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    // Check if it's a valid PostgreSQL connection string
    const isValid = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');
    
    if (isValid) {
      recordResult('Environment Variable Access', true, 'DATABASE_URL is accessible and valid');
    } else {
      recordResult('Environment Variable Access', false, 'DATABASE_URL has invalid format');
    }
  } else {
    recordResult('Environment Variable Access', false, 'DATABASE_URL is not set');
  }
}

/**
 * Example 7: Environment Variable Security
 * Validates: Requirements 4.3, 4.5
 */
async function testEnvironmentVariableSecurity(): Promise<void> {
  section('Example 7: Environment Variable Security');
  
  let allSecure = true;
  const issues: string[] = [];

  // Check .gitignore
  if (existsSync('.gitignore')) {
    const gitignore = readFileSync('.gitignore', 'utf-8');
    
    if (!gitignore.includes('.env')) {
      issues.push('.env not in .gitignore');
      allSecure = false;
    }
  } else {
    issues.push('.gitignore file missing');
    allSecure = false;
  }

  // Check if .env is tracked in git (if git exists)
  if (existsSync('.git')) {
    try {
      const { execSync } = require('child_process');
      const tracked = execSync('git ls-files .env', { encoding: 'utf-8' }).trim();
      
      if (tracked) {
        issues.push('.env is tracked in git');
        allSecure = false;
      }
    } catch (err) {
      // .env not tracked (good) or git command failed
    }
  }

  // Check client-side bundles for exposed secrets (if build exists)
  const clientBundlePaths = [
    '.vercel/output/static/_app',
    'build/client',
    '.svelte-kit/output/client',
  ];

  for (const bundlePath of clientBundlePaths) {
    if (existsSync(bundlePath)) {
      try {
        const files = getAllFiles(bundlePath);
        const jsFiles = files.filter(f => f.endsWith('.js'));
        
        for (const file of jsFiles) {
          const content = readFileSync(file, 'utf-8');
          
          // Check for common secret patterns
          if (content.includes('DATABASE_URL') || 
              content.match(/postgres:\/\/[^"'\s]+/)) {
            issues.push(`Potential secret exposure in ${file}`);
            allSecure = false;
          }
        }
      } catch (err) {
        // Ignore read errors
      }
      break; // Only check one bundle path
    }
  }

  if (allSecure) {
    recordResult('Environment Variable Security', true, 'No security issues detected');
  } else {
    recordResult('Environment Variable Security', false, `Security issues: ${issues.join(', ')}`);
  }
}

/**
 * Example 8: Schema Initialization
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 */
async function testSchemaInitialization(client: postgres.Sql): Promise<void> {
  section('Example 8: Schema Initialization');
  
  try {
    // Check for required tables
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;

    const tableNames = tables.map(t => t.table_name);
    const requiredTables = ['users', 'settings', 'commissions'];
    const allTablesExist = requiredTables.every(t => tableNames.includes(t));

    if (!allTablesExist) {
      const missing = requiredTables.filter(t => !tableNames.includes(t));
      recordResult('Schema Initialization', false, `Missing tables: ${missing.join(', ')}`);
      return;
    }

    // Check for status enum
    const enums = await client`
      SELECT t.typname as enum_name
      FROM pg_type t 
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typname = 'status'
    `;

    if (enums.length === 0) {
      recordResult('Schema Initialization', false, 'Status enum not found');
      return;
    }

    recordResult('Schema Initialization', true, 'All tables and enums initialized correctly');
  } catch (err) {
    recordResult('Schema Initialization', false, `Schema check failed: ${err}`);
  }
}

// Helper function to recursively get all files
function getAllFiles(dir: string): string[] {
  const files: string[] = [];
  
  try {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }
  } catch (err) {
    // Ignore errors
  }
  
  return files;
}

// Main verification function
async function verifyDeployment() {
  console.log(`${colors.cyan}🔍 Verifying Managed Hosting Deployment${colors.reset}\n`);
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const urlIndex = args.indexOf('--url');
  const deploymentUrl = urlIndex !== -1 ? args[urlIndex + 1] : undefined;

  let client: postgres.Sql | null = null;

  try {
    // Run all tests
    await testApplicationAccessibility(deploymentUrl);
    client = await testDatabaseConnectivity();
    
    if (client) {
      await testDataPersistence(client);
      await testSchemaInitialization(client);
    } else {
      warning('Skipping database-dependent tests due to connection failure');
    }
    
    await testBuildSuccess();
    await testBuildArtifacts();
    await testEnvironmentVariableAccess();
    await testEnvironmentVariableSecurity();

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
      process.exit(0);
    } else {
      error('Some verification checks failed.');
      console.log('\nFailed tests:');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}: ${r.message || 'Failed'}`);
      });
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
verifyDeployment().catch((err) => {
  error('Unexpected error:');
  console.error(err);
  process.exit(1);
});
