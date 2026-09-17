const AdminApp = {
  // Update sidebar counts
  updateSidebarCounts() {
    const listings = DataManager.getAllListings();
    const listingEl = document.getElementById('sidebar-listing-count');
    if(listingEl) listingEl.textContent = listings.length;
    
    // Fake messages data for the template since DataManager doesn't seem to store messages
    const messageEl = document.getElementById('sidebar-message-count');
    if(messageEl) messageEl.textContent = '8';
  },

  // 1. Dashboard Page
  async initDashboard() {
    this.updateSidebarCounts();
    
    const listings = DataManager.getAllListings();
    const activeListings = listings.filter(l => l.status === 'active');
    
    const totalEl = document.getElementById('dash-total-listings');
    if(totalEl) totalEl.textContent = listings.length;
    
    const activeEl = document.getElementById('dash-active-listings');
    if(activeEl) activeEl.textContent = activeListings.length;
    
          const msgEl = document.getElementById('dash-new-messages');
      const messages = await DataManager.getMessages();
      const unreadCount = messages.filter(m => !m.read).length;
      if(msgEl) msgEl.textContent = unreadCount;
      
      const msgContainer = document.getElementById('dash-recent-messages');
      if (msgContainer) {
        msgContainer.innerHTML = messages.slice(0, 3).map(m => \
          <div class="message-card \">
            <div class="message-card-header">
              <span class="message-card-name">\</span>
              <span class="message-card-date">\</span>
            </div>
            <div class="message-card-subject">\</div>
          </div>
        \).join('');
      }-500/20 font-bold text-${m.color}-300">${m.initials}</span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center justify-between gap-3">
              <strong class="truncate text-sm">${m.name}</strong>
              <time class="shrink-0 text-[10px] text-white/35">${m.time}</time>
            </span>
            <span class="mt-1 block truncate text-xs text-white/45">${m.text}</span>
          </span>
        </button>
      `).join('');
    }
  },

  // 2. Listings Page
  initListingsPage() {
    this.updateSidebarCounts();
    
    const searchInput = document.getElementById('search-input');
    const filterType = document.getElementById('filter-type');
    const tbody = document.getElementById('listings-table-body');
    
    const renderListings = () => {
      let listings = DataManager.getAllListings();
      const q = searchInput.value.toLowerCase();
      const type = filterType.value;
      
      if (q) listings = listings.filter(l => l.title.toLowerCase().includes(q));
      if (type) listings = listings.filter(l => l.type === type);
      
      if(tbody) {
        tbody.innerHTML = listings.length 
          ? listings.map(l => this.renderListingRow(l)).join('') 
          : '<tr><td colspan="5" class="p-6 text-center text-sm text-white/45">İlan bulunamadı.</td></tr>';
      }
    };
    
    searchInput?.addEventListener('input', renderListings);
    filterType?.addEventListener('change', renderListings);
    
    // Initial Render
    renderListings();
  },
  
  renderListingRow(l) {
    const imgUrl = l.images && l.images.length ? l.images[0] : '../assets/images/placeholder.jpg';
    const statusClass = l.status === 'active' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-orange-400/10 text-orange-300';
    const statusText = l.status === 'active' ? 'Aktif' : 'Taslak';
    
    return `
      <tr class="table-row">
        <td class="px-5 py-4">
          <div class="flex items-center gap-3">
            <img src="${imgUrl}" alt="${l.title}" class="h-12 w-16 rounded-lg object-cover">
            <div>
              <strong class="block max-w-[230px] truncate text-sm">${l.title}</strong>
              <span class="mt-1 block text-xs text-white/40">${l.rooms} · ${l.area} m² · ${l.city}</span>
            </div>
          </div>
        </td>
        <td class="px-4 py-4">
          <span class="rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClass}">${statusText}</span>
        </td>
        <td class="px-4 py-4 text-sm font-semibold text-amber-400">${Utils.formatPrice(l.price)}</td>
        <td class="px-4 py-4 text-xs text-white/45">${new Date(l.createdAt).toLocaleDateString('tr-TR')}</td>
        <td class="px-5 py-4">
          <div class="flex justify-end gap-1">
            <a href="../ilan-detay.html?id=${l.id}" target="_blank" aria-label="İlanı görüntüle" class="flex h-8 w-8 items-center justify-center rounded-lg text-white/45 hover:bg-white/10 hover:text-white">
              <iconify-icon icon="lucide:eye"></iconify-icon>
            </a>
            <a href="ilan-ekle.html?edit=${l.id}" aria-label="İlanı düzenle" class="flex h-8 w-8 items-center justify-center rounded-lg text-white/45 hover:bg-amber-500/15 hover:text-amber-400">
              <iconify-icon icon="lucide:pencil"></iconify-icon>
            </a>
            <button onclick="AdminApp.deleteListing('${l.id}')" aria-label="İlanı sil" class="flex h-8 w-8 items-center justify-center rounded-lg text-white/45 hover:bg-red-500/15 hover:text-red-400">
              <iconify-icon icon="lucide:trash-2"></iconify-icon>
            </button>
          </div>
        </td>
      </tr>
    `;
  },
  
  deleteListing(id) {
    if(confirm('Bu ilanı silmek istediğinize emin misiniz?')) {
      DataManager.deleteListing(id);
      window.location.reload();
    }
  },

  // 3. Add/Edit Listing Page
  initListingForm() {
    this.updateSidebarCounts();
    
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    const form = document.getElementById('listing-form');
    
    const imageInput = document.getElementById('image');
    const imageBase64 = document.getElementById('imageBase64');
    const imagePreview = document.getElementById('imagePreview');
    
    imageInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if(file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          imageBase64.value = ev.target.result;
          imagePreview.src = ev.target.result;
          imagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    });

    const extraInput = document.getElementById('imageUrls');
    const extraBase64 = document.getElementById('extraImagesBase64');
    const extraPreview = document.getElementById('extraImagesPreview');
    
    extraInput?.addEventListener('change', (e) => {
      extraPreview.innerHTML = '';
      const files = Array.from(e.target.files).slice(0, 4);
      const results = [];
      let loaded = 0;
      if (files.length === 0) {
        extraBase64.value = '';
        return;
      }
      files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          results[index] = ev.target.result;
          extraPreview.innerHTML += \<img src="\" class="h-16 w-16 object-cover rounded-lg border border-white/20">\;
          loaded++;
          if(loaded === files.length) {
            extraBase64.value = JSON.stringify(results);
          }
        };
        reader.readAsDataURL(file);
      });
    });
    
    if (editId) {
      document.getElementById('page-title').textContent = 'İlanı Düzenle';
      const listing = DataManager.getListing(editId);
      if (listing) {
        document.getElementById('title').value = listing.title;
        document.getElementById('type').value = listing.type;
        document.getElementById('category').value = listing.category || 'daire';
        document.getElementById('price').value = listing.price;
        document.getElementById('status').value = listing.status || 'active';
        document.getElementById('featured').checked = listing.featured || false;
        
        document.getElementById('city').value = listing.city || '';
        document.getElementById('neighborhood').value = listing.neighborhood || '';
        document.getElementById('rooms').value = listing.rooms || '-';
        document.getElementById('area').value = listing.area || '';
        document.getElementById('floor').value = listing.floor || '';
        document.getElementById('description').value = listing.description || '';
        document.getElementById('features').value = (listing.features || []).join(', ');
        
        if(listing.image) {
          imageBase64.value = listing.image;
          imagePreview.src = listing.image;
          imagePreview.classList.remove('hidden');
          imageInput.removeAttribute('required');
        }
        
        if(listing.imageUrls && listing.imageUrls.length > 0) {
          extraBase64.value = JSON.stringify(listing.imageUrls);
          listing.imageUrls.forEach(url => {
            extraPreview.innerHTML += \<img src="\" class="h-16 w-16 object-cover rounded-lg border border-white/20">\;
          });
        }
        
        document.getElementById('videoUrl').value = listing.videoUrl || '';
      }
    }
    
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const parsedExtra = extraBase64.value ? JSON.parse(extraBase64.value) : [];
      
      const newListing = {
        title: document.getElementById('title').value,
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        price: Number(document.getElementById('price').value),
        status: document.getElementById('status').value,
        featured: document.getElementById('featured').checked,
        
        city: document.getElementById('city').value,
        neighborhood: document.getElementById('neighborhood').value,
        rooms: document.getElementById('rooms').value,
        area: Number(document.getElementById('area').value),
        floor: document.getElementById('floor').value,
        description: document.getElementById('description').value,
        
        features: document.getElementById('features').value.split(',').map(f => f.trim()).filter(f => f),
        
        image: imageBase64.value || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        imageUrls: parsedExtra,
        videoUrl: document.getElementById('videoUrl').value.trim()
      };
      
      if (editId) {
        const existing = DataManager.getListing(editId);
        Object.assign(existing, newListing);
        await DataManager.updateListing(existing);
      } else {
        await DataManager.addListing(newListing);
      }
      
      window.location.href = 'ilanlar.html';
    });
  },

    // 4. Messages Page
  async initMessagesPage() {
    this.updateSidebarCounts();
    const messages = await DataManager.getMessages();
    
    const msgList = document.getElementById('messages-list');
    if (msgList) {
      if (messages.length === 0) {
        msgList.innerHTML = '<div class="text-center p-8 text-white/50">Henüz mesaj yok.</div>';
        return;
      }
      msgList.innerHTML = messages.map(m => \
        <div class="message-card \">
          <div class="message-card-header">
            <span class="message-card-name">\</span>
            <span class="message-card-date">\</span>
          </div>
          <div class="message-card-subject">\</div>
          <div class="message-card-text">\</div>
          <div class="mt-2 text-xs text-white/40">\ | \</div>
        </div>
      \).join('');
    }
  },
  // 5. Settings Page
  initSettingsPage() {
    this.updateSidebarCounts();
    
    const form = document.getElementById('settings-form');
    if (form) {
      // Load existing settings
      const settings = DataManager.getSettings();
      document.getElementById('phone').value = settings.phone || '0555 013 7647';
      document.getElementById('address').value = settings.address || 'Nusaybin, Mardin';
      
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Save settings
        const newSettings = {
          phone: document.getElementById('phone').value,
          address: document.getElementById('address').value
        };
        await DataManager.updateSettings(newSettings);
        
        const success = document.getElementById('settings-success');
        success.classList.remove('hidden');
        setTimeout(() => success.classList.add('hidden'), 3000);
      });
    }
  }
};







