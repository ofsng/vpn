// Load environment variables (prefer .env.production in production, else .env)
const dotenv = require('dotenv');
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');

// CORS origin list is env-controlled; allow '*' only if explicitly set
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
  : ['*'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// JSON parser (skips webhook so Stripe can read raw body)
const jsonParser = express.json();
app.use((req, res, next) => {
  if (req.path === '/api/webhook') {
    return next();
  }
  return jsonParser(req, res, next);
});

app.use(express.static('public'));

// Admin credentials
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').trim();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'Password_2025!').trim();
// Optional hashed password support
const ADMIN_PASSWORD_HASH = (process.env.ADMIN_PASSWORD_HASH || '').trim();

// Debug env (no secrets)
console.log('Admin env loaded', {
  userSet: !!process.env.ADMIN_USERNAME,
  userLen: ADMIN_USERNAME.length,
  passSet: !!process.env.ADMIN_PASSWORD,
  passLen: ADMIN_PASSWORD.length
});
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Simple admin auth middleware
const requireAdminAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// Stripe setup - only if API key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_mock_key_for_development') {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}
const stripeRawBody = express.raw({ type: 'application/json' });

// Supabase setup
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  );
  console.log('✅ Supabase connected successfully');
} else {
  console.warn('⚠️  Supabase credentials not found, using in-memory data');
}

// In-memory database for Vercel serverless
let licenses = [
  {
    id: '1',
    key: 'DEMO-1234-5678-9ABC',
    email: 'demo@viralvpn.net',
    status: 'active',
    expiryDate: '2025-12-31T23:59:59.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    plan: 'monthly',
    price: 9.99
  },
  {
    id: '2',
    key: 'TEST-ABCD-EFGH-IJKL',
    email: 'test@viralvpn.net',
    status: 'active',
    expiryDate: '2025-08-31T23:59:59.000Z',
    createdAt: '2024-07-01T00:00:00.000Z',
    plan: 'monthly',
    price: 9.99
  },
  {
    id: '3',
    key: 'TEST-1234-ABCD-5678',
    email: 'demo+2@viralvpn.net',
    status: 'active',
    expiryDate: '2025-12-31T23:59:59.000Z',
    createdAt: '2024-09-01T00:00:00.000Z',
    plan: 'monthly',
    price: 9.99
  }
];

let users = [
  {
    id: '1',
    email: 'demo@viralvpn.net',
    name: 'Demo User',
    licenseKey: 'DEMO-1234-5678-9ABC',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    email: 'test@viralvpn.net', 
    name: 'Test User',
    licenseKey: 'TEST-ABCD-EFGH-IJKL',
    status: 'active',
    createdAt: '2024-07-01T00:00:00.000Z'
  }
];

// Generate a random license key
function generateLicenseKey() {
  const segments = [
    Math.random().toString(36).substring(2, 6),
    Math.random().toString(36).substring(2, 6),
    Math.random().toString(36).substring(2, 6),
    Math.random().toString(36).substring(2, 6)
  ];
  return segments.join('-').toUpperCase();
}

// Mock VPN servers
const VPN_SERVERS = [
  {
    id: '1',
    name: 'US East',
    country: 'United States',
    city: 'New York',
    ip: 'us-east.example.com',
    port: 8388,
    status: 'online',
    speed: 'high',
    users: 15,
    maxUsers: 100,
    bandwidth: 1024 * 1024 * 1024, // 1 GB
    isActive: true,
    accessKey: 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@us-east.example.com:8388/?outline=1'
  },
  {
    id: '2',
    name: 'Frankfurt',
    country: 'Germany',
    city: 'Frankfurt',
    ip: 'de-frankfurt.example.com',
    port: 8388,
    status: 'online',
    speed: 'high',
    users: 8,
    maxUsers: 100,
    bandwidth: 1024 * 1024 * 1024, // 1 GB
    isActive: true,
    accessKey: 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@de-frankfurt.example.com:8388/?outline=1'
  },
  {
    id: '3',
    name: 'Tokyo',
    country: 'Japan',
    city: 'Tokyo',
    ip: 'jp-tokyo.example.com',
    port: 8388,
    status: 'online',
    speed: 'medium',
    users: 12,
    maxUsers: 100,
    bandwidth: 1024 * 1024 * 1024, // 1 GB
    isActive: true,
    accessKey: 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@jp-tokyo.example.com:8388/?outline=1'
  }
];

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbInfo = {};
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('count')
        .limit(1);
      
      if (!error) {
        dbStatus = 'connected';
        
        // Get counts from database
        const { data: licenseCount } = await supabase
          .from('licenses')
          .select('id', { count: 'exact' });
        
        const { data: userCount } = await supabase
          .from('users')
          .select('id', { count: 'exact' });
          
        dbInfo = {
          type: 'Supabase',
          licenses: licenseCount?.length || 0,
          users: userCount?.length || 0
        };
      }
    } catch (error) {
      console.error('Database health check failed:', error);
      dbStatus = 'error';
      dbInfo = { error: error.message };
    }
  } else {
    dbInfo = {
      type: 'In-Memory',
      licenses: licenses.length,
      users: users.length
    };
  }
  
  res.json({ 
    status: 'ok', 
    message: 'ViralVPN API is running',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      ...dbInfo
    }
  });
});

// Validate license endpoint
app.post('/api/validate-license', async (req, res) => {
  try {
    const { licenseKey } = req.body;
    
    let license;
    
    if (supabase) {
      // Use Supabase database
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('key', licenseKey)
        .eq('status', 'active')
        .single();
      
      if (error || !data) {
        return res.status(404).json({
          status: 'invalid',
          message: 'License key not found'
        });
      }
      
      license = data;
    } else {
      // Fallback to in-memory data
      license = licenses.find(l => l.key === licenseKey);
      
      if (!license) {
        return res.status(404).json({
          status: 'invalid',
          message: 'License key not found'
        });
      }
    }

    // Check if license is expired
    const expiryDate = new Date(license.expiry_date || license.expiryDate);
    const now = new Date();
    const remainingDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    if (remainingDays <= 0) {
      return res.json({
        status: 'expired',
        message: 'License has expired',
        remainingDays: 0
      });
    }

    res.json({
      status: 'valid',
      user: license.email,
      remainingDays,
      servers: VPN_SERVERS
    });
  } catch (error) {
    console.error('License validation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Create Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(501).json({
        status: 'error',
        message: 'Stripe integration is not enabled.'
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'VPN License - 1 Month',
              description: 'Access to all VPN servers for 1 month'
            },
            unit_amount: 999 // $9.99
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create checkout session'
    });
  }
});

// Stripe webhook handler
app.post('/api/webhook', stripeRawBody, async (req, res) => {
  if (!stripe) {
    return res.status(501).send('Stripe webhook handler is not enabled.');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Generate new license
    const licenseKey = generateLicenseKey();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    const newLicense = {
      id: uuidv4(),
      key: licenseKey,
      email: session.customer_details.email,
      createdAt: new Date().toISOString(),
      expiryDate: expiryDate.toISOString(),
      stripeSessionId: session.id
    };

    // Save to database
    if (supabase) {
      try {
        await supabase.from('licenses').insert([{
          id: newLicense.id,
          key: newLicense.key,
          email: newLicense.email,
          created_at: newLicense.createdAt,
          expiry_date: newLicense.expiryDate,
          status: 'active',
          plan: 'monthly',
          stripe_session_id: newLicense.stripeSessionId
        }]);
      } catch (dbError) {
        console.error('Stripe webhook Supabase insert error:', dbError);
      }
    } else {
      licenses.push(newLicense);
    }

    // Update Stripe metadata with license key
    await stripe.checkout.sessions.update(session.id, {
      metadata: { licenseKey }
    });
  }

  res.json({ received: true });
});

// Admin API endpoints
app.get('/api/servers', requireAdminAuth, async (req, res) => {
  try {
    res.json(VPN_SERVERS);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

app.post('/api/servers', requireAdminAuth, async (req, res) => {
  try {
    const newServer = {
      id: Date.now().toString(),
      ...req.body,
      status: 'online',
      users: 0,
      bandwidth: 0,
    };
    VPN_SERVERS.push(newServer);
    res.json(newServer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create server' });
  }
});

app.put('/api/servers/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const serverIndex = VPN_SERVERS.findIndex(s => s.id === id);
    if (serverIndex === -1) {
      return res.status(404).json({ error: 'Server not found' });
    }
    VPN_SERVERS[serverIndex] = { ...VPN_SERVERS[serverIndex], ...req.body };
    res.json(VPN_SERVERS[serverIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update server' });
  }
});

app.delete('/api/servers/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const serverIndex = VPN_SERVERS.findIndex(s => s.id === id);
    if (serverIndex === -1) {
      return res.status(404).json({ error: 'Server not found' });
    }
    VPN_SERVERS.splice(serverIndex, 1);
    res.json({ message: 'Server deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete server' });
  }
});

app.get('/api/licenses', requireAdminAuth, async (req, res) => {
  try {
    if (supabase) {
      console.log('📊 Supabase\'den lisanslar getiriliyor...');
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Supabase fetch hatası:', error);
        throw error;
      }
      
      console.log('✅ Supabase\'den lisanslar getirildi:', data.length + ' adet');
      // Her lisansın alanını kontrol et
      data.forEach((license, index) => {
        console.log(`📋 Lisans ${index + 1}:`, {
          id: license.id,
          key: license.key,
          email: license.email,
          plan: license.plan,
          status: license.status,
          hasExpiryDate: !!license.expiry_date,
          hasCreatedAt: !!license.created_at
        });
      });
      res.json(data);
    } else {
      console.log('📊 In-memory lisanslar getiriliyor:', licenses.length + ' adet');
      // In-memory lisansların alanını kontrol et
      licenses.forEach((license, index) => {
        console.log(`📋 In-memory Lisans ${index + 1}:`, {
          id: license.id,
          key: license.key,
          email: license.email,
          plan: license.plan,
          status: license.status,
          hasExpiryDate: !!license.expiryDate,
          hasCreatedAt: !!license.createdAt
        });
      });
      res.json(licenses);
    }
  } catch (error) {
    console.error('Fetch licenses error:', error);
    res.status(500).json({ error: 'Failed to fetch licenses', details: error.message });
  }
});

app.post('/api/licenses', requireAdminAuth, async (req, res) => {
  try {
    const { email, expiryDate, plan, purchaseRequestId } = req.body;
    const licenseKey = generateLicenseKey();
    
    const newLicense = {
      id: uuidv4(),
      key: licenseKey,
      email,
      created_at: new Date().toISOString(),
      expiry_date: expiryDate,
      status: 'active',
      plan: plan || 'monthly'
    };

    if (supabase) {
      console.log('📦 Supabase\'e lisans ekleniyor:', newLicense);
      const { data, error } = await supabase
        .from('licenses')
        .insert([newLicense])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Supabase insert hatası:', error);
        throw error;
      }
      
      console.log('✅ Supabase\'e lisans eklendi:', data);
      
      // Eğer bir satın alma talebinden geliyorsa, o talebi "completed" olarak işaretle
      if (purchaseRequestId) {
        console.log('🔄 Satın alma talebi tamamlandı olarak işaretleniyor:', purchaseRequestId);
        const { data: updatedRequest, error: updateError } = await supabase
          .from('purchase_requests')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString(),
            admin_notes: `Lisans oluşturuldu: ${licenseKey}`
          })
          .eq('id', purchaseRequestId)
          .select()
          .single();
        
        if (updateError) {
          console.warn('⚠️ Satın alma talebi güncelleme hatası:', updateError);
        } else {
          console.log('✅ Satın alma talebi tamamlandı:', updatedRequest);
        }
      }
      
      res.json(data);
    } else {
      // Fallback to in-memory
      const fallbackLicense = {
        ...newLicense,
        createdAt: newLicense.created_at,
        expiryDate: newLicense.expiry_date
      };
      licenses.push(fallbackLicense);
      
      // In-memory purchase request update
      if (purchaseRequestId && global.purchaseRequests) {
        const requestIndex = global.purchaseRequests.findIndex(r => r.id === purchaseRequestId);
        if (requestIndex !== -1) {
          global.purchaseRequests[requestIndex].status = 'completed';
          global.purchaseRequests[requestIndex].processed_at = new Date().toISOString();
          global.purchaseRequests[requestIndex].admin_notes = `Lisans oluşturuldu: ${licenseKey}`;
          console.log('✅ In-memory satın alma talebi tamamlandı');
        }
      }
      
      console.log('✅ In-memory lisans eklendi:', fallbackLicense);
      res.json(fallbackLicense);
    }
  } catch (error) {
    console.error('Create license error:', error);
    res.status(500).json({ error: 'Failed to create license', details: error.message });
  }
});

app.put('/api/licenses/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (supabase) {
      console.log('🔄 Supabase\'de lisans güncelleniyor:', id);
      const { data, error } = await supabase
        .from('licenses')
        .update(req.body)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Supabase update hatası:', error);
        return res.status(404).json({ error: 'License not found', details: error.message });
      }
      
      console.log('✅ Supabase\'de lisans güncellendi:', data);
      res.json(data);
    } else {
      // Fallback to in-memory
      const licenseIndex = licenses.findIndex(l => l.id === id);
      
      if (licenseIndex === -1) {
        return res.status(404).json({ error: 'License not found' });
      }
      
      licenses[licenseIndex] = { ...licenses[licenseIndex], ...req.body };
      console.log('✅ In-memory lisans güncellendi:', licenses[licenseIndex]);
      res.json(licenses[licenseIndex]);
    }
  } catch (error) {
    console.error('Update license error:', error);
    res.status(500).json({ error: 'Failed to update license', details: error.message });
  }
});

app.delete('/api/licenses/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Lisans silme isteği:', { id, supabaseActive: !!supabase });
    
    if (supabase) {
      // Önce lisansın var olup olmadığını kontrol et
      const { data: existingLicense, error: fetchError } = await supabase
        .from('licenses')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError || !existingLicense) {
        console.log('❌ Lisans bulunamadı (Supabase):', fetchError);
        return res.status(404).json({ error: 'License not found', details: fetchError?.message });
      }
      
      console.log('📋 Silinecek lisans:', existingLicense);
      
      const { data, error } = await supabase
        .from('licenses')
        .delete()
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('❌ Supabase silme hatası:', error);
        return res.status(500).json({ error: 'Failed to delete license', details: error.message });
      }
      
      console.log('✅ Supabase lisans silindi:', data);
      
      // Silinen lisansla ilişkili kullanıcıları da temizle
      if (data[0] && data[0].key) {
        try {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .delete()
            .eq('license_key', data[0].key);
          
          if (usersError) {
            console.warn('⚠️ Kullanıcı temizleme hatası:', usersError);
          } else {
            console.log('🗑️ İlişkili kullanıcılar temizlendi:', usersData?.length || 0);
          }
        } catch (userCleanupError) {
          console.warn('⚠️ Kullanıcı temizleme hatası:', userCleanupError);
        }
      }
      
      res.json({ 
        message: 'License deleted successfully', 
        deletedLicense: data[0],
        cleanedUsers: true
      });
    } else {
      // Fallback to in-memory
      console.log('🔍 In-memory lisanslar:', licenses.map(l => ({ id: l.id, key: l.key })));
      
      const licenseIndex = licenses.findIndex(l => l.id === id);
      
      if (licenseIndex === -1) {
        console.log('❌ In-memory lisans bulunamadı');
        return res.status(404).json({ error: 'License not found' });
      }
      
      const deletedLicense = licenses[licenseIndex];
      licenses.splice(licenseIndex, 1);
      
      // Silinen lisansla ilişkili kullanıcıları da temizle
      const initialUserCount = users.length;
      users = users.filter(user => user.licenseKey !== deletedLicense.key);
      const cleanedUserCount = initialUserCount - users.length;
      
      console.log('✅ In-memory lisans silindi:', deletedLicense);
      console.log('🗑️ İlişkili kullanıcılar temizlendi:', cleanedUserCount);
      
      res.json({ 
        message: 'License deleted successfully', 
        deletedLicense,
        cleanedUsers: cleanedUserCount
      });
    }
  } catch (error) {
    console.error('💥 Lisans silme genel hatası:', error);
    res.status(500).json({ error: 'Failed to delete license', details: error.message });
  }
});

app.get('/api/users', requireAdminAuth, async (req, res) => {
  try {
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', requireAdminAuth, async (req, res) => {
  try {
    const newUser = {
      id: uuidv4(), // Use uuidv4 for new users
      ...req.body,
      lastLogin: new Date().toISOString(),
      totalUsage: 0,
      status: 'active'
    };
    users.push(newUser);
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    users[userIndex] = { ...users[userIndex], ...req.body };
    
    res.json(users[userIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    users.splice(userIndex, 1);
    
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.get('/api/settings', requireAdminAuth, async (req, res) => {
  try {
    const settings = {
      appName: 'viralvpn',
      version: '1.0.0',
      maintenanceMode: false,
      maxConnectionsPerUser: 1,
      defaultLicenseDuration: 30, // days
      stripeEnabled: true,
      outlineApiEnabled: true
    };
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', requireAdminAuth, async (req, res) => {
  try {
    // Mock update - gerçek uygulamada ayarlar dosyasında güncellenecek
    res.json({ message: 'Settings updated', ...req.body });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { username = '', password = '' } = req.body || {};
  const inputUser = username.trim();
  const inputPass = password.trim();

  const inputPassHash = crypto.createHash('sha256').update(inputPass).digest('hex');
  const envPassHash = ADMIN_PASSWORD_HASH || crypto.createHash('sha256').update(ADMIN_PASSWORD).digest('hex');

  const passMatch = inputPassHash === envPassHash;
  const userMatch = inputUser === ADMIN_USERNAME;

  // Safe debug log (password not logged)
  console.log('Admin login attempt', {
    envUser: ADMIN_USERNAME ? 'set' : 'missing',
    envUserLen: ADMIN_USERNAME.length,
    inputUser,
    userMatch,
    passSet: !!process.env.ADMIN_PASSWORD,
    passLen: ADMIN_PASSWORD.length,
    passMatch,
    inputPassLen: inputPass.length,
    envPassLen: ADMIN_PASSWORD.length,
    inputPassHash: inputPassHash.slice(0, 8),
    envPassHash: envPassHash.slice(0, 8)
  });

  // Additional debug to detect trailing/leading whitespace issues
  console.log('Admin login hash compare', {
    inputHash: inputPassHash,
    envHash: envPassHash,
    inputLen: inputPass.length,
    envLen: ADMIN_PASSWORD.length,
    userMatch,
    passMatch,
    hashFromEnvPassword: !ADMIN_PASSWORD_HASH
  });

  if (userMatch && passMatch) {
    const token = jwt.sign({ username: inputUser }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token });
  }

  return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
});

app.post('/api/admin/verify', requireAdminAuth, (req, res) => {
  res.json({ valid: true, user: req.admin });
});

// Purchase request endpoint - Email toplama ve database'e kaydetme
app.post('/api/purchase-request', async (req, res) => {
  console.log('📥 POST /api/purchase-request - İstek alındı');
  console.log('📄 Headers:', req.headers);
  console.log('📋 Body:', req.body);
  
  try {
    const { email, plan } = req.body;
    
    console.log('📝 Satın alma talebi alındı:', { email, plan });
    
    // Validation
    if (!email || !plan) {
      return res.status(400).json({ 
        error: 'Email ve plan bilgisi gerekli',
        message: 'Email adresi ve plan seçimi zorunludur'
      });
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ 
        error: 'Geçersiz email formatı',
        message: 'Lütfen geçerli bir email adresi girin'
      });
    }
    
    if (!['monthly', 'yearly'].includes(plan)) {
      return res.status(400).json({ 
        error: 'Geçersiz plan',
        message: 'Sadece monthly veya yearly plan seçilebilir'
      });
    }

    const purchaseRequest = {
      id: uuidv4(),
      email: email.toLowerCase().trim(),
      plan: plan,
      status: 'pending',
      created_at: new Date().toISOString(),
      price: plan === 'yearly' ? 59.99 : 9.99
    };

    if (supabase) {
      // Supabase'e kaydet
      const { data, error } = await supabase
        .from('purchase_requests')
        .insert(purchaseRequest)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Supabase satın alma talebi kaydetme hatası:', error);
        return res.status(500).json({ 
          error: 'Veritabanı hatası',
          message: 'Talebiniz kaydedilemedi, lütfen tekrar deneyin'
        });
      }
      
      console.log('✅ Supabase satın alma talebi kaydedildi:', data);
      
      res.json({
        success: true,
        message: 'Satın alma talebi başarıyla kaydedildi',
        requestId: data.id,
        email: data.email,
        plan: data.plan,
        // Demo için Stripe URL eklemiyoruz
        // stripeUrl: 'https://checkout.stripe.com/demo'
      });
    } else {
      // In-memory storage (demo için)
      console.log('📋 In-memory satın alma talebi kaydediliyor:', purchaseRequest);
      
      // Basit in-memory array (gerçek projede Supabase kullanılacak)
      if (!global.purchaseRequests) {
        global.purchaseRequests = [];
      }
      global.purchaseRequests.push(purchaseRequest);
      
      console.log('✅ In-memory satın alma talebi kaydedildi');
      
      res.json({
        success: true,
        message: 'Satın alma talebi başarıyla kaydedildi',
        requestId: purchaseRequest.id,
        email: purchaseRequest.email,
        plan: purchaseRequest.plan
      });
    }
  } catch (error) {
    console.error('💥 Satın alma talebi hatası:', error);
    res.status(500).json({ 
      error: 'Sunucu hatası',
      message: 'Bir hata oluştu, lütfen tekrar deneyin'
    });
  }
});

// Purchase requests listesini getir (admin için)
app.get('/api/purchase-requests', requireAdminAuth, async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('purchase_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Supabase satın alma talepleri getirme hatası:', error);
        return res.status(500).json({ error: 'Failed to fetch purchase requests' });
      }
      
      console.log('📋 Supabase satın alma talepleri getiriliyor:', data?.length || 0, 'adet');
      res.json(data || []);
    } else {
      // In-memory fallback
      const requests = global.purchaseRequests || [];
      console.log('📋 In-memory satın alma talepleri:', requests.length, 'adet');
      res.json(requests);
    }
  } catch (error) {
    console.error('💥 Satın alma talepleri getirme hatası:', error);
    res.status(500).json({ error: 'Failed to fetch purchase requests' });
  }
});

// Delete purchase request endpoint
app.delete('/api/purchase-requests/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Satın alma talebi silme isteği:', { id, supabaseActive: !!supabase });
    
    if (supabase) {
      // Önce talebin var olup olmadığını kontrol et
      const { data: existingRequest, error: fetchError } = await supabase
        .from('purchase_requests')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError || !existingRequest) {
        console.log('❌ Satın alma talebi bulunamadı (Supabase):', fetchError);
        return res.status(404).json({ error: 'Purchase request not found', details: fetchError?.message });
      }
      
      console.log('📋 Silinecek satın alma talebi:', existingRequest);
      
      const { data, error } = await supabase
        .from('purchase_requests')
        .delete()
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('❌ Supabase satın alma talebi silme hatası:', error);
        return res.status(500).json({ error: 'Failed to delete purchase request', details: error.message });
      }
      
      console.log('✅ Supabase satın alma talebi silindi:', data);
      
      res.json({ 
        message: 'Purchase request deleted successfully', 
        deletedRequest: data[0]
      });
    } else {
      // Fallback to in-memory
      if (!global.purchaseRequests) {
        global.purchaseRequests = [];
      }
      
      console.log('🔍 In-memory satın alma talepleri:', global.purchaseRequests.map(r => ({ id: r.id, email: r.email })));
      
      const requestIndex = global.purchaseRequests.findIndex(r => r.id === id);
      
      if (requestIndex === -1) {
        console.log('❌ In-memory satın alma talebi bulunamadı');
        return res.status(404).json({ error: 'Purchase request not found' });
      }
      
      const deletedRequest = global.purchaseRequests[requestIndex];
      global.purchaseRequests.splice(requestIndex, 1);
      
      console.log('✅ In-memory satın alma talebi silindi:', deletedRequest);
      
      res.json({ 
        message: 'Purchase request deleted successfully', 
        deletedRequest
      });
    }
  } catch (error) {
    console.error('💥 Satın alma talebi silme genel hatası:', error);
    res.status(500).json({ error: 'Failed to delete purchase request', details: error.message });
  }
});

// Export for Vercel serverless function
module.exports = app;

// Initialize database and start server (only for local development)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
} 
