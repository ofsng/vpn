// Purchase request endpoint for Vercel
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Supabase setup
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}

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
        plan: data.plan
      });
    } else {
      // Fallback for demo
      console.log('✅ Demo satın alma talebi kaydedildi');
      
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
};