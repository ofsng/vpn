// Servers CRUD endpoint for Vercel
const { createClient } = require('@supabase/supabase-js');

// Supabase setup
let supabase = null;
let supabaseAdmin = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  // Admin client with service role key for full access operations
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
}

// Mock VPN servers for fallback
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
    bandwidth: 1024 * 1024 * 1024,
    isActive: true,
    accessKey: 'ss://YWVzLTI1Ni1nY206cGFzc3dvcmQ@jp-tokyo.example.com:8388/?outline=1'
  }
];

module.exports = async (req, res) => {
  // Log incoming request for debugging
  console.log(`📥 Incoming request: ${req.method} ${req.url}`);
  console.log(`📋 Request headers:`, req.headers);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Log all supported methods
  console.log(`✅ Supported methods: GET, POST, PUT, DELETE, OPTIONS`);
  
  if (req.method === 'OPTIONS') {
    console.log('↩️  Responding to OPTIONS request');
    return res.status(200).end();
  }

  try {
    // Extract ID from URL for PUT and DELETE methods
    let id = null;
    if (req.method === 'PUT' || req.method === 'DELETE') {
      const urlParts = req.url.split('/');
      id = urlParts[urlParts.length - 1];
      console.log(`🔑 Extracted ID for ${req.method} request: ${id}`);
      console.log(`🔗 Full URL parts:`, urlParts);
    }

    console.log(`🔧 Processing ${req.method} request`);

    if (req.method === 'GET') {
      console.log('📖 Processing GET request for all servers');
      // Get all servers
      if (supabase) {
        const { data, error } = await supabase
          .from('vpn_servers')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Supabase servers error:', error);
          return res.status(500).json({ error: 'Failed to fetch servers' });
        }
        
        res.json(data || []);
      } else {
        // Fallback to in-memory data
        res.json(VPN_SERVERS);
      }
    }
    
    else if (req.method === 'POST') {
      // Create new server
      const newServer = {
        id: Date.now().toString(),
        name: req.body.name,
        country: req.body.country,
        city: req.body.city,
        ip: req.body.ip,
        port: parseInt(req.body.port),
        status: 'online',
        users: 0,
        maxUsers: 100,
        bandwidth: 0,
        isActive: true
      };
      
      // Use admin client for insert operations if available
      const client = supabaseAdmin || supabase;
      
      if (client) {
        const { data, error } = await client
          .from('vpn_servers')
          .insert([newServer])
          .select()
          .single();
        
        if (error) {
          console.error('Supabase create server error:', error);
          return res.status(500).json({ error: 'Failed to create server' });
        }
        
        res.json(data);
      } else {
        VPN_SERVERS.push(newServer);
        res.json(newServer);
      }
    }
    
    else if (req.method === 'PUT') {
      console.log(`✏️  Processing PUT request for server ID: ${id}`);
      console.log('📄 Request body:', req.body);
      
      // Update server
      if (!id) {
        console.log('❌ Server ID is required for PUT request');
        return res.status(400).json({ error: 'Server ID is required' });
      }
      
      // Use admin client for update operations if available
      const client = supabaseAdmin || supabase;
      
      if (client) {
        const { data, error } = await client
          .from('vpn_servers')
          .update(req.body)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('Supabase update server error:', error);
          return res.status(500).json({ error: 'Failed to update server' });
        }
        
        res.json(data);
      } else {
        const serverIndex = VPN_SERVERS.findIndex(s => s.id === id);
        if (serverIndex === -1) {
          return res.status(404).json({ error: 'Server not found' });
        }
        
        VPN_SERVERS[serverIndex] = { ...VPN_SERVERS[serverIndex], ...req.body };
        res.json(VPN_SERVERS[serverIndex]);
      }
    }
    
    else if (req.method === 'DELETE') {
      console.log(`🗑️  Processing DELETE request for server ID: ${id}`);
      
      // Delete server
      if (!id) {
        console.log('❌ Server ID is required for DELETE request');
        return res.status(400).json({ error: 'Server ID is required' });
      }
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        console.log(`❌ Invalid UUID format: ${id}`);
        return res.status(400).json({ error: 'Invalid server ID format' });
      }
      
      // Use admin client for delete operations if available
      const client = supabaseAdmin || supabase;
      
      if (client) {
        console.log(`📡 Attempting to delete server with ID: ${id} from Supabase`);
        
        // First, check if the server exists
        const { data: existingData, error: fetchError } = await client
          .from('vpn_servers')
          .select('id')
          .eq('id', id)
          .single();
        
        if (fetchError) {
          console.log(`⚠️  Error checking if server exists:`, fetchError);
        } else {
          console.log(`🔍 Server exists check result:`, existingData);
        }
        
        // Attempt to delete
        const { error } = await client
          .from('vpn_servers')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Supabase delete server error:', error);
          return res.status(500).json({ error: 'Failed to delete server' });
        }
        
        console.log(`✅ Deleted server with ID: ${id}`);
        res.json({ message: 'Server deleted' });
      } else {
        const serverIndex = VPN_SERVERS.findIndex(s => s.id === id);
        if (serverIndex === -1) {
          console.log(`❌ Server with ID ${id} not found`);
          return res.status(404).json({ error: 'Server not found' });
        }
        
        VPN_SERVERS.splice(serverIndex, 1);
        console.log(`✅ Deleted mock server with ID: ${id}`);
        res.json({ message: 'Server deleted' });
      }
    }
    
    else {
      console.log(`❌ Method not allowed: ${req.method}`);
      console.log(`📋 Available methods: GET, POST, PUT, DELETE, OPTIONS`);
      res.status(405).json({ 
        error: 'Method not allowed',
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        requestedMethod: req.method
      });
    }
  } catch (error) {
    console.error('Servers API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};