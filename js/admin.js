const AdminApp = {
  // Update sidebar counts
  updateSidebarCounts() {
    const listings = DataManager.getAllListings();
    const listingEl = document.getElementById('sidebar-listing-count');
    if (listingEl) listingEl.textContent = listings.length;

    // Fake messages data for the template since DataManager doesn't seem to store messages
    const messageEl = document.getElementById('sidebar-message-count');
    if (messageEl) messageEl.textContent = '8';
  },

  // 1. Dashboard Page
  async initDashboard() {
    this.updateSidebarCounts();

    const listings = DataManager.getAllListings();
    const activeListings = listings.filter(l => l.status === 'active');

    const totalEl = document.getElementById('dash-total-listings');
    if (totalEl) totalEl.textContent = listings.length;

    const activeEl = document.getElementById('dash-active-listings');
    if (activeEl) activeEl.textContent = activeListings.length;

    const msgEl = document.getElementById('dash-new-messages');
    const messages = await DataManager.getMessages();
    const unreadCount = messages.filter(m => !m.read).length;
    if (msgEl) msgEl.textContent = unreadCount;

    const msgContainer = document.getElementById('dash-recent-messages');
    if (msgContainer) {
      msgContainer.innerHTML = messages.slice(0, 3).map(m => `
        <button class="flex w-full items-center gap-3.5 rounded-xl border border-white/5 bg-white/[.02] p-3 text-left transition hover:border-amber-500/30 hover:bg-amber-500/[.03]">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 font-bold text-amber-300">${m.name ? m.name.charAt(0) : 'M'}</span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center justify-between gap-3">
              <strong class="truncate text-sm">${m.name || 'İsimsiz'}</strong>
              <time class="shrink-0 text-[10px] text-white/35">${m.date || ''}</time>
            </span>
            <span class="mt-1 block truncate text-xs text-white/45">${m.message || m.text || ''}</span>
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
      const q = searchInput ? searchInput.value.toLowerCase() : '';
      const type = filterType ? filterType.value : '';

      if (q) listings = listings.filter(l => l.title.toLowerCase().includes(q));
      if (type) listings = listings.filter(l => l.type === type);

      if (tbody) {
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
    if (confirm('Bu ilanı silmek istediğinize emin misiniz?')) {
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
      if (file) {
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
      msgList.innerHTML = messages.map(m => `
              <div class="message-card ${m.read ? '' : 'unread'}">
                <div class="message-card-header">
                  <span class="message-card-name">${m.name}</span>
                  <span class="message-card-date">${new Date(m.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
                <div class="message-card-subject">${m.subject}</div>
                <div class="message-card-text">${m.message}</div>
                <div class="mt-2 text-xs text-white/40">${m.email} | ${m.phone}</div>
              </div>
              `).join('');
    }
  },

              // 5. Settings Page
              initSettingsPage() {
                this.updateSidebarCounts();

              const form = document.getElementById('settings-form');
              if (form) {
      const settings = DataManager.getSettings();
              document.getElementById('phone').value = settings.phone || '0555 013 7647';
              document.getElementById('address').value = settings.address || 'Nusaybin, Mardin';
      
      form.addEventListener('submit', async (e) => {
                e.preventDefault();
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
  },

              // 6. Sahibinden İçe Aktarma
              initSahibindenImporter() {
    const urlInput = document.getElementById('sahibinden-url');
              const fetchBtn = document.getElementById('sahibinden-fetch-btn');
              const parseBtn = document.getElementById('sahibinden-parse-btn');
              const htmlInput = document.getElementById('sahibinden-html');
              const loadingEl = document.getElementById('sahibinden-loading');
              const successEl = document.getElementById('sahibinden-success');
              const errorEl = document.getElementById('sahibinden-error');
              const errorText = document.getElementById('sahibinden-error-text');
              const errorTip = document.getElementById('sahibinden-error-tip');
              const pasteSection = document.getElementById('sahibinden-paste-section');

              if (!fetchBtn) return;

    const hideAlerts = () => {
                loadingEl?.classList.add('hidden');
              successEl?.classList.add('hidden');
              errorEl?.classList.add('hidden');
    };

    const showLoading = () => {
                hideAlerts();
              loadingEl?.classList.remove('hidden');
              fetchBtn.disabled = true;
    };

    const showSuccess = () => {
                hideAlerts();
              successEl?.classList.remove('hidden');
              fetchBtn.disabled = false;
    };

    const showError = (msg, tip, openPaste) => {
                hideAlerts();
              errorEl?.classList.remove('hidden');
              if (errorText) errorText.textContent = msg;
              if (errorTip) errorTip.textContent = tip || '';
              fetchBtn.disabled = false;
              if (openPaste && pasteSection) {
                pasteSection.open = true;
      }
    };

    const fillFormWithData = (data) => {
      const titleEl = document.getElementById('title');
              if (titleEl && data.title) titleEl.value = data.title;

              const priceEl = document.getElementById('price');
              if (priceEl && data.price) priceEl.value = data.price;

              const typeEl = document.getElementById('type');
              if (typeEl && data.type) typeEl.value = data.type;

              const categoryEl = document.getElementById('category');
              if (categoryEl && data.category) categoryEl.value = data.category;

              const cityEl = document.getElementById('city');
              if (cityEl && data.city) cityEl.value = data.city;

              const neighborhoodEl = document.getElementById('neighborhood');
              if (neighborhoodEl && data.neighborhood) neighborhoodEl.value = data.neighborhood;

              const roomsEl = document.getElementById('rooms');
              if (roomsEl && data.rooms) {
        const options = Array.from(roomsEl.options).map(o => o.value);
              if (options.includes(data.rooms)) {
                roomsEl.value = data.rooms;
        } else {
          const roomMap = {
                '1+0': '1+0', '1+1': '1+1', '2+1': '2+1', '3+1': '3+1', '4+1': '4+1',
              '2+0': '2+1', '3+0': '3+1', '4+0': '4+1', '5+1': '5+1', '5+2': '5+1',
              '6+1': '5+1', '6+2': '5+1', '7+1': '5+1'
          };
              roomsEl.value = roomMap[data.rooms] || '-';
        }
      }

              const areaEl = document.getElementById('area');
              if (areaEl && data.area) areaEl.value = data.area;

              const floorEl = document.getElementById('floor');
              if (floorEl && data.floor) floorEl.value = data.floor;

              const descEl = document.getElementById('description');
              if (descEl && data.description) descEl.value = data.description;

              const featEl = document.getElementById('features');
      if (featEl && data.features && data.features.length > 0) {
                featEl.value = data.features.join(', ');
      }

      // Images
      if (data.images && data.images.length > 0) {
        const imageBase64 = document.getElementById('imageBase64');
              const imagePreview = document.getElementById('imagePreview');
              const imageInput = document.getElementById('image');
              if (imageBase64) {
                imageBase64.value = data.images[0];
              if (imagePreview) {
                imagePreview.src = data.images[0];
              imagePreview.classList.remove('hidden');
          }
              if (imageInput) imageInput.removeAttribute('required');
        }

        if (data.images.length > 1) {
          const extraImages = data.images.slice(1);
              const extraBase64 = document.getElementById('extraImagesBase64');
              const extraPreview = document.getElementById('extraImagesPreview');
              if (extraBase64) {
                extraBase64.value = JSON.stringify(extraImages);
          }
              if (extraPreview) {
                extraPreview.innerHTML = extraImages.map(url =>
                  `<img src="${url}" class="h-16 w-16 object-cover rounded-lg border border-white/20">`
                ).join('');
          }
        }
      }

      // Highlight changed fields briefly
      document.querySelectorAll('#listing-form input, #listing-form select, #listing-form textarea').forEach(el => {
        if (el.value && el.type !== 'hidden' && el.type !== 'checkbox' && el.type !== 'file') {
                el.style.transition = 'border-color 0.3s, box-shadow 0.3s';
              el.style.borderColor = 'rgb(245, 158, 11)';
              el.style.boxShadow = '0 0 0 2px rgba(245, 158, 11, 0.15)';
          setTimeout(() => {
                el.style.borderColor = '';
              el.style.boxShadow = '';
          }, 2000);
        }
      });
    };

    // URL fetch mode
    fetchBtn.addEventListener('click', async () => {
      const url = urlInput?.value?.trim();
              if (!url) {
                showError('Lütfen bir Sahibinden ilan URL\'si girin.', '');
              return;
      }
              if (!url.includes('sahibinden.com')) {
                showError('Lütfen geçerli bir Sahibinden.com bağlantısı girin.', '');
              return;
      }

              showLoading();

              try {
        const apiBase = (window.location.protocol === 'http:' || window.location.protocol === 'https:')
              ? ''
              : 'http://localhost:3000';

              const response = await fetch(`${apiBase}/api/scrape-sahibinden`, {
                method: 'POST',
              headers: {'Content-Type': 'application/json' },
              body: JSON.stringify({url})
        });

              const result = await response.json();

              if (result.success && result.data) {
                fillFormWithData(result.data);
              showSuccess();
        } else {
                showError(
                  result.error || 'Veriler çekilemedi.',
                  result.tip || '',
                  result.blocked
                );
        }
      } catch (err) {
                showError(
                  'Sunucuya bağlanılamadı: ' + err.message,
                  'Sunucunuzun çalıştığından emin olun veya HTML yapıştırma modunu deneyin.',
                  true
                );
      }
    });

    // HTML paste mode (Dual: Server-side API with Client-side DOMParser Fallback)
    parseBtn?.addEventListener('click', async () => {
      const html = htmlInput?.value?.trim();
              if (!html || html.length < 50) {
                showError('Lütfen geçerli bir HTML içeriği veya sayfa kaynağı yapıştırın.', 'Minimum 50 karakter gereklidir.');
              return;
      }

              showLoading();

              try {
        const apiBase = (window.location.protocol === 'http:' || window.location.protocol === 'https:')
              ? ''
              : 'http://localhost:3000';

              const response = await fetch(`${apiBase}/api/scrape-sahibinden`, {
                method: 'POST',
              headers: {'Content-Type': 'application/json' },
              body: JSON.stringify({html})
        }).catch(() => null);

              if (response && response.ok) {
          const result = await response.json();
          if (result.success && result.data && (result.data.title || result.data.images.length > 0)) {
                fillFormWithData(result.data);
              showSuccess();
              return;
          }
        }

              // Client-side Browser Fallback if API unavailable or partial result
              const clientData = parseSahibindenHTMLClientSide(html);
        if (clientData && (clientData.title || clientData.price || clientData.images.length > 0)) {
                fillFormWithData(clientData);
              showSuccess();
        } else {
                showError('HTML içeriğinden ilan verileri çıkarılamadı.', 'Sayfa kaynağının tamamını (Ctrl+A -> Ctrl+C) kopyaladığınızdan emin olun.');
        }
      } catch (err) {
        // Fallback to client-side parsing
        const clientData = parseSahibindenHTMLClientSide(html);
        if (clientData && (clientData.title || clientData.images.length > 0)) {
                fillFormWithData(clientData);
              showSuccess();
        } else {
                showError('Hata oluştu: ' + err.message, 'Sayfa kaynağını tekrar kopyalayıp deneyin.');
        }
      }
    });

    function parseSahibindenHTMLClientSide(html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const result = {
        title: '', price: 0, type: 'satilik', category: 'daire',
        city: 'Mardin, Nusaybin', neighborhood: '', rooms: '-', area: 0, floor: '',
        description: '', features: [], images: []
      };

      // 1. Title
      const titleEl = doc.querySelector('h1.classifiedDetailTitle, div.classifiedDetailTitle h1, [class*="classifiedDetailTitle"], h1');
      let rawTitle = titleEl ? titleEl.textContent.trim() : '';
      if (!rawTitle) {
        const ogTitle = doc.querySelector('meta[property="og:title"]');
        if (ogTitle) rawTitle = ogTitle.getAttribute('content') || '';
      }
      if (!rawTitle) {
        const tEl = doc.querySelector('title');
        if (tEl) rawTitle = tEl.textContent.trim();
      }
      result.title = rawTitle.replace(/\s*-\s*Satılık.*$/i, '').replace(/\s*-\s*Kiralık.*$/i, '').replace(/\s*-\s*sahibinden.*$/i, '').trim();

      // 2. Price
      const priceEl = doc.querySelector('div.classifiedInfo h3, [class*="classifiedInfo"] h3, div.classified-price-container, [class*="price"]');
      let priceText = priceEl ? priceEl.textContent.trim() : '';
      if (!priceText) {
        const match = html.match(/([\d\.\,\s]+)\s*(?:TL|₺)/i);
        if (match) priceText = match[1];
      }
      if (priceText) {
        result.price = parseInt(priceText.replace(/[^\d]/g, ''), 10) || 0;
      }

      // 3. Info Map
      const infoMap = {};
      doc.querySelectorAll('ul.classifiedInfoList li, ul[class*="classifiedInfoList"] li, div.classified-table ul li').forEach(el => {
        const strong = el.querySelector('strong, b, span.title');
        const span = el.querySelector('span.txt, span.value, span:not(:has(strong))');
        if (strong) {
          const key = strong.textContent.trim().toLowerCase();
          let val = span ? span.textContent.trim() : '';
          if (!val || val === strong.textContent.trim()) {
            val = el.textContent.replace(strong.textContent, '').trim();
          }
          if (key && val) infoMap[key] = val;
        }
      });

      Object.keys(infoMap).forEach(key => {
        const val = infoMap[key];
        if ((key.includes('oda') || key.includes('salon')) && (result.rooms === '-' || !result.rooms)) result.rooms = val;
        if ((key.includes('m² (brüt)') || key.includes('m²') || key.includes('metrekare')) && !result.area) {
          const p = parseInt(val.replace(/[^\d]/g, ''), 10);
          if (p) result.area = p;
        }
        if (key.includes('kat') && !key.includes('sayısı') && !result.floor) result.floor = val;
        if ((key.includes('mahalle') || key.includes('semt')) && !result.neighborhood) result.neighborhood = val;
        if ((key.includes('il / ilçe') || key.includes('ilçe') || key.includes('şehir')) && (!result.city || result.city === 'Mardin, Nusaybin')) result.city = val.replace('/', ',');
      });

      // 4. Type & Category
      const fullText = (result.title + ' ' + html).toLowerCase();
      if (fullText.includes('kiralık') || fullText.includes('kiralik')) result.type = 'kiralik';
      else result.type = 'satilik';

      if (fullText.includes('arsa') || fullText.includes('tarla')) result.category = 'arsa';
      else if (fullText.includes('müstakil') || fullText.includes('villa')) result.category = 'mustakil';
      else if (fullText.includes('iş yeri') || fullText.includes('dükkan') || fullText.includes('ofis')) result.category = 'isyeri';

      // 5. Breadcrumb Locations Filter
      const breadcrumbElements = [];
      doc.querySelectorAll('div.breadcrumb-container a, nav.breadcrumb a, [class*="breadcrumb"] a').forEach(el => {
        const txt = el.textContent.trim();
        if (txt) breadcrumbElements.push(txt);
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

      if (!result.city) result.city = 'Mardin, Nusaybin';
      if (!result.neighborhood && infoMap['mahalle']) result.neighborhood = infoMap['mahalle'];

      // 6. Description
      const descEl = doc.querySelector('div#classifiedDescription, div[class*="classifiedDescription"], section.description');
      if (descEl) result.description = descEl.textContent.replace(/\s+/g, ' ').trim();

      // 7. Features
      doc.querySelectorAll('ul.classifiedFeaturesList li span, ul[class*="feature"] li span').forEach(el => {
        const txt = el.textContent.trim();
        if (txt && !result.features.includes(txt)) result.features.push(txt);
      });

      // 8. Images
      const imageSet = new Set();
      doc.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]').forEach(el => {
        const content = el.getAttribute('content');
        if (content && !content.includes('placeholder') && !content.includes('logo')) {
          imageSet.add(content.startsWith('//') ? 'https:' + content : content);
        }
      });

      doc.querySelectorAll('img').forEach(el => {
        let src = el.getAttribute('data-src') || el.getAttribute('src') || '';
        if (src && (src.includes('shbdn.com/photos/') || src.includes('/photos/')) && !src.includes('placeholder') && !src.includes('logo')) {
          if (src.startsWith('//')) src = 'https:' + src;
          let highRes = src.replace(/\/thmb\//, '/x5/').replace(/_thmb\./, '.').replace(/_s\./, '_x5.');
          imageSet.add(highRes);
        }
      });

      const cdnRegex = /(?:https?:)?\/\/[a-z0-9]+\.shbdn\.com\/photos\/[^\s"'<>\\]+/gi;
      const matches = html.match(cdnRegex) || [];
      matches.forEach(rawUrl => {
        let url = rawUrl.startsWith('//') ? 'https:' + rawUrl : rawUrl;
        url = url.replace(/['"\\;,\]\)]+$/g, '');
        if (!url.includes('placeholder') && !url.includes('logo')) {
          let highRes = url.replace(/\/thmb\//, '/x5/').replace(/_thmb\./, '.').replace(/_s\./, '_x5.');
          imageSet.add(highRes);
        }
      });

      result.images = [...imageSet];
      return result;
    }

    // Allow Enter key in URL input
    urlInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
                  e.preventDefault();
                fetchBtn.click();
      }
    });
  }
};
