#!/usr/bin/env node

/**
 * Security Audit Script
 * 
 * Checks the codebase for common security issues
 */

import fs from 'fs';
import path from 'path';

interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line?: number;
  issue: string;
  fix: string;
}

const issues: SecurityIssue[] = [];

/**
 * Scan file for security issues
 */
function scanFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const lowerLine = line.toLowerCase();

    // Check for hardcoded secrets
    const secretPatterns = [
      /(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{8,}['"]/i,
      /(?:sk|pk)_(?:test|live)_[a-zA-Z0-9]{20,}/i,
      /ghp_[a-zA-Z0-9]{36}/i,
      /xox[bpsa]-[a-zA-Z0-9-]+/i,
    ];

    secretPatterns.forEach((pattern) => {
      if (pattern.test(line) && !line.includes('process.env') && !line.includes('example')) {
        issues.push({
          severity: 'critical',
          file: filePath,
          line: lineNum,
          issue: 'Possible hardcoded secret detected',
          fix: 'Move secret to environment variable (.env)',
        });
      }
    });

    // Check for SQL injection vulnerabilities
    if (
      (lowerLine.includes('query') || lowerLine.includes('execute')) &&
      (lowerLine.includes('${') || lowerLine.includes('+ ')) &&
      !lowerLine.includes('parameterized') &&
      !lowerLine.includes('?')
    ) {
      issues.push({
        severity: 'high',
        file: filePath,
        line: lineNum,
        issue: 'Possible SQL injection vulnerability',
        fix: 'Use parameterized queries or ORM methods',
      });
    }

    // Check for XSS vulnerabilities
    if (
      lowerLine.includes('dangerouslysetinnerhtml') ||
      lowerLine.includes('innerhtml')
    ) {
      issues.push({
        severity: 'high',
        file: filePath,
        line: lineNum,
        issue: 'Possible XSS vulnerability (dangerous HTML)',
        fix: 'Sanitize HTML content before rendering',
      });
    }

    // Check for missing input validation
    if (
      lowerLine.includes('req.body') &&
      !lowerLine.includes('validate') &&
      !lowerLine.includes('schema') &&
      !lowerLine.includes('zod')
    ) {
      issues.push({
        severity: 'medium',
        file: filePath,
        line: lineNum,
        issue: 'Request body used without validation',
        fix: 'Add input validation with Zod or similar',
      });
    }

    // Check for wildcard CORS
    if (lowerLine.includes("access-control-allow-origin") && lowerLine.includes('*')) {
      issues.push({
        severity: 'high',
        file: filePath,
        line: lineNum,
        issue: 'Wildcard CORS origin (*)',
        fix: 'Restrict CORS to specific origins',
      });
    }

    // Check for missing error handling
    if (lowerLine.includes('catch') && lowerLine.includes('console.log')) {
      issues.push({
        severity: 'low',
        file: filePath,
        line: lineNum,
        issue: 'Error logged but not handled properly',
        fix: 'Use proper error handling and logging service',
      });
    }

    // Check for eval usage
    if (lowerLine.includes('eval(') && !lowerLine.includes('// safe')) {
      issues.push({
        severity: 'critical',
        file: filePath,
        line: lineNum,
        issue: 'eval() usage detected',
        fix: 'Remove eval() - it can execute arbitrary code',
      });
    }

    // Check for missing rate limiting
    if (
      lowerLine.includes('export async function post') &&
      !lowerLine.includes('rate') &&
      !filePath.includes('mock')
    ) {
      issues.push({
        severity: 'medium',
        file: filePath,
        line: lineNum,
        issue: 'API endpoint without rate limiting',
        fix: 'Add rate limiting middleware',
      });
    }

    // Check for console.log in production code
    if (
      lowerLine.includes('console.log') &&
      !filePath.includes('test') &&
      !filePath.includes('script') &&
      !filePath.includes('seed')
    ) {
      issues.push({
        severity: 'low',
        file: filePath,
        line: lineNum,
        issue: 'console.log in production code',
        fix: 'Use proper logging service or remove',
      });
    }
  });
}

/**
 * Scan directory recursively
 */
function scanDirectory(dir: string, extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (!file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath, extensions);
      }
    } else if (extensions.some((ext) => file.endsWith(ext))) {
      scanFile(filePath);
    }
  });
}

/**
 * Run security audit
 */
function runAudit() {
  console.log('🔒 TrustLens Security Audit');
  console.log('==========================\n');

  const srcDir = path.join(__dirname, '..');
  
  console.log('Scanning source files...\n');
  scanDirectory(srcDir);

  // Print results
  const critical = issues.filter((i) => i.severity === 'critical');
  const high = issues.filter((i) => i.severity === 'high');
  const medium = issues.filter((i) => i.severity === 'medium');
  const low = issues.filter((i) => i.severity === 'low');

  console.log('\n📊 Results:');
  console.log(`  🔴 Critical: ${critical.length}`);
  console.log(`  🟠 High: ${high.length}`);
  console.log(`  🟡 Medium: ${medium.length}`);
  console.log(`  🟢 Low: ${low.length}`);
  console.log(`  Total: ${issues.length}\n`);

  if (issues.length > 0) {
    console.log('📝 Issues Found:\n');
    
    issues.forEach((issue) => {
      const icon = issue.severity === 'critical' ? '🔴' : 
                   issue.severity === 'high' ? '🟠' : 
                   issue.severity === 'medium' ? '🟡' : '🟢';
      
      console.log(`${icon} [${issue.severity.toUpperCase()}] ${issue.file}`);
      if (issue.line) console.log(`   Line: ${issue.line}`);
      console.log(`   Issue: ${issue.issue}`);
      console.log(`   Fix: ${issue.fix}\n`);
    });
  } else {
    console.log('✅ No security issues found!\n');
  }

  // Summary
  console.log('📋 Recommendations:');
  console.log('  1. Fix all critical and high issues before deployment');
  console.log('  2. Add rate limiting to all public API endpoints');
  console.log('  3. Validate all user inputs on the server side');
  console.log('  4. Use environment variables for all secrets');
  console.log('  5. Enable security headers in production');
  console.log('  6. Set up error logging (Sentry, Datadog, etc.)');
  console.log('  7. Regular security audits\n');

  return issues.length === 0;
}

// Run audit
const isSecure = runAudit();
process.exit(isSecure ? 0 : 1);
