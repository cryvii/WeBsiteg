#!/usr/bin/env tsx

/**
 * Environment Variable Security Verification Script
 * 
 * This script verifies that environment variables (especially DATABASE_URL)
 * are not exposed in the client-side JavaScript bundle or HTML source.
 * 
 * Validates: Requirements 4.3, 4.5
 * Example 7: Environment Variable Security
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// ANSI color codes for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message: string) {
    log(`✓ ${message}`, 'green');
}

function error(message: string) {
    log(`✗ ${message}`, 'red');
}

function warning(message: string) {
    log(`⚠ ${message}`, 'yellow');
}

function info(message: string) {
    log(`ℹ ${message}`, 'blue');
}

// Sensitive patterns to search for
const SENSITIVE_PATTERNS = [
    /DATABASE_URL/gi,
    /postgresql:\/\/[^\s"'`]+/gi, // PostgreSQL connection strings
    /postgres:\/\/[^\s"'`]+/gi,   // Alternative postgres:// format
];

// Directories to check in the build output
const BUILD_DIRS = [
    'build',
    '.svelte-kit/output',
    '.vercel/output',
];

// File extensions to check
const CLIENT_EXTENSIONS = ['.js', '.html', '.css', '.json'];

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dir: string, fileList: string[] = []): string[] {
    if (!existsSync(dir)) {
        return fileList;
    }

    const files = readdirSync(dir);

    files.forEach(file => {
        const filePath = join(dir, file);
        const stat = statSync(filePath);

        if (stat.isDirectory()) {
            // Skip node_modules and other irrelevant directories
            if (!file.startsWith('.') && file !== 'node_modules') {
                getAllFiles(filePath, fileList);
            }
        } else {
            fileList.push(filePath);
        }
    });

    return fileList;
}

/**
 * Check if a file contains sensitive information
 */
function checkFileForSecrets(filePath: string): { found: boolean; matches: string[] } {
    const ext = extname(filePath);
    
    // Only check client-side files
    if (!CLIENT_EXTENSIONS.includes(ext)) {
        return { found: false, matches: [] };
    }

    // Skip server-side files (they're allowed to have DATABASE_URL)
    const relativePath = filePath.replace(projectRoot, '');
    if (relativePath.includes('/server/') || 
        relativePath.includes('\\server\\') ||
        relativePath.includes('/server-') ||
        relativePath.includes('\\server-')) {
        return { found: false, matches: [] };
    }

    try {
        const content = readFileSync(filePath, 'utf-8');
        const matches: string[] = [];

        for (const pattern of SENSITIVE_PATTERNS) {
            const found = content.match(pattern);
            if (found) {
                matches.push(...found);
            }
        }

        return { found: matches.length > 0, matches };
    } catch (err) {
        warning(`Could not read file: ${filePath}`);
        return { found: false, matches: [] };
    }
}

/**
 * Check .gitignore for .env
 */
function checkGitignore(): boolean {
    const gitignorePath = join(projectRoot, '.gitignore');
    
    if (!existsSync(gitignorePath)) {
        error('.gitignore file not found');
        return false;
    }

    const content = readFileSync(gitignorePath, 'utf-8');
    const lines = content.split('\n').map(line => line.trim());

    // Check for .env patterns
    const hasEnv = lines.some(line => 
        line === '.env' || 
        line === '.env.*' || 
        line.startsWith('.env')
    );

    if (hasEnv) {
        success('.env is properly listed in .gitignore');
        return true;
    } else {
        error('.env is NOT in .gitignore - this is a security risk!');
        return false;
    }
}

/**
 * Check if .env.example exists
 */
function checkEnvExample(): boolean {
    const envExamplePath = join(projectRoot, '.env.example');
    
    if (!existsSync(envExamplePath)) {
        error('.env.example file not found');
        return false;
    }

    const content = readFileSync(envExamplePath, 'utf-8');
    
    // Verify it doesn't contain actual secrets (check for placeholder patterns)
    const hasPlaceholders = content.includes('YOUR_') || 
                           content.includes('your-') ||
                           content.includes('REPLACE') ||
                           content.includes('example');
    
    // Check for patterns that look like real credentials (not placeholders)
    const suspiciousPatterns = [
        /postgresql:\/\/[a-z0-9]+:[a-z0-9]{20,}/gi, // Real looking passwords
        /@ep-[a-z0-9-]+\..*\.neon\.tech/gi,        // Real Neon endpoints
    ];
    
    const hasRealSecrets = suspiciousPatterns.some(pattern => {
        const matches = content.match(pattern);
        return matches && matches.length > 0;
    });

    if (hasRealSecrets && !hasPlaceholders) {
        error('.env.example contains what appears to be real credentials!');
        return false;
    }

    // Verify it mentions DATABASE_URL
    if (!content.includes('DATABASE_URL')) {
        warning('.env.example does not document DATABASE_URL');
        return false;
    }

    success('.env.example exists and looks safe');
    return true;
}

/**
 * Check build output for exposed secrets
 */
function checkBuildOutput(): boolean {
    info('Checking build output for exposed secrets...');
    
    let foundBuildDir = false;
    let hasSecrets = false;
    const exposedFiles: Array<{ file: string; matches: string[] }> = [];

    for (const buildDir of BUILD_DIRS) {
        const fullPath = join(projectRoot, buildDir);
        
        if (!existsSync(fullPath)) {
            continue;
        }

        foundBuildDir = true;
        info(`Scanning ${buildDir}...`);

        const files = getAllFiles(fullPath);
        const clientFiles = files.filter(f => {
            const ext = extname(f);
            return CLIENT_EXTENSIONS.includes(ext);
        });

        info(`  Found ${clientFiles.length} client-side files to check`);

        for (const file of clientFiles) {
            const result = checkFileForSecrets(file);
            if (result.found) {
                hasSecrets = true;
                exposedFiles.push({
                    file: file.replace(projectRoot, ''),
                    matches: result.matches,
                });
            }
        }
    }

    if (!foundBuildDir) {
        warning('No build output found. Run `npm run build` first to verify.');
        return true; // Don't fail if no build exists
    }

    if (hasSecrets) {
        error('Found exposed secrets in build output:');
        exposedFiles.forEach(({ file, matches }) => {
            error(`  ${file}`);
            matches.forEach(match => {
                error(`    - ${match.substring(0, 50)}...`);
            });
        });
        return false;
    }

    success('No secrets found in build output');
    return true;
}

/**
 * Check environment variable documentation
 */
function checkDocumentation(): boolean {
    const docsPath = join(projectRoot, 'docs', 'environment-variables.md');
    
    if (!existsSync(docsPath)) {
        warning('Environment variables documentation not found at docs/environment-variables.md');
        return false;
    }

    const content = readFileSync(docsPath, 'utf-8');
    
    // Check for security warnings
    const hasWarning = content.toLowerCase().includes('never commit') || 
                      content.toLowerCase().includes('security warning');
    
    if (!hasWarning) {
        warning('Documentation should include security warnings about committing secrets');
        return false;
    }

    success('Environment variables are properly documented with security warnings');
    return true;
}

/**
 * Main verification function
 */
async function main() {
    console.log('\n' + '='.repeat(60));
    log('Environment Variable Security Verification', 'blue');
    log('Validates: Requirements 4.3, 4.5', 'blue');
    log('Example 7: Environment Variable Security', 'blue');
    console.log('='.repeat(60) + '\n');

    const checks = [
        { name: 'Check .gitignore', fn: checkGitignore },
        { name: 'Check .env.example', fn: checkEnvExample },
        { name: 'Check documentation', fn: checkDocumentation },
        { name: 'Check build output', fn: checkBuildOutput },
    ];

    let allPassed = true;

    for (const check of checks) {
        info(`\n${check.name}...`);
        const passed = check.fn();
        if (!passed) {
            allPassed = false;
        }
    }

    console.log('\n' + '='.repeat(60));
    if (allPassed) {
        success('✅ All security checks passed!');
        log('Environment variables are properly secured.', 'green');
        console.log('='.repeat(60) + '\n');
        process.exit(0);
    } else {
        error('❌ Some security checks failed!');
        log('Please review the errors above and fix them.', 'red');
        console.log('='.repeat(60) + '\n');
        process.exit(1);
    }
}

// Run the verification
main().catch(err => {
    error(`Verification failed with error: ${err.message}`);
    process.exit(1);
});
