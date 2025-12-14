// Optimized licenses API for Vercel serverless functions
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase clients
let supabase = null;
let supabaseAdmin = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
}

// Simplified license key generator
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) result += '-';
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Simplified in-memory fallback
const licenses = [
  {
    id: '1',
    key: 'DEMO-1234-5678-9ABC',
    email: 'demo@viralvpn.net',
    status: 'active',
    expiryDate: '2025-12-31T23:59:59.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    plan: 'monthly',
    price: 9.99
  }
];

module.exports = async (req, res) => {
  // ENHANCED LOGGING FOR DEBUGGING
  console.log('🚀 === LICENSES API REQUEST ===');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🔗 Method: ${req.method}`);
  console.log(`🌐 URL: ${req.url}`);
  console.log(`📍 Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`📦 Body:`, JSON.stringify(req.body, null, 2));
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'unknown'}`);
  console.log(`🔑 Supabase URL: ${process.env.SUPABASE_URL ? 'configured' : 'NOT configured'}`);
  console.log(`🔑 Supabase Anon Key: ${process.env.SUPABASE_ANON_KEY ? 'configured' : 'NOT configured'}`);
  console.log(`🔑 Supabase Admin Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'NOT configured'}`);
  console.log('==============================');

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS preflight request handled');
    return res.status(200).end();
  }

  try {
    // Extract ID for PUT/DELETE requests
    let id = null;
    if (req.method === 'PUT' || req.method === 'DELETE') {
      const urlParts = req.url.split('/');
      id = urlParts[urlParts.length - 1];
      console.log(`🔍 Extracted ID for ${req.method}: ${id}`);
      console.log(`📋 URL parts:`, urlParts);
    }

    switch (req.method) {
      case 'GET':
        console.log('📖 Processing GET request for all licenses');
        if (supabase) {
          console.log('🗄️ Using Supabase for GET request');
          const { data, error } = await supabase
            .from('licenses')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('❌ Supabase GET error:', error);
            return res.status(500).json({ error: 'Failed to fetch licenses' });
          }

          console.log(`✅ Returning ${data ? data.length : 0} licenses from Supabase`);
          return res.json(data || []);
        } else {
          console.log('💾 Using in-memory fallback for GET request');
          return res.json(licenses);
        }

      case 'POST':
        console.log('📝 Processing POST request to create license');
        console.log('📦 Request body:', JSON.stringify(req.body, null, 2));

        const licenseKey = generateLicenseKey();
        const now = new Date();
        const daysToAdd = req.body.plan === 'yearly' ? 365 : 30;
        const expiryDate = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));

        const newLicense = {
          id: require('uuid').v4(),
          key: licenseKey,
          email: req.body.email,
          status: 'active',
          expiryDate: expiryDate.toISOString(),
          createdAt: now.toISOString(),
          plan: req.body.plan || 'monthly',
          price: req.body.plan === 'yearly' ? 59.99 : 9.99
        };

        console.log('🆕 Created new license:', JSON.stringify(newLicense, null, 2));

        if (supabase) {
          console.log('🗄️ Saving to Supabase');
          const { data, error } = await supabase
            .from('licenses')
            .insert([newLicense])
            .select()
            .single();

          if (error) {
            console.error('❌ Supabase POST error:', error);
            return res.status(500).json({ error: 'Failed to create license' });
          }

          console.log('✅ License saved to Supabase:', data.id);
          return res.json(data);
        } else {
          console.log('💾 Saving to in-memory storage');
          licenses.push(newLicense);
          return res.json(newLicense);
        }

      case 'PUT':
        console.log(`🔄 Processing PUT request for license ID: ${id}`);
        console.log('📦 Request body:', JSON.stringify(req.body, null, 2));

        if (!id) {
          console.log('❌ License ID is required for PUT request');
          return res.status(400).json({ error: 'License ID is required' });
        }

        const client = supabaseAdmin || supabase;
        if (client) {
          console.log('🗄️ Using Supabase for PUT request');
          const { data, error } = await client
            .from('licenses')
            .update(req.body)
            .eq('id', id)
            .select()
            .single();

          if (error) {
            console.error('❌ Supabase PUT error:', error);
            return res.status(500).json({ error: 'Failed to update license' });
          }

          console.log('✅ License updated in Supabase:', data.id);
          return res.json(data);
        } else {
          console.log('💾 Using in-memory storage for PUT request');
          const licenseIndex = licenses.findIndex(l => l.id === id);
          if (licenseIndex === -1) {
            console.log(`❌ License with ID ${id} not found`);
            return res.status(404).json({ error: 'License not found' });
          }
          licenses[licenseIndex] = { ...licenses[licenseIndex], ...req.body };
          console.log('✅ License updated in memory');
          return res.json(licenses[licenseIndex]);
        }

      case 'DELETE':
        console.log(`🗑️ Processing DELETE request for license ID: ${id}`);
        console.log('🔍 Detailed request info:');
        console.log(`  - Method: ${req.method}`);
        console.log(`  - URL: ${req.url}`);
        console.log(`  - ID extracted: ${id}`);
        console.log(`  - Headers:`, req.headers);

        if (!id) {
          console.log('❌ License ID is required for DELETE request');
          return res.status(400).json({ error: 'License ID is required' });
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
          console.log(`❌ Invalid UUID format: ${id}`);
          return res.status(400).json({ error: 'Invalid license ID format' });
        }

        const deleteClient = supabaseAdmin || supabase;
        if (deleteClient) {
          console.log('🗄️ Using Supabase for DELETE request');
          console.log(`🔍 Attempting to delete license: ${id}`);

          // First check if license exists
          const { data: existingData, error: fetchError } = await deleteClient
            .from('licenses')
            .select('id')
            .eq('id', id)
            .single();

          if (fetchError) {
            console.log(`⚠️ License existence check error:`, fetchError);
          } else {
            console.log(`✅ License exists check passed:`, existingData);
          }

          // Attempt delete
          const { error } = await deleteClient
            .from('licenses')
            .delete()
            .eq('id', id);

          if (error) {
            console.error('❌ Supabase DELETE error:', error);
            return res.status(500).json({ error: 'Failed to delete license' });
          }

          console.log(`✅ License deleted successfully from Supabase: ${id}`);
          return res.json({ message: 'License deleted successfully' });
        } else {
          console.log('💾 Using in-memory storage for DELETE request');
          const licenseIndex = licenses.findIndex(l => l.id === id);
          if (licenseIndex === -1) {
            console.log(`❌ License with ID ${id} not found`);
            return res.status(404).json({ error: 'License not found' });
          }
          licenses.splice(licenseIndex, 1);
          console.log(`✅ License deleted from memory: ${id}`);
          return res.json({ message: 'License deleted successfully' });
        }

      default:
        console.log(`❌ Method not allowed: ${req.method}`);
        console.log(`📋 Allowed methods: GET, POST, PUT, DELETE, OPTIONS`);
        console.log(`📋 Requested method: ${req.method}`);
        return res.status(405).json({
          error: 'Method not allowed',
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          requestedMethod: req.method,
          url: req.url,
          timestamp: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('💥 Critical error in licenses API:', error);
    console.error('🔍 Error stack:', error.stack);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};
