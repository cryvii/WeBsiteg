#!/usr/bin/env node
/**
 * Database Schema Verification Script
 * 
 * This script verifies that the database schema matches the expected structure
 * after running migrations. It checks for:
 * - Database connectivity
 * - Existence of required tables
 * - Existence of required enums
 * - Correct column definitions
 * - Proper constraints
 */

import 'dotenv/config';
import postgres from 'postgres';

// ANSI color codes for terminal output
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

function section(message: string) {
  console.log(`\n${colors.blue}${message}${colors.reset}`);
}

async function verifySchema() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    error('DATABASE_URL environment variable is not set');
    console.log('\nPlease set DATABASE_URL in your .env file or environment:');
    console.log('  DATABASE_URL=postgresql://user:password@host:port/database');
    process.exit(1);
  }

  info(`Connecting to database...`);
  
  let client: ReturnType<typeof postgres>;
  
  try {
    client = postgres(connectionString, {
      max: 1, // Only need one connection for verification
      ssl: connectionString.includes('sslmode=require') ? 'require' : undefined,
    });

    // Test connection
    await client`SELECT 1`;
    success('Database connection successful');
  } catch (err) {
    error('Failed to connect to database');
    console.error(err);
    process.exit(1);
  }

  let hasErrors = false;

  try {
    // Check for required tables
    section('🔍 Checking tables...');
    
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;

    const tableNames = tables.map(t => t.table_name);
    const requiredTables = ['users', 'settings', 'commissions'];

    for (const tableName of requiredTables) {
      if (tableNames.includes(tableName)) {
        success(`Table '${tableName}' exists`);
      } else {
        error(`Table '${tableName}' is missing`);
        hasErrors = true;
      }
    }

    // Check users table schema
    if (tableNames.includes('users')) {
      section('🔍 Verifying users table schema...');
      
      const usersColumns = await client`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `;

      const expectedColumns = {
        id: { type: 'integer', nullable: 'NO' },
        username: { type: 'text', nullable: 'NO' },
        password_hash: { type: 'text', nullable: 'NO' },
      };

      for (const [colName, expected] of Object.entries(expectedColumns)) {
        const col = usersColumns.find(c => c.column_name === colName);
        if (col) {
          if (col.data_type === expected.type && col.is_nullable === expected.nullable) {
            success(`  Column '${colName}' is correct (${expected.type}, ${expected.nullable === 'NO' ? 'NOT NULL' : 'NULL'})`);
          } else {
            error(`  Column '${colName}' has incorrect definition`);
            hasErrors = true;
          }
        } else {
          error(`  Column '${colName}' is missing`);
          hasErrors = true;
        }
      }

      // Check username unique constraint
      const usersConstraints = await client`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'users'
      `;

      const hasUniqueConstraint = usersConstraints.some(
        c => c.constraint_type === 'UNIQUE' && c.constraint_name.includes('username')
      );

      if (hasUniqueConstraint) {
        success('  Username unique constraint exists');
      } else {
        error('  Username unique constraint is missing');
        hasErrors = true;
      }
    }

    // Check settings table schema
    if (tableNames.includes('settings')) {
      section('🔍 Verifying settings table schema...');
      
      const settingsColumns = await client`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'settings'
        ORDER BY ordinal_position
      `;

      const expectedColumns = {
        id: { type: 'boolean', nullable: 'NO' },
        is_commissions_open: { type: 'boolean', nullable: 'NO' },
        queue_limit: { type: 'integer', nullable: 'NO' },
      };

      for (const [colName, expected] of Object.entries(expectedColumns)) {
        const col = settingsColumns.find(c => c.column_name === colName);
        if (col) {
          if (col.data_type === expected.type && col.is_nullable === expected.nullable) {
            success(`  Column '${colName}' is correct (${expected.type}, ${expected.nullable === 'NO' ? 'NOT NULL' : 'NULL'})`);
          } else {
            error(`  Column '${colName}' has incorrect definition`);
            hasErrors = true;
          }
        } else {
          error(`  Column '${colName}' is missing`);
          hasErrors = true;
        }
      }
    }

    // Check commissions table schema
    if (tableNames.includes('commissions')) {
      section('🔍 Verifying commissions table schema...');
      
      const commissionsColumns = await client`
        SELECT column_name, data_type, is_nullable, column_default, udt_name
        FROM information_schema.columns
        WHERE table_name = 'commissions'
        ORDER BY ordinal_position
      `;

      const expectedColumns = {
        id: { type: 'integer', nullable: 'NO' },
        client_name: { type: 'text', nullable: 'NO' },
        email: { type: 'text', nullable: 'NO' },
        description: { type: 'text', nullable: 'NO' },
        price: { type: 'integer', nullable: 'YES' },
        status: { type: 'USER-DEFINED', nullable: 'NO', udt_name: 'status' },
        rejection_reason: { type: 'text', nullable: 'YES' },
        created_at: { type: 'timestamp without time zone', nullable: 'NO' },
      };

      for (const [colName, expected] of Object.entries(expectedColumns)) {
        const col = commissionsColumns.find(c => c.column_name === colName);
        if (col) {
          const expectedUdtName = 'udt_name' in expected ? expected.udt_name : undefined;
          const typeMatch = col.data_type === expected.type || 
                           (expectedUdtName && col.udt_name === expectedUdtName);
          
          if (typeMatch && col.is_nullable === expected.nullable) {
            const typeDisplay = expectedUdtName ? `enum(${expectedUdtName})` : expected.type;
            success(`  Column '${colName}' is correct (${typeDisplay}, ${expected.nullable === 'NO' ? 'NOT NULL' : 'NULL'})`);
          } else {
            error(`  Column '${colName}' has incorrect definition`);
            info(`    Expected: ${expected.type}, ${expected.nullable}`);
            info(`    Got: ${col.data_type}, ${col.is_nullable}`);
            hasErrors = true;
          }
        } else {
          error(`  Column '${colName}' is missing`);
          hasErrors = true;
        }
      }
    }

    // Check for status enum
    section('🔍 Checking enums...');
    
    const enums = await client`
      SELECT t.typname as enum_name, e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY t.typname, e.enumsortorder
    `;

    const statusEnum = enums.filter(e => e.enum_name === 'status');
    
    if (statusEnum.length > 0) {
      const statusValues = statusEnum.map(e => e.enum_value);
      const expectedValues = ['pending', 'approved', 'rejected', 'paid', 'completed'];
      
      const allValuesPresent = expectedValues.every(v => statusValues.includes(v));
      
      if (allValuesPresent && statusValues.length === expectedValues.length) {
        success(`Enum 'status' exists with correct values: ${statusValues.join(', ')}`);
      } else {
        error(`Enum 'status' has incorrect values`);
        info(`  Expected: ${expectedValues.join(', ')}`);
        info(`  Got: ${statusValues.join(', ')}`);
        hasErrors = true;
      }
    } else {
      error(`Enum 'status' is missing`);
      hasErrors = true;
    }

    // Check data counts (informational)
    section('📊 Data summary...');
    
    if (tableNames.includes('users')) {
      const userCount = await client`SELECT COUNT(*) as count FROM users`;
      info(`Users: ${userCount[0].count} row(s)`);
      if (userCount[0].count === '0') {
        console.log(`  ${colors.yellow}⚠${colors.reset} No admin users found. You may want to seed an admin user.`);
      }
    }

    if (tableNames.includes('settings')) {
      const settingsCount = await client`SELECT COUNT(*) as count FROM settings`;
      info(`Settings: ${settingsCount[0].count} row(s)`);
      if (settingsCount[0].count === '0') {
        console.log(`  ${colors.yellow}⚠${colors.reset} No settings row found. You may want to initialize settings.`);
      }
    }

    if (tableNames.includes('commissions')) {
      const commissionsCount = await client`SELECT COUNT(*) as count FROM commissions`;
      info(`Commissions: ${commissionsCount[0].count} row(s)`);
    }

    // Final summary
    console.log('');
    if (hasErrors) {
      error('Schema verification failed! Please run migrations:');
      console.log('  npx drizzle-kit push');
      process.exit(1);
    } else {
      success('Schema verification complete! All checks passed.');
      console.log('');
      process.exit(0);
    }

  } catch (err) {
    error('Verification failed with error:');
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run verification
console.log(`${colors.cyan}🔍 Verifying database schema...${colors.reset}\n`);
verifySchema().catch((err) => {
  error('Unexpected error:');
  console.error(err);
  process.exit(1);
});
