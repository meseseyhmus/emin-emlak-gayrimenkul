/* =============================================
   EMIN EMLAK - Data Manager (API & Fallback)
   ============================================= */

const DataManager = {
  _data: {
    listings: [],
    settings: {}
  },

  // Base URL for API
  API_URL: window.location.origin + '/api',

  // Initialize data - fetch from SQL API with static JSON fallback
  async init() {
    try {
      const [listingsRes, settingsRes] = await Promise.all([
        fetch(`${this.API_URL}/listings`).catch(() => null),
        fetch(`${this.API_URL}/settings`).catch(() => null)
      ]);

      if (listingsRes && listingsRes.ok) {
        this._data.listings = await listingsRes.json();
      }
      if (settingsRes && settingsRes.ok) {
        this._data.settings = await settingsRes.json();
      }
    } catch (e) {
      console.warn('API Veri yüklenemedi, yerel veriye geçiliyor:', e);
    }

    // Fallback to root /data/listings.json if API returned empty array or failed
    if (!this._data.listings || this._data.listings.length === 0) {
      try {
        const localRes = await fetch('/data/listings.json');
        if (localRes.ok) {
          const localData = await localRes.json();
          this._data.listings = localData.listings || [];
          if (!this._data.settings || Object.keys(this._data.settings).length === 0) {
            this._data.settings = localData.settings || {};
          }
        }
      } catch (err) {
        console.error('Yerel veri yükleme hatası:', err);
      }
    }

    // Merge with client-side localStorage fallback for Vercel persistence
    try {
      const stored = localStorage.getItem('emin_custom_listings');
      if (stored) {
        const customListings = JSON.parse(stored);
        customListings.forEach(c => {
          const idx = this._data.listings.findIndex(l => String(l.id) === String(c.id));
          if (idx >= 0) {
            this._data.listings[idx] = { ...this._data.listings[idx], ...c };
          } else {
            this._data.listings.unshift(c);
          }
        });
      }
    } catch (err) {}

    // Normalize all listings
    this._data.listings = (this._data.listings || []).map(l => this._normalizeListing(l)).filter(Boolean);

    return this._data;
  },

  _normalizeListing(l) {
    if (!l) return null;
    let extra = l.imageUrls !== undefined ? l.imageUrls : (l.imageurls !== undefined ? l.imageurls : []);
    if (typeof extra === 'string') {
      try { extra = JSON.parse(extra); } catch (e) { extra = []; }
    }
    if (!Array.isArray(extra)) extra = [];

    let feats = l.features || [];
    if (typeof feats === 'string') {
      try { feats = JSON.parse(feats); } catch (e) { feats = []; }
    }
    if (!Array.isArray(feats)) feats = [];

    const mainImg = l.image || l.image_url || '';
    let imagesArr = l.images;
    if (typeof imagesArr === 'string') {
      try { imagesArr = JSON.parse(imagesArr); } catch (e) { imagesArr = null; }
    }
    if (!Array.isArray(imagesArr) || imagesArr.length === 0) {
      imagesArr = [mainImg, ...extra].filter(img => img && typeof img === 'string' && img.trim() !== '');
      imagesArr = [...new Set(imagesArr)];
    }

    return {
      ...l,
      id: String(l.id),
      title: l.title || '',
      price: Number(l.price) || 0,
      type: l.type || 'satilik',
      category: l.category || 'daire',
      status: l.status || 'active',
      rooms: l.rooms || '-',
      area: Number(l.area || l.squaremeters || l.squareMeters) || 0,
      squareMeters: Number(l.squaremeters || l.squareMeters || l.area) || 0,
      floor: l.floor || '',
      description: l.description || '',
      city: l.city || '',
      neighborhood: l.neighborhood || '',
      location: l.location || (l.city ? `${l.city}${l.neighborhood ? ', ' + l.neighborhood : ''}` : ''),
      agentName: l.agentName || l.agentname || 'Emin Emlak Gayrimenkul',
      agentPhone: l.agentPhone || l.agentphone || '0555 013 7647',
      image: mainImg || (imagesArr.length > 0 ? imagesArr[0] : ''),
      images: imagesArr,
      imageUrls: extra,
      videoUrl: l.videoUrl || l.videourl || '',
      features: feats,
      featured: l.featured === true || l.featured === 1,
      createdAt: l.createdAt || l.createdat || new Date().toISOString()
    };
  },

  // Get all listings
  getAllListings() {
    return (this._data.listings || []).map(l => this._normalizeListing(l)).filter(Boolean);
  },

  // Get featured listings
  getFeaturedListings() {
    return this.getAllListings().filter(l => l.featured && l.status === 'active');
  },

  // Get listing by ID
  getListing(id) {
    const found = this.getAllListings().find(l => String(l.id) === String(id));
    return found ? this._normalizeListing(found) : null;
  },

  _saveToLocalStorage(listing) {
    try {
      let stored = JSON.parse(localStorage.getItem('emin_custom_listings') || '[]');
      const idx = stored.findIndex(l => String(l.id) === String(listing.id));
      if (idx >= 0) stored[idx] = { ...stored[idx], ...listing };
      else stored.unshift(listing);
      localStorage.setItem('emin_custom_listings', JSON.stringify(stored));
    } catch (e) {}
  },

  _removeFromLocalStorage(id) {
    try {
      let stored = JSON.parse(localStorage.getItem('emin_custom_listings') || '[]');
      stored = stored.filter(l => String(l.id) !== String(id));
      localStorage.setItem('emin_custom_listings', JSON.stringify(stored));
    } catch (e) {}
  },

  // Add or update a listing
  async addListing(listing) {
    this._saveToLocalStorage(listing);
    const idx = (this._data.listings || []).findIndex(l => String(l.id) === String(listing.id));
    if (idx >= 0) this._data.listings[idx] = { ...this._data.listings[idx], ...listing };
    else (this._data.listings = this._data.listings || []).unshift(listing);

    try {
      const response = await fetch(`${this.API_URL}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listing)
      });
      const result = await response.json();
      if (result.success) {
        await this.init();
        return true;
      }
    } catch (e) {
      console.warn('API kaydedilemedi, yerel hafızaya yazıldı:', e);
    }
    return true;
  },

  // Delete a listing
  async updateListing(listing) { return this.addListing(listing); },

  async deleteListing(id) {
    this._removeFromLocalStorage(id);
    this._data.listings = (this._data.listings || []).filter(l => String(l.id) !== String(id));

    try {
      const response = await fetch(`${this.API_URL}/listings/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        return true;
      }
    } catch (e) {
      console.warn('API silme başarısız, yerel hafızadan silindi:', e);
    }
    return true;
  },

  // Get all messages
  async getMessages() {
    try {
      const response = await fetch(`${this.API_URL}/messages`);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.error('Mesajlar alınamadı:', e);
    }
    return [];
  },

  // Add a message (from contact form)
  async addMessage(msg) {
    try {
      const response = await fetch(`${this.API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      });
      return response.ok;
    } catch (e) {
      console.error('Mesaj gönderilemedi:', e);
    }
    return false;
  },

  // Settings
  getSettings() {
    return this._data.settings || {};
  },

  async updateSettings(settings) {
    try {
      const response = await fetch(`${this.API_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (response.ok) {
        this._data.settings = settings;
        return true;
      }
    } catch (e) {
      console.error('Ayarlar güncellenemedi:', e);
    }
    return false;
  },

  // Auth
  login(password) {
    if (password === 'admin123') {
      sessionStorage.setItem('admin_auth', 'true');
      return true;
    }
    return false;
  },

  isLoggedIn() {
    return sessionStorage.getItem('admin_auth') === 'true';
  },

  logout() {
    sessionStorage.removeItem('admin_auth');
  }
};
