const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
  const createdAt = listing.createdAt || new Date().toISOString();

  try {
    const query = db.isPostgres
      ? `INSERT INTO listings (id, title, price, type, category, status, bedrooms, bathrooms, squareMeters, location, city, neighborhood, rooms, area, floor, description, agentName, agentPhone, image, imageUrls, videoUrl, features, featured, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET 
         title=EXCLUDED.title, price=EXCLUDED.price, type=EXCLUDED.type, category=EXCLUDED.category, status=EXCLUDED.status, 
         bedrooms=EXCLUDED.bedrooms, bathrooms=EXCLUDED.bathrooms, squareMeters=EXCLUDED.squareMeters, 
         location=EXCLUDED.location, city=EXCLUDED.city, neighborhood=EXCLUDED.neighborhood, 
         rooms=EXCLUDED.rooms, area=EXCLUDED.area, floor=EXCLUDED.floor, description=EXCLUDED.description, 
         agentName=EXCLUDED.agentName, agentPhone=EXCLUDED.agentPhone, 
         image=EXCLUDED.image, imageUrls=EXCLUDED.imageUrls, videoUrl=EXCLUDED.videoUrl, 
         features=EXCLUDED.features, featured=EXCLUDED.featured`
      : `INSERT OR REPLACE INTO listings (id, title, price, type, category, status, bedrooms, bathrooms, squareMeters, location, city, neighborhood, rooms, area, floor, description, agentName, agentPhone, image, imageUrls, videoUrl, features, featured, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await db.execute(query, [
      id, listing.title, listing.price, listing.type, listing.category || 'daire', listing.status || 'active',
      listing.bedrooms || 0, listing.bathrooms || 0, listing.squareMeters || listing.area || 0,
      listing.location || (listing.city ? `${listing.city}, ${listing.neighborhood || ''}` : ''),
      listing.city || '', listing.neighborhood || '', listing.rooms || '-', listing.area || 0, listing.floor || '', listing.description || '',
      listing.agentName || 'Emin Emlak', listing.agentPhone || '0555 013 7647',
      listing.image, JSON.stringify(listing.imageUrls || []), listing.videoUrl || '',
      JSON.stringify(listing.features || []),
      listing.featured ? 1 : 0,
      createdAt
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

// --- Sahibinden Scraper ---

function parseSahibindenHTML(html) {
  const $ = cheerio.load(html);
  const result = {
    title: '',
    price: 0,
    type: 'satilik',
    category: 'daire',
    city: 'Mardin, Nusaybin',
    neighborhood: '',
    rooms: '-',
    area: 0,
    floor: '',
    description: '',
    features: [],
    images: []
  };

  // 1. Title
  let rawTitle = $('h1.classifiedDetailTitle').text().trim()
    || $('div.classifiedDetailTitle h1').text().trim()
    || $('[class*="classifiedDetailTitle"]').first().text().trim()
    || $('meta[property="og:title"]').attr('content')
    || $('title').text().trim();

  result.title = rawTitle
    .replace(/\s*-\s*Satılık.*$/i, '')
    .replace(/\s*-\s*Kiralık.*$/i, '')
    .replace(/\s*-\s*sahibinden.*$/i, '')
    .replace(/\s*-\s*\d+$/g, '')
    .trim();

  // 2. Price
  let priceText = $('div.classifiedInfo h3').first().text().trim()
    || $('[class*="classifiedInfo"] h3').first().text().trim()
    || $('div.classified-price-container').first().text().trim()
    || $('[class*="price"]').first().text().trim();

  if (!priceText || (!priceText.includes('TL') && !priceText.includes('₺'))) {
    const match = html.match(/class=["'][^"']*price[^"']*["'][^>]*>\s*([\d\.\,]+)\s*(?:TL|₺)/i)
               || html.match(/([\d\.\,]{4,})\s*(?:TL|₺)/i);
    if (match) priceText = match[1];
  }

  if (priceText) {
    const cleanDigits = priceText.replace(/[^\d]/g, '');
    let p = parseInt(cleanDigits, 10) || 0;
    if (p > 1000000000) {
      const halfLen = Math.floor(cleanDigits.length / 2);
      p = parseInt(cleanDigits.substring(0, halfLen), 10) || p;
    }
    result.price = p;
  }

  // 3. Info Map
  const infoMap = {};
  $('ul.classifiedInfoList li, ul[class*="classifiedInfoList"] li, div.classified-table ul li').each((_, el) => {
    const strong = $(el).find('strong, b, span.title').first().text().trim();
    let span = $(el).find('span.txt, span.value, span:not(:has(strong))').last().text().trim();
    if (!span || span === strong) {
      span = $(el).text().replace(strong, '').trim();
    }
    if (strong && span) {
      infoMap[strong.toLowerCase()] = span;
    }
  });

  // Map infoMap keys
  Object.keys(infoMap).forEach(key => {
    const val = infoMap[key];
    if ((key.includes('oda') || key.includes('salon')) && (result.rooms === '-' || !result.rooms)) result.rooms = val;
    if ((key.includes('m² (brüt)') || key.includes('m²') || key.includes('metrekare')) && !result.area) {
      const parsedArea = parseInt(val.replace(/[^\d]/g, ''), 10);
      if (parsedArea) result.area = parsedArea;
    }
    if (key.includes('kat') && !key.includes('sayısı') && !result.floor) result.floor = val;
    if ((key.includes('mahalle') || key.includes('semt')) && !result.neighborhood) result.neighborhood = val;
    if ((key.includes('il / ilçe') || key.includes('ilçe') || key.includes('şehir')) && (!result.city || result.city === 'Mardin, Nusaybin')) result.city = val.replace('/', ',');
  });

  // 4. Type & Category from TARGETED fields only
  const breadcrumbText = $('div.breadcrumb-container, nav.breadcrumb, [class*="breadcrumb"]').text().toLowerCase();
  const emlakTipi = (infoMap['emlak tipi'] || infoMap['kategori'] || '').toLowerCase();
  const searchScope = (result.title + ' ' + emlakTipi + ' ' + breadcrumbText).toLowerCase();

  if (emlakTipi.includes('kiralık') || searchScope.includes('kiralık daire') || searchScope.includes('kiralik daire') || searchScope.includes('kiralık ev')) {
    result.type = 'kiralik';
  } else {
    result.type = 'satilik';
  }

  if (searchScope.includes('arsa') || searchScope.includes('tarla')) {
    result.category = 'arsa';
  } else if (searchScope.includes('müstakil') || searchScope.includes('villa')) {
    result.category = 'mustakil';
  } else if (searchScope.includes('iş yeri') || searchScope.includes('dükkan') || searchScope.includes('ofis') || searchScope.includes('mağaza')) {
    result.category = 'isyeri';
  } else {
    result.category = 'daire';
  }

  // 5. Locations from breadcrumbs or meta
  const breadcrumbElements = [];
  $('div.breadcrumb-container a, nav.breadcrumb a, [class*="breadcrumb"] a').each((_, el) => {
    const text = $(el).text().trim();
    if (text) breadcrumbElements.push(text);
  });

  const locationTokens = breadcrumbElements.filter(text => {
    const t = text.toLowerCase();
    return !['anasayfa', 'emlak', 'konut', 'satılık', 'kiralık', 'daire', 'müstakil', 'arsa', 'iş yeri', 'satılık daire', 'kiralık daire', 'satılık arsa', 'satılık müstakil'].includes(t);
  });

  if (locationTokens.length >= 2) {
    result.city = locationTokens.slice(0, 2).join(', ');
    if (locationTokens.length >= 3 && !result.neighborhood) {
      result.neighborhood = locationTokens[2];
    }
  } else if (locationTokens.length === 1) {
    if (!result.city || result.city === 'Mardin, Nusaybin') result.city = locationTokens[0];
  }

  if (!result.city || result.city === 'Mardin, Nusaybin') {
    const metaDesc = $('meta[name="description"], meta[name="twitter:description"]').attr('content') || '';
    if (metaDesc.includes('Nusaybin') || metaDesc.includes('Mardin')) {
      const match = metaDesc.match(/([^\.]*Mah\.)\s*([^\.]*Nusaybin)\s*([^\.]*Mardin)/i);
      if (match) {
        result.neighborhood = match[1].trim();
        result.city = `Mardin, Nusaybin`;
      }
    }
  }

  // 6. Description
  result.description = $('div#classifiedDescription, div[class*="classifiedDescription"]').text().trim()
    || $('meta[name="twitter:description"]').attr('content')
    || $('meta[name="description"]').attr('content')
    || '';
  result.description = result.description.replace(/\s+/g, ' ').trim();

  // 7. Features
  $('ul.classifiedFeaturesList li span, ul[class*="feature"] li span, div.classified-features li span').each((_, el) => {
    const feat = $(el).text().trim();
    if (feat && !result.features.includes(feat)) result.features.push(feat);
  });

  // 8. Images
  const imageSet = new Set();
  $('meta[property="og:image"], meta[name="twitter:image"]').each((_, el) => {
    const content = $(el).attr('content');
    if (content && !content.includes('placeholder') && !content.includes('logo') && !content.includes('icon')) {
      let url = content.startsWith('//') ? 'https:' + content : content;
      imageSet.add(url);
    }
  });

  $('img, a[data-index], div.classifiedDetailPhotos img, label.mega-photo-viewer img').each((_, el) => {
    let src = $(el).attr('data-src') || $(el).attr('src') || $(el).attr('href') || '';
    if (src && (src.includes('shbdn.com/photos/') || src.includes('/photos/')) && !src.includes('placeholder') && !src.includes('logo') && !src.includes('icon')) {
      if (src.startsWith('//')) src = 'https:' + src;
      let highRes = src.replace(/\/thmb\//, '/x5/').replace(/_thmb\./, '.').replace(/_s\./, '_x5.');
      imageSet.add(highRes);
    }
  });

  const cdnPhotoRegex = /(?:https?:)?\/\/[a-z0-9]+\.shbdn\.com\/photos\/[^\s"'<>\\]+/gi;
  const matches = html.match(cdnPhotoRegex) || [];
  matches.forEach(rawUrl => {
    let url = rawUrl.startsWith('//') ? 'https:' + rawUrl : rawUrl;
    url = url.replace(/['"\\;,\]\)]+$/g, '');
    if (!url.includes('placeholder') && !url.includes('logo') && !url.includes('icon')) {
      let highRes = url.replace(/\/thmb\//, '/x5/').replace(/_thmb\./, '.').replace(/_s\./, '_x5.');
      imageSet.add(highRes);
    }
  });

  result.images = [...imageSet];

  return result;
}

app.post('/api/scrape-sahibinden', async (req, res) => {
  const { url, html: rawHtml } = req.body;

  try {
    let html = rawHtml;

    // Mode 1: Fetch from URL
    if (!html && url) {
      if (!url.includes('sahibinden.com')) {
        return res.status(400).json({ error: 'Lütfen geçerli bir Sahibinden.com ilan bağlantısı girin.' });
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Ch-Ua': '"Not-A.Brand";v="99", "Chromium";v="124", "Google Chrome";v="124"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      if (!response.ok) {
        return res.status(422).json({
          error: 'Sahibinden sayfası yüklenemedi. Güvenlik engeli olabilir.',
          blocked: true,
          tip: 'Sahibinden sayfasını tarayıcınızda açıp, sağ tık > "Sayfa kaynağını görüntüle" yaparak HTML\'i kopyalayıp yapıştırabilirsiniz.'
        });
      }

      html = await response.text();
    }

    if (!html) {
      return res.status(400).json({ error: 'Lütfen bir URL veya HTML içeriği gönderin.' });
    }

    // Check if we got a security page instead of the listing (only for URL-fetched content)
    if (!rawHtml && (html.includes('captcha') || html.includes('challenge-platform') || html.length < 5000)) {
      return res.status(422).json({
        error: 'Sahibinden güvenlik doğrulaması engelledi.',
        blocked: true,
        tip: 'Sahibinden sayfasını tarayıcınızda açıp, sağ tık > "Sayfa kaynağını görüntüle" yaparak HTML\'i kopyalayıp yapıştırabilirsiniz.'
      });
    }

    const data = parseSahibindenHTML(html);
    res.json({ success: true, data });

  } catch (err) {
    res.status(500).json({
      error: 'Veri çekilirken hata oluştu: ' + err.message,
      blocked: true,
      tip: 'Sahibinden sayfasını tarayıcınızda açıp, sağ tık > "Sayfa kaynağını görüntüle" yaparak HTML\'i kopyalayıp yapıştırabilirsiniz.'
    });
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
