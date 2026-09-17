const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '/')));

// =======================
// API ENDPOINTS
// =======================

// --- Settings ---
app.get('/api/settings', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM settings');
    const settings = {};
    rows.forEach(row => { settings[row.key] = row.value; });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  const { phone, address } = req.body;
  try {
    const query = db.isPostgres 
      ? `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value`
      : `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`;
      
    if (phone) await db.execute(query, ['phone', phone]);
    if (address) await db.execute(query, ['address', address]);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Listings ---
app.get('/api/listings', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM listings');
    const listings = rows.map(r => ({
      ...r,
      features: JSON.parse(r.features || '[]'),
      imageUrls: JSON.parse(r.imageUrls || '[]'),
      featured: r.featured === 1
    }));
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/listings', async (req, res) => {
  const listing = req.body;
  const id = listing.id || Date.now().toString();
  
  try {
    const query = db.isPostgres
      ? `INSERT INTO listings (id, title, price, type, status, bedrooms, bathrooms, squareMeters, location, agentName, agentPhone, image, imageUrls, videoUrl, features, featured) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET 
         title=EXCLUDED.title, price=EXCLUDED.price, type=EXCLUDED.type, status=EXCLUDED.status, 
         bedrooms=EXCLUDED.bedrooms, bathrooms=EXCLUDED.bathrooms, squareMeters=EXCLUDED.squareMeters, 
         location=EXCLUDED.location, agentName=EXCLUDED.agentName, agentPhone=EXCLUDED.agentPhone, 
         image=EXCLUDED.image, imageUrls=EXCLUDED.imageUrls, videoUrl=EXCLUDED.videoUrl, 
         features=EXCLUDED.features, featured=EXCLUDED.featured`
      : `INSERT OR REPLACE INTO listings (id, title, price, type, status, bedrooms, bathrooms, squareMeters, location, agentName, agentPhone, image, imageUrls, videoUrl, features, featured) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await db.execute(query, [
      id, listing.title, listing.price, listing.type, listing.status, 
      listing.bedrooms, listing.bathrooms, listing.squareMeters, 
      listing.location, listing.agentName, listing.agentPhone, 
      listing.image, JSON.stringify(listing.imageUrls || []), listing.videoUrl || '',
      JSON.stringify(listing.features || []), 
      listing.featured ? 1 : 0
    ]);

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/listings/:id', async (req, res) => {
  try {
    const changes = await db.execute('DELETE FROM listings WHERE id = ?', [req.params.id]);
    res.json({ success: true, changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Messages ---
app.get('/api/messages', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM messages ORDER BY date DESC');
    const messages = rows.map(r => ({ ...r, read: r.read === 1 }));
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', async (req, res) => {
  const msg = req.body;
  const id = msg.id || Date.now().toString();
  const date = msg.date || new Date().toISOString();
  
  try {
    await db.execute(`
      INSERT INTO messages (id, name, email, phone, subject, message, date, read) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `, [id, msg.name, msg.email, msg.phone, msg.subject, msg.message, date]);
    
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server if not running in a serverless environment like Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

// Export the app for Vercel
module.exports = app;
