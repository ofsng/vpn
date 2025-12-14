// Admin login endpoint for Vercel
const jwt = require('jsonwebtoken');

// Admin credentials from environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Password_2025!';
const JWT_SECRET = process.env.JWT_SECRET || 'viralvpn-super-secure-jwt-secret-key-2024';

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
    const { username, password } = req.body;
    
    console.log('🔐 Admin login attempt:', { username, hasPassword: !!password });
    console.log('🔑 Environment check:', { 
      hasUsername: !!ADMIN_USERNAME, 
      hasPassword: !!ADMIN_PASSWORD,
      hasSecret: !!JWT_SECRET 
    });
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '2h' });
      console.log('✅ Login successful');
      return res.json({ token });
    }
    
    console.log('❌ Invalid credentials');
    res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};