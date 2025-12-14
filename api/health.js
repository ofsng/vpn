// Health check endpoint for Vercel
module.exports = async (req, res) => {
  console.log('=== HEALTH CHECK ENDPOINT ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).end();
  }
  
  if (req.method === 'DELETE') {
    console.log('Handling DELETE request');
    return res.status(200).json({ 
      message: 'DELETE method working correctly',
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });
  }
  
  // Default GET response
  console.log('Handling GET request');
  res.json({ 
    status: 'ok', 
    message: 'ViralVPN API is running',
    timestamp: new Date().toISOString(),
    vercel: true,
    method: req.method,
    url: req.url
  });
};