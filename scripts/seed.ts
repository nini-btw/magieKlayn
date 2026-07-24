/**
 * Database seed script for Supabase
 * @usage: npm run db:seed
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Make sure you have:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test data
const cookies = [
  {
    name: 'Classic Chocolate Chip',
    slug: 'classic-chocolate-chip',
    description: 'Our signature cookie loaded with Belgian chocolate chunks and a sprinkle of sea salt. Crispy edges, chewy center.',
    price: 150,
    is_active: true,
    type: 'cookie',
    images: ['/images/chocoShips.png'],
    flavour: 'Chocolate Chip',
    allergens: ['gluten', 'dairy', 'eggs'],
    is_new: false,
    is_sold_out: false,
  },
  {
    name: 'Double Chocolate Fudge',
    slug: 'double-chocolate',
    description: 'Rich cocoa dough packed with dark chocolate chips and fudge chunks. For the true chocolate lover.',
    price: 170,
    is_active: true,
    type: 'cookie',
    images: ['/images/mm.png'],
    flavour: 'Double Chocolate',
    allergens: ['gluten', 'dairy', 'eggs'],
    is_new: true,
    is_sold_out: false,
  },
  {
    name: 'White Chocolate Macadamia',
    slug: 'white-chocolate-macadamia',
    description: 'Creamy white chocolate chunks paired with roasted macadamia nuts. A classic combination.',
    price: 180,
    is_active: true,
    type: 'cookie',
    images: ['/images/pistash.png'],
    flavour: 'White Chocolate Macadamia',
    allergens: ['gluten', 'dairy', 'eggs', 'nuts'],
    is_new: false,
    is_sold_out: false,
  },
  {
    name: 'Red Velvet Cheesecake',
    slug: 'red-velvet',
    description: 'Classic red velvet cookie with cream cheese chips. A slice of cake in cookie form.',
    price: 170,
    is_active: true,
    type: 'cookie',
    images: ['/images/viola.png'],
    flavour: 'Red Velvet',
    allergens: ['gluten', 'dairy', 'eggs'],
    is_new: true,
    is_sold_out: false,
  },
  {
    name: 'Peanut Butter Chocolate',
    slug: 'peanut-butter',
    description: "Creamy peanut butter cookie with chocolate drizzle and Reese's pieces.",
    price: 160,
    is_active: true,
    type: 'cookie',
    images: ['/images/peanut.png'],
    flavour: 'Peanut Butter',
    allergens: ['gluten', 'dairy', 'eggs', 'peanuts'],
    is_new: false,
    is_sold_out: true,
  },
  {
    name: 'Oatmeal Raisin Spice',
    slug: 'oatmeal-raisin',
    description: 'Chewy oatmeal cookie with plump raisins, cinnamon, and a hint of nutmeg.',
    price: 150,
    is_active: true,
    type: 'cookie',
    images: ['/images/ben10.png'],
    flavour: 'Oatmeal Raisin',
    allergens: ['gluten', 'dairy', 'eggs'],
    is_new: false,
    is_sold_out: false,
  },
  {
    name: 'Salted Caramel',
    slug: 'salted-caramel',
    description: 'Buttery cookie with caramel chunks and flaky sea salt. Sweet and salty perfection.',
    price: 170,
    is_active: true,
    type: 'cookie',
    images: ['/images/lotus.png'],
    flavour: 'Salted Caramel',
    allergens: ['gluten', 'dairy', 'eggs'],
    is_new: false,
    is_sold_out: false,
  },
  {
    name: 'Funfetti Birthday Cake',
    slug: 'funfetti',
    description: 'Colorful funfetti cookie with vanilla frosting swirl. Celebrate every day!',
    price: 160,
    is_active: true,
    type: 'cookie',
    images: ['/images/strawbery.png'],
    flavour: 'Birthday Cake',
    allergens: ['gluten', 'dairy', 'eggs'],
    is_new: true,
    is_sold_out: false,
  },
];

const boxes = [
  {
    name: 'The Classics Box',
    slug: 'the-classics-box',
    description: 'A perfect selection of our all-time favorite cookies. 6 cookies including Chocolate Chip, Double Chocolate, and White Chocolate Macadamia.',
    price: 850,
    is_active: true,
    type: 'box',
    images: ['/images/box1.png'],
    included_cookies: [
      { cookie_piece_id: 'cookie-1', quantity: 2 },
      { cookie_piece_id: 'cookie-2', quantity: 2 },
      { cookie_piece_id: 'cookie-3', quantity: 2 },
    ],
  },
  {
    name: 'Chocoholic Box',
    slug: 'chocoholic-box',
    description: 'For the serious chocolate lover. 6 cookies featuring our richest chocolate flavors.',
    price: 900,
    is_active: true,
    type: 'box',
    images: ['/images/box1.png'],
    included_cookies: [
      { cookie_piece_id: 'cookie-2', quantity: 3 },
      { cookie_piece_id: 'cookie-1', quantity: 2 },
      { cookie_piece_id: 'cookie-5', quantity: 1 },
    ],
  },
  {
    name: 'Variety Pack',
    slug: 'variety-pack',
    description: "Can't decide? Get a taste of everything! 9 cookies with 3 of each flavor.",
    price: 1200,
    is_active: true,
    type: 'box',
    images: ['/images/box1.png'],
    included_cookies: [
      { cookie_piece_id: 'cookie-1', quantity: 3 },
      { cookie_piece_id: 'cookie-3', quantity: 3 },
      { cookie_piece_id: 'cookie-6', quantity: 3 },
    ],
  },
];

const voteCandidates = [
  {
    cookie_name: 'Lemon Lavender',
    description: 'Bright lemon zest with calming lavender notes. A springtime favorite.',
    image_url: '/images/vote-lemon-lavender.png',
    vote_count: 42,
    is_active: true,
  },
  {
    cookie_name: 'Salted Caramel Pretzel',
    description: 'Sweet caramel with crunchy pretzel pieces and sea salt.',
    image_url: '/images/vote-salted-caramel-pretzel.png',
    vote_count: 38,
    is_active: true,
  },
  {
    cookie_name: 'Matcha White Chocolate',
    description: 'Earthy Japanese matcha paired with sweet white chocolate chunks.',
    image_url: '/images/vote-matcha-white-chocolate.png',
    vote_count: 27,
    is_active: true,
  },
  {
    cookie_name: 'S\'mores',
    description: 'Graham cracker cookie with marshmallow and chocolate. Campfire vibes!',
    image_url: '/images/vote-smores.png',
    vote_count: 35,
    is_active: true,
  },
  {
    cookie_name: 'Pumpkin Spice',
    description: 'Fall favorite with real pumpkin, cinnamon, nutmeg, and cream cheese frosting.',
    image_url: '/images/vote-pumpkin-spice.png',
    vote_count: 29,
    is_active: true,
  },
  {
    cookie_name: 'Tiramisu',
    description: 'Coffee-flavored cookie with mascarpone chips and cocoa dusting.',
    image_url: '/images/vote-tiramisu.png',
    vote_count: 31,
    is_active: true,
  },
];

// Helper function to wait
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function testConnection() {
  console.log('🔌 Testing Supabase connection...\n');
  
  try {
    const { data, error } = await supabase.from('products').select('count');
    
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('⚠️  Tables do not exist yet. Run migrations first:');
        console.log('   npm run db:migrate\n');
        return false;
      }
      throw error;
    }
    
    console.log('✅ Supabase connection successful!\n');
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error);
    return false;
  }
}

async function clearTables() {
  console.log('🧹 Clearing existing data...');
  
  const tables = ['order_items', 'orders', 'vote_candidates', 'weekly_drops', 'products', 'admin_users'];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      console.log(`   ⚠️  Could not clear ${table}: ${error.message}`);
    } else {
      console.log(`   ✅ Cleared ${table}`);
    }
  }
  
  console.log('');
}

async function seedAdminUser() {
  console.log('👤 Creating admin user...');
  
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      email: 'admin@crumbleivable.com',
      password_hash: passwordHash,
    })
    .select();
  
  if (error) {
    console.error('   ❌ Failed to create admin:', error.message);
    return;
  }
  
  console.log('   ✅ Admin user created');
  console.log('   📧 Email: admin@crumbleivable.com');
  console.log('   🔑 Password: admin123\n');
}

async function seedProducts() {
  console.log('🍪 Seeding cookies...');
  
  for (const cookie of cookies) {
    const { error } = await supabase.from('products').insert(cookie);
    if (error) {
      console.error(`   ❌ Failed to insert ${cookie.name}:`, error.message);
    } else {
      console.log(`   ✅ ${cookie.name}`);
    }
  }
  
  console.log('');
}

async function seedBoxes() {
  console.log('📦 Seeding boxes...');
  
  for (const box of boxes) {
    const { error } = await supabase.from('products').insert(box);
    if (error) {
      console.error(`   ❌ Failed to insert ${box.name}:`, error.message);
    } else {
      console.log(`   ✅ ${box.name}`);
    }
  }
  
  console.log('');
}

async function seedVoteCandidates() {
  console.log('🗳️  Seeding vote candidates...');
  
  for (const candidate of voteCandidates) {
    const { error } = await supabase.from('vote_candidates').insert(candidate);
    if (error) {
      console.error(`   ❌ Failed to insert ${candidate.cookie_name}:`, error.message);
    } else {
      console.log(`   ✅ ${candidate.cookie_name}`);
    }
  }
  
  console.log('');
}

async function seedOrders() {
  console.log('📋 Seeding sample orders...');
  
  // Get first cookie and box for order items
  const { data: products } = await supabase.from('products').select('id, name, type, price').limit(10);
  
  if (!products || products.length === 0) {
    console.log('   ⚠️  No products found, skipping orders\n');
    return;
  }
  
  const cookie = products.find(p => p.type === 'cookie');
  const box = products.find(p => p.type === 'box');
  
  if (!cookie) {
    console.log('   ⚠️  No cookies found, skipping orders\n');
    return;
  }
  
  const orders = [
    {
      full_name: 'Ahmed Benali',
      phone: '+213 555 123 456',
      address: '123 Rue Mohamed VI, Oran',
      cooking_note: null,
      gift_note: null,
      status: 'confirmed',
      total_amount: cookie.price * 3 + (box ? box.price : 0),
    },
    {
      full_name: 'Sarah Mansouri',
      phone: '+213 555 789 012',
      address: '45 Boulevard de la Soummam, Oran',
      cooking_note: null,
      gift_note: 'Happy Birthday! Enjoy these fresh cookies!',
      status: 'pending',
      total_amount: box ? box.price * 2 : cookie.price * 6,
    },
    {
      full_name: 'Karim Hadj',
      phone: '+213 555 456 789',
      address: '78 Rue Ibn Sina, Oran',
      cooking_note: 'Please make them extra crispy',
      gift_note: null,
      status: 'preparing',
      total_amount: cookie.price * 5,
    },
  ];
  
  for (const order of orders) {
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(order)
      .select();
    
    if (orderError || !orderData) {
      console.error(`   ❌ Failed to create order for ${order.full_name}:`, orderError?.message);
      continue;
    }
    
    // Add order items
    const orderId = orderData[0].id;
    const items = [
      {
        order_id: orderId,
        product_id: cookie.id,
        product_type: 'cookie',
        product_name: cookie.name,
        quantity: 3,
        price_snapshot: cookie.price,
      },
    ];
    
    if (box && order.full_name === 'Ahmed Benali') {
      items.push({
        order_id: orderId,
        product_id: box.id,
        product_type: 'box',
        product_name: box.name,
        quantity: 1,
        price_snapshot: box.price,
      });
    }
    
    const { error: itemsError } = await supabase.from('order_items').insert(items);
    
    if (itemsError) {
      console.error(`   ❌ Failed to create order items:`, itemsError.message);
    } else {
      console.log(`   ✅ Order from ${order.full_name}`);
    }
  }
  
  console.log('');
}

async function verifyData() {
  console.log('🔍 Verifying seeded data...\n');
  
  const tables = [
    { name: 'products', label: 'Products' },
    { name: 'orders', label: 'Orders' },
    { name: 'order_items', label: 'Order Items' },
    { name: 'vote_candidates', label: 'Vote Candidates' },
    { name: 'admin_users', label: 'Admin Users' },
  ];
  
  for (const { name, label } of tables) {
    const { count, error } = await supabase
      .from(name)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`   ❌ ${label}: Error - ${error.message}`);
    } else {
      console.log(`   ✅ ${label}: ${count} records`);
    }
  }
  
  console.log('');
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║       🍪 Crumbleivable Database Seed Script            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  // Clear existing data
  await clearTables();
  
  // Seed in order (respecting foreign key constraints)
  await seedAdminUser();
  await sleep(100);
  
  await seedProducts();
  await sleep(100);
  
  await seedBoxes();
  await sleep(100);
  
  await seedVoteCandidates();
  await sleep(100);
  
  await seedOrders();
  await sleep(100);
  
  // Verify
  await verifyData();
  
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  ✅ Database seeded successfully!                      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  console.log('📊 Summary:');
  console.log('   • 8 cookies added');
  console.log('   • 3 boxes added');
  console.log('   • 6 vote candidates added');
  console.log('   • 3 sample orders added');
  console.log('   • 1 admin user created\n');
  
  console.log('🔑 Admin Login:');
  console.log('   Email: admin@crumbleivable.com');
  console.log('   Password: admin123\n');
  
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Seed script failed:', error);
  process.exit(1);
});
