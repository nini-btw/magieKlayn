/**
 * Fix Supabase Auth user
 * Deletes and recreates the admin user with correct credentials
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminEmail = 'admin@crumbleivable.com';

async function fixAuth() {
  console.log('🔧 Fixing Supabase Auth user...\n');

  const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 1. List users
  console.log('1️⃣ Listing users...');
  const { data: users, error: listError } = await adminClient.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Failed to list users:', listError.message);
    return;
  }

  console.log(`   Found ${users.users.length} users`);
  
  const existingUser = users.users.find(u => u.email === adminEmail);
  
  if (existingUser) {
    console.log(`   Found existing user: ${existingUser.id}`);
    
    // 2. Delete existing user
    console.log('2️⃣ Deleting existing user...');
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(existingUser.id);
    
    if (deleteError) {
      console.error('❌ Failed to delete user:', deleteError.message);
      return;
    }
    console.log('   ✅ User deleted');
  }

  // 3. Create new user with confirmed email
  console.log('3️⃣ Creating new user...');
  const supabasePassword = `admin_${adminEmail}_secret_${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) || 'key'}`;
  
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email: adminEmail,
    password: supabasePassword,
    email_confirm: true,
    user_metadata: { role: 'admin' },
  });

  if (createError) {
    console.error('❌ Failed to create user:', createError.message);
    return;
  }

  console.log('   ✅ User created:', newUser.user?.id);
  console.log('\n🎉 Auth user fixed!');
  console.log('\nYou can now login with:');
  console.log('  Email:', adminEmail);
  console.log('  Password: admin123');
}

fixAuth().catch(console.error);
