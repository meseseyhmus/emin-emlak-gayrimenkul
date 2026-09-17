/* =============================================
   EMIN EMLAK - Data Manager (API Version)
   ============================================= */

const DataManager = {
  _data: {
    listings: [],
    settings: {}
  },
  
  // Base URL for API
  API_URL: window.location.origin + '/api',

  // Initialize data - fetch from SQL API
  async init() {
    try {
      const [listingsRes, settingsRes] = await Promise.all([
        fetch(`${this.API_URL}/listings`),
        fetch(`${this.API_URL}/settings`)
      ]);
      
      if (listingsRes.ok) {
        this._data.listings = await listingsRes.json();
      }
      if (settingsRes.ok) {
        this._data.settings = await settingsRes.json();
      }
    } catch (e) {
      console.error('API Veri yüklenemedi:', e);
    }
    return this._data;
  },

  // Get all listings
  getAllListings() {
    return this._data.listings;
  },

  // Get featured listings
  getFeaturedListings() {
    return this._data.listings.filter(l => l.featured && l.status === 'active');
  },

  // Get listing by ID
  getListing(id) {
    return this._data.listings.find(l => l.id === id);
  },

  // Add or update a listing
  async addListing(listing) {
    try {
      const response = await fetch(`${this.API_URL}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listing)
      });
      const result = await response.json();
      if (result.success) {
        // Refresh local data
        await this.init();
        return true;
      }
    } catch (e) {
      console.error('İlan eklenemedi:', e);
    }
    return false;
  },

  // Delete a listing
  async async updateListing(listing) { return this.addListing(listing); },

  async deleteListing(id) {
    try {
      const response = await fetch(`${this.API_URL}/listings/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        this._data.listings = this._data.listings.filter(l => l.id !== id);
        return true;
      }
    } catch (e) {
      console.error('İlan silinemedi:', e);
    }
    return false;
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
    return this._data.settings;
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

  // Auth (Mock)
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

