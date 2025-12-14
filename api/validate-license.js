// License validation endpoint for Vercel
const { createClient } = require('@supabase/supabase-js');

// Supabase setup
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
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
    bandwidth: 1024 * 1024 * 1024,
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
    bandwidth: 1024 * 1024 * 1024,
    isActive: true,
    accessKey: 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@de-frankfurt.example.com:8388/?outline=1'
  }
];

// In-memory licenses for fallback
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
  }
];

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      return res.status(400).json({
        status: 'invalid',
        message: 'License has expired'
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
};