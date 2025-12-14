// Users CRUD endpoint for Vercel
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

// Mock users for fallback
const users = [
  {
    id: '1',
    email: 'demo@viralvpn.net',
    licenseKey: 'DEMO-1234-5678-9ABC',
    lastLogin: '2024-09-01T10:00:00.000Z',
    totalUsage: 1024 * 1024 * 512, // 512 MB
    status: 'active',
    currentServer: 'US East'
  },
  {
    id: '2',
    email: 'test@viralvpn.net', 
    licenseKey: 'TEST-ABCD-EFGH-IJKL',
    lastLogin: '2024-09-10T15:30:00.000Z',
    totalUsage: 1024 * 1024 * 1024, // 1 GB
    status: 'active',
    currentServer: 'Frankfurt'
  }
];

// Function to assign all available servers to a user's license
async function assignAllServersToLicense(licenseKey) {
  // Use admin client if available
  const client = supabaseAdmin || supabase;
  
  if (!client) return;
  
  try {
    // Get all available servers
    const { data: servers, error: serversError } = await client
      .from('vpn_servers')
      .select('id, name, country, city, ip, port, access_key');
    
    if (serversError) {
      console.error('Error fetching servers:', serversError);
      return;
    }
    
    // Format servers for the license
    const availableServers = servers.map(server => ({
      id: server.id,
      name: server.name,
      country: server.country,
      city: server.city,
      ip: server.ip,
      port: server.port,
      access_key: server.access_key
    }));
    
    // Update the license with all available servers
    const { error: updateError } = await client
      .from('licenses')
      .update({ available_servers: availableServers })
      .eq('key', licenseKey);
    
    if (updateError) {
      console.error('Error updating license with servers:', updateError);
    } else {
      console.log(`Successfully assigned ${availableServers.length} servers to license ${licenseKey}`);
    }
  } catch (error) {
    console.error('Error in assignAllServersToLicense:', error);
  }
}

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
      console.log('📖 Processing GET request for all users');
      // Get all users
      if (supabase) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Supabase users error:', error);
          return res.status(500).json({ error: 'Failed to fetch users' });
        }
        
        res.json(data || []);
      } else {
        // Fallback to in-memory data
        res.json(users);
      }
    }
    
    else if (req.method === 'POST') {
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        email: req.body.email,
        licenseKey: req.body.licenseKey,
        lastLogin: new Date().toISOString(),
        totalUsage: 0,
        status: 'active'
      };
      
      // Use admin client for insert operations if available
      const client = supabaseAdmin || supabase;
      
      if (client) {
        const { data, error } = await client
          .from('users')
          .insert([newUser])
          .select()
          .single();
        
        if (error) {
          console.error('Supabase create user error:', error);
          return res.status(500).json({ error: 'Failed to create user' });
        }
        
        // Automatically assign all available servers to the user's license
        if (newUser.licenseKey) {
          await assignAllServersToLicense(newUser.licenseKey);
        }
        
        res.json(data);
      } else {
        users.push(newUser);
        res.json(newUser);
      }
    }
    
    else if (req.method === 'PUT') {
      console.log(`✏️  Processing PUT request for user ID: ${id}`);
      console.log('📄 Request body:', req.body);
      
      // Update user
      if (!id) {
        console.log('❌ User ID is required for PUT request');
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      // Use admin client for update operations if available
      const client = supabaseAdmin || supabase;
      
      if (client) {
        const { data, error } = await client
          .from('users')
          .update(req.body)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error('Supabase update user error:', error);
          return res.status(500).json({ error: 'Failed to update user' });
        }
        
        // If the user's license key was updated, assign all servers to the new license
        if (req.body.licenseKey) {
          await assignAllServersToLicense(req.body.licenseKey);
        }
        
        res.json(data);
      } else {
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex === -1) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        users[userIndex] = { ...users[userIndex], ...req.body };
        res.json(users[userIndex]);
      }
    }
    
    else if (req.method === 'DELETE') {
      console.log(`🗑️  Processing DELETE request for user ID: ${id}`);
      
      // Delete user
      if (!id) {
        console.log('❌ User ID is required for DELETE request');
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        console.log(`❌ Invalid UUID format: ${id}`);
        return res.status(400).json({ error: 'Invalid user ID format' });
      }
      
      // Use admin client for delete operations if available
      const client = supabaseAdmin || supabase;
      
      if (client) {
        console.log(`📡 Attempting to delete user with ID: ${id} from Supabase`);
        
        // First, check if the user exists
        const { data: existingData, error: fetchError } = await client
          .from('users')
          .select('id')
          .eq('id', id)
          .single();
        
        if (fetchError) {
          console.log(`⚠️  Error checking if user exists:`, fetchError);
        } else {
          console.log(`🔍 User exists check result:`, existingData);
        }
        
        // Attempt to delete
        const { error } = await client
          .from('users')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Supabase delete user error:', error);
          return res.status(500).json({ error: 'Failed to delete user' });
        }
        
        console.log(`✅ Deleted user with ID: ${id}`);
        res.json({ message: 'User deleted' });
      } else {
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex === -1) {
          console.log(`❌ User with ID ${id} not found`);
          return res.status(404).json({ error: 'User not found' });
        }
        
        users.splice(userIndex, 1);
        console.log(`✅ Deleted mock user with ID: ${id}`);
        res.json({ message: 'User deleted' });
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
    console.error('Users API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};