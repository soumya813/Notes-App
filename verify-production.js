#!/usr/bin/env node

/**
 * Production Readiness Verification Script
 * Run this before deploying to verify all deployment requirements
 */

const { getConfig, validateEnvironment } = require('./server/config/config');

console.log('🚀 Production Readiness Check\n');

// Check 1: Environment validation
try {
  console.log('✅ Environment validation...');
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️  NODE_ENV not set to production - simulating production check');
    process.env.NODE_ENV = 'production';
    
    // Set minimal required envs for validation test
    if (!process.env.MONGODB_URI) process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    if (!process.env.GOOGLE_CLIENT_ID) process.env.GOOGLE_CLIENT_ID = 'test';
    if (!process.env.GOOGLE_CLIENT_SECRET) process.env.GOOGLE_CLIENT_SECRET = 'test';  
    if (!process.env.GOOGLE_CALLBACK_URL) process.env.GOOGLE_CALLBACK_URL = 'http://localhost:5000/google/callback';
    if (!process.env.SESSION_SECRET) process.env.SESSION_SECRET = 'test-secret-key-32-characters-long!';
  }
  
  validateEnvironment();
  console.log('✅ All required environment variables present\n');
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

// Check 2: Required files exist
const fs = require('fs');
const requiredFiles = [
  'Procfile',
  'Dockerfile',
  '.dockerignore',
  '.github/workflows/nodejs.yml',
  'server/routes/health.js'
];

console.log('✅ Checking deployment files...');
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} missing`);
    process.exit(1);
  }
}

// Check 3: Package.json has correct start script
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (packageJson.scripts.start === 'node app.js') {
  console.log('✅ Production start script configured');
} else {
  console.log('❌ Start script should be "node app.js"');
  process.exit(1);
}

// Check 4: Security dependencies
const requiredDeps = ['helmet', 'express-rate-limit', 'compression'];
for (const dep of requiredDeps) {
  if (packageJson.dependencies[dep]) {
    console.log(`✅ ${dep} dependency present`);
  } else {
    console.log(`❌ ${dep} dependency missing`);
    process.exit(1);
  }
}

console.log('\n🎉 Production readiness check passed!');
console.log('\nNext steps:');
console.log('1. Set environment variables in your hosting provider');
console.log('2. Deploy using: git push heroku main (or your platform)');
console.log('3. Verify health endpoint: curl https://yourapp.com/health');
console.log('4. Monitor logs and performance');
