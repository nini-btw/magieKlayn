/**
 * Database connection test script
 * @usage: npm run db:test
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const databaseUrl = process.env.DATABASE_URL!;

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║     🔌 Supabase Database Connection Test               ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// Check environment variables
console.log('📋 Checking environment variables...');
const checks = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', value: supabaseUrl },
  { name: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', value: supabaseKey },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', value: supabaseServiceKey },
  { name: 'DATABASE_URL', value: databaseUrl },
];

let allPresent = true;
for (const check of checks) {
  const isPresent = !!check.value && !check.value.includes('[') && !check.value.includes('mock');
  console.log(`   ${isPresent ? '✅' : '❌'} ${check.name}: ${isPresent ? 'Set' : 'Missing or invalid'}`);
  if (!isPresent) allPresent = false;
}

if (!allPresent) {
  console.error('\n❌ Some environment variables are missing!');
  console.log('   Make sure your .env.local file is properly configured.\n');
  process.exit(1);
}

console.log('\n🔌 Testing connections...\n');

// Test 1: Supabase REST API (Anonymous Key)
async function testSupabaseRestAPI() {
  console.log('1️⃣ Testing Supabase REST API (Anonymous Key)...');
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('products').select('count');
    
    if (error) {
      if (error.message.includes('relation') || error.code === '42P01') {
        console.log('   ⚠️  Connected, but tables do not exist yet');
        console.log('   💡 Run: npm run db:migrate\n');
        return true;
      }
      throw error;
    }
    
    console.log('   ✅ Supabase REST API connection successful!\n');
    return true;
  } catch (error: any) {
    console.error('   ❌ Failed:', error.message || error);
    return false;
  }
}

// Test 2: Supabase REST API (Service Role Key)
async function testSupabaseServiceRole() {
  console.log('2️⃣ Testing Supabase REST API (Service Role Key)...');
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await supabase.from('products').select('count');
    
    if (error) {
      if (error.message.includes('relation') || error.code === '42P01') {
        console.log('   ⚠️  Connected, but tables do not exist yet');
        console.log('   💡 Run: npm run db:migrate\n');
        return true;
      }
      throw error;
    }
    
    console.log('   ✅ Service Role Key connection successful!\n');
    return true;
  } catch (error: any) {
    console.error('   ❌ Failed:', error.message || error);
    return false;
  }
}

// Test 3: Direct Postgres Connection (for Drizzle)
async function testPostgresConnection() {
  console.log('3️⃣ Testing Direct Postgres Connection (Drizzle)...');
  try {
    const sql = postgres(databaseUrl, { prepare: false });
    const result = await sql`SELECT NOW() as current_time, current_database() as database`;
    await sql.end();
    
    console.log('   ✅ Postgres connection successful!');
    console.log(`   📅 Server Time: ${result[0].current_time}`);
    console.log(`   🗄️  Database: ${result[0].database}\n`);
    return true;
  } catch (error: any) {
    console.error('   ❌ Failed:', error.message || error);
    console.log('   💡 Check your DATABASE_URL password\n');
    return false;
  }
}

// Test 4: List tables if they exist
async function listTables() {
  console.log('4️⃣ Checking database schema...');
  try {
    const sql = postgres(databaseUrl, { prepare: false });
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    await sql.end();
    
    if (tables.length === 0) {
      console.log('   ⚠️  No tables found in database');
      console.log('   💡 Run: npm run db:migrate\n');
      return false;
    }
    
    console.log(`   ✅ Found ${tables.length} tables:`);
    for (const table of tables) {
      console.log(`      • ${table.table_name}`);
    }
    console.log('');
    return true;
  } catch (error: any) {
    console.error('   ❌ Failed to list tables:', error.message || error);
    return false;
  }
}

async function main() {
  const results = {
    restAPI: await testSupabaseRestAPI(),
    serviceRole: await testSupabaseServiceRole(),
    postgres: await testPostgresConnection(),
    tables: await listTables(),
  };
  
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                   Test Results                         ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  Supabase REST API (Anon):    ${results.restAPI ? '✅ PASS' : '❌ FAIL'}     ║`);
  console.log(`║  Supabase REST API (Service): ${results.serviceRole ? '✅ PASS' : '❌ FAIL'}     ║`);
  console.log(`║  Direct Postgres (Drizzle):   ${results.postgres ? '✅ PASS' : '❌ FAIL'}     ║`);
  console.log(`║  Database Tables:             ${results.tables ? '✅ Found' : '⚠️  None'}     ║`);
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  if (results.restAPI && results.serviceRole && results.postgres) {
    console.log('✅ All connection tests passed!\n');
    
    if (!results.tables) {
      console.log('💡 Next step: Create tables with Drizzle');
      console.log('   npm run db:migrate\n');
    } else {
      console.log('💡 Ready to seed data:');
      console.log('   npm run db:seed\n');
    }
    
    process.exit(0);
  } else {
    console.error('❌ Some connection tests failed.\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
