const App = {
  getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  },

  initFiltersFromUrl() {
    const type = this.getParam('type');
    const category = this.getParam('category');
    if(type) { const s = document.getElementById('filterType'); if(s) s.value = type; }
    if(category) { const s = document.getElementById('filterCategory'); if(s) s.value = category; }
  },

  // ── Featured Listings (index.html) — 3-column grid ──
  renderTailwindFeaturedListings() {
    const container = document.getElementById('featuredListings');
    if (!container) return;

    const listings = DataManager.getAllListings()
      .filter(l => l.status === 'active' && l.featured)
      .slice(0, 6);

    if (listings.length === 0) {
      container.innerHTML = '<p class="font-body text-[14px] text-white/40 col-span-3">Öne çıkan ilan bulunamadı.</p>';
      return;
    }

    container.innerHTML = listings.map((l, idx) => {
      const imgUrl = l.image || Utils.placeholderImage(600, 400, l.rooms);
      const badge = l.type === 'satilik'
        ? '<span class="absolute left-0 top-0 bg-mint px-3 py-1.5 font-brand text-[10px] uppercase tracking-[0.023em] text-navy font-bold">SATILIK</span>'
        : '<span class="absolute left-0 top-0 bg-white px-3 py-1.5 font-brand text-[10px] uppercase tracking-[0.023em] text-navy font-bold">KİRALIK</span>';

      const locationStr = Utils.getLocationText(l.location);

      return `
        <article class="listing group relative overflow-hidden bg-navy-deep reveal ${idx > 0 ? 'delay-1' : ''}">
          <a href="ilan-detay.html?id=${l.id}" class="block">
            <div class="relative h-64 overflow-hidden">
              <img loading="lazy" src="${imgUrl}" alt="${Utils.sanitize(l.title)}" class="h-full w-full object-cover">
              ${badge}
            </div>
            <div class="p-6">
              <h3 class="font-brand text-[18px] uppercase tracking-[0.023em] text-white leading-[1.4]">${Utils.sanitize(l.title)}</h3>
              <p class="mt-2 font-body text-[12px] text-white/40 flex items-center gap-1"><iconify-icon icon="lucide:map-pin"></iconify-icon> ${Utils.sanitize(locationStr)}</p>
              <div class="mt-4 flex items-center justify-between border-t border-graphite/40 pt-4">
                <strong class="font-brand text-[18px] tracking-[0.023em] text-mint">₺${Number(l.price).toLocaleString('tr-TR')}</strong>
                <span class="font-brand text-[12px] uppercase tracking-[0.023em] text-white/35">${l.rooms || '-'} · ${l.area || l.squareMeters || '-'} m²</span>
              </div>
            </div>
          </a>
        </article>
      `;
    }).join('');
  },

  // ── Listings Grid (ilanlar.html, satilik.html, kiralik.html) ──
  renderTailwindListings() {
    const container = document.getElementById('listingsGrid');
    if (!container) return;

    let listings = DataManager.getAllListings().filter(l => l.status === 'active');

    const filterType = document.getElementById('filterType')?.value;
    const filterCategory = document.getElementById('filterCategory')?.value;
    const filterRooms = document.getElementById('filterRooms')?.value;
    const filterPrice = parseInt(document.getElementById('filterPrice')?.value || 20000000);
    const searchInput = document.getElementById('searchInput')?.value.toLowerCase().trim();
    const sort = document.getElementById('sort-listings')?.value || 'newest';

    if (filterType) listings = listings.filter(l => l.type === filterType);
    if (filterCategory) listings = listings.filter(l => l.category === filterCategory);
    if (filterRooms) listings = listings.filter(l => l.rooms === filterRooms);
    if (filterPrice < 20000000) listings = listings.filter(l => l.price <= filterPrice);
    if (searchInput) listings = listings.filter(l => {
      const locStr = Utils.getLocationText(l.location).toLowerCase();
      const titleMatch = l.title ? l.title.toLowerCase().includes(searchInput) : false;
      const featMatch = Array.isArray(l.features) ? l.features.some(f => String(f).toLowerCase().includes(searchInput)) : false;
      return titleMatch || locStr.includes(searchInput) || featMatch;
    });

    if (sort === 'price_asc') listings.sort((a,b) => a.price - b.price);
    else if (sort === 'price_desc') listings.sort((a,b) => b.price - a.price);
    else listings.sort((a,b) => b.id - a.id);

    const countEl = document.getElementById('resultsCount');
    if (countEl) countEl.textContent = `${listings.length} İlan Bulundu`;

    if (listings.length === 0) {
      container.innerHTML = '<div class="col-span-1 md:col-span-3 text-center py-16 font-brand text-[16px] uppercase tracking-[0.023em] text-steel">Arama kriterlerinize uygun ilan bulunamadı.</div>';
      return;
    }

    container.innerHTML = listings.map((l, idx) => {
      const imgUrl = l.image || Utils.placeholderImage(400, 300, l.rooms);
      const badge = l.type === 'satilik'
        ? '<span class="absolute left-0 top-0 bg-mint px-3 py-1.5 font-brand text-[10px] uppercase tracking-[0.023em] text-navy">SATILIK</span>'
        : '<span class="absolute left-0 top-0 bg-navy px-3 py-1.5 font-brand text-[10px] uppercase tracking-[0.023em] text-white">KİRALIK</span>';

      const locationStr = Utils.getLocationText(l.location);

      return `
        <article class="listing reveal group overflow-hidden border border-ash/40 transition">
          <a href="ilan-detay.html?id=${l.id}" class="block">
            <div class="relative h-56 overflow-hidden">
              <img loading="lazy" src="${imgUrl}" alt="${Utils.sanitize(l.title)}" class="h-full w-full object-cover">
              ${badge}
            </div>
            <div class="p-6">
              <div class="flex items-start justify-between gap-3">
                <h3 class="font-brand text-[16px] uppercase tracking-[0.023em] text-navy leading-[1.4]">${Utils.sanitize(l.title)}</h3>
                <strong class="whitespace-nowrap font-brand text-[16px] tracking-[0.023em] text-mint-dark">₺${Utils.formatPriceShort(l.price)}</strong>
              </div>
              <p class="mt-2 flex items-center gap-1 font-body text-[12px] text-steel">
                <iconify-icon icon="lucide:map-pin"></iconify-icon> ${Utils.sanitize(locationStr)}
              </p>
              <div class="mt-5 flex gap-4 border-t border-ash/30 pt-4 font-brand text-[12px] uppercase tracking-[0.023em] text-steel">
                ${l.rooms && l.rooms !== '-' ? `<span>${l.rooms}</span>` : ''}
                <span>${l.area || l.squareMeters || '-'} m²</span>
                ${l.floor ? `<span>Kat: ${Utils.sanitize(l.floor)}</span>` : ''}
              </div>
            </div>
          </a>
        </article>
      `;
    }).join('');
  },

  // ── Detail Page (ilan-detay.html) ──
  renderTailwindDetail() {
    const id = this.getParam('id');
    const listing = DataManager.getListing(id);
    if (!listing) {
      document.body.innerHTML = '<div class="flex h-screen items-center justify-center bg-navy font-brand text-[32px] uppercase tracking-[0.023em] text-white">İlan Bulunamadı</div>';
      return;
    }

    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.classList.remove('hidden');

    const catName = listing.category ? (listing.category.charAt(0).toUpperCase() + listing.category.slice(1)) : 'Gayrimenkul';
    const typeCat = `${listing.type === 'satilik' ? 'Satılık' : 'Kiralık'} · ${catName}`;
    const locationStr = Utils.getLocationText(listing.location);

    if (document.getElementById('detail-type-cat')) document.getElementById('detail-type-cat').textContent = typeCat;
    if (document.getElementById('detail-title')) document.getElementById('detail-title').textContent = listing.title;
    if (document.getElementById('detail-location')) document.getElementById('detail-location').textContent = locationStr;
    if (document.getElementById('detail-id')) document.getElementById('detail-id').textContent = `İlan No: EE-${listing.id}`;
    if (document.getElementById('detail-desc')) document.getElementById('detail-desc').textContent = listing.description || 'Açıklama bulunmuyor.';

    if (document.getElementById('detail-aside-type')) document.getElementById('detail-aside-type').textContent = listing.type === 'satilik' ? 'Satılık' : 'Kiralık';
    if (document.getElementById('detail-price')) document.getElementById('detail-price').textContent = `₺ ${Number(listing.price).toLocaleString('tr-TR')}`;

    if (listing.featured && document.getElementById('detail-badge')) {
      document.getElementById('detail-badge').classList.remove('hidden');
    }

    const settings = DataManager.getSettings();
    const phone = settings.phone || '0555 013 7647';
    const phoneClean = phone.replace(/\s+/g, '');
    
    const waLink = document.getElementById('whatsapp-agent-link');
    if (waLink) waLink.href = `https://wa.me/${phoneClean}?text=${encodeURIComponent(listing.title + ' ilanı ile ilgili bilgi almak istiyorum.')}`;
    
    const phoneLink = document.getElementById('phone-agent-link');
    if (phoneLink) phoneLink.href = `tel:${phoneClean}`;
    
    if (document.getElementById('aside-phone')) document.getElementById('aside-phone').textContent = phone;

    // Image Gallery
    const mainImg = listing.image || Utils.placeholderImage(800, 600, listing.rooms);
    const extraImages = listing.imageUrls || [];

    let galleryHTML = `
      <div class="group relative overflow-hidden lg:row-span-2">
        <img src="${mainImg}" class="h-full min-h-[390px] w-full object-cover transition duration-700 group-hover:scale-[1.03]" onerror="this.src='${Utils.placeholderImage(800,600,listing.rooms)}'">
      </div>
    `;

    if (extraImages.length > 0) {
      const topExtra = extraImages.slice(0, 2);
      topExtra.forEach(url => {
        galleryHTML += `
          <div class="group relative overflow-hidden hidden lg:block">
            <img src="${url}" class="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]">
          </div>
        `;
      });
    }

    const galleryGrid = document.getElementById('detail-images-grid');
    if (galleryGrid) galleryGrid.innerHTML = galleryHTML;

    // Video Section
    const videoSection = document.getElementById('detail-video-section');
    if (videoSection) {
      if (listing.videoUrl) {
        let embedUrl = listing.videoUrl;
        if (embedUrl.includes('youtube.com/watch?v=')) {
          embedUrl = embedUrl.replace('watch?v=', 'embed/');
        } else if (embedUrl.includes('youtu.be/')) {
          embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
        }

        videoSection.classList.remove('hidden');
        document.getElementById('detail-video-container').innerHTML = `
          <iframe class="w-full aspect-video rounded-xl" src="${embedUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        `;
      } else {
        videoSection.classList.add('hidden');
      }
    }

    // Specs
    const specsEl = document.getElementById('detail-specs');
    if (specsEl) {
      specsEl.innerHTML = `
        <div class="border border-ash/40 p-5"><iconify-icon icon="lucide:door-open" class="text-[24px] text-mint"></iconify-icon><p class="mt-4 font-brand text-[12px] uppercase tracking-[0.023em] text-steel">Oda Sayısı</p><strong class="mt-1 block font-brand text-[18px] uppercase tracking-[0.023em] text-navy">${listing.rooms || '-'}</strong></div>
        <div class="border border-ash/40 p-5"><iconify-icon icon="lucide:ruler" class="text-[24px] text-mint"></iconify-icon><p class="mt-4 font-brand text-[12px] uppercase tracking-[0.023em] text-steel">Brüt Alan</p><strong class="mt-1 block font-brand text-[18px] uppercase tracking-[0.023em] text-navy">${listing.area || listing.squareMeters || '-'} m²</strong></div>
        <div class="border border-ash/40 p-5"><iconify-icon icon="lucide:layers-3" class="text-[24px] text-mint"></iconify-icon><p class="mt-4 font-brand text-[12px] uppercase tracking-[0.023em] text-steel">Bulunduğu Kat</p><strong class="mt-1 block font-brand text-[18px] uppercase tracking-[0.023em] text-navy">${listing.floor || '-'}</strong></div>
        <div class="border border-ash/40 p-5"><iconify-icon icon="lucide:badge-check" class="text-[24px] text-mint"></iconify-icon><p class="mt-4 font-brand text-[12px] uppercase tracking-[0.023em] text-steel">Durum</p><strong class="mt-1 block font-brand text-[18px] uppercase tracking-[0.023em] text-navy">${listing.status === 'active' ? 'Aktif' : 'Pasif'}</strong></div>
      `;
    }

    // Features
    const featSection = document.getElementById('detail-features-section');
    const featGrid = document.getElementById('detail-features');
    if (featSection && featGrid) {
      if (listing.features && listing.features.length > 0) {
        featSection.classList.remove('hidden');
        featGrid.innerHTML = listing.features.map(f =>
          `<div class="flex items-center gap-3 font-body text-[14px] text-anvil"><iconify-icon icon="lucide:check" class="text-[18px] text-mint"></iconify-icon> ${Utils.sanitize(f)}</div>`
        ).join('');
      } else {
        featSection.classList.add('hidden');
      }
    }

    // Related Listings
    const relatedGrid = document.getElementById('relatedListingsGrid');
    if (relatedGrid) {
      const related = DataManager.getAllListings().filter(l => l.id != id && l.category === listing.category).slice(0, 4);
      relatedGrid.innerHTML = related.map(l => `
        <a href="ilan-detay.html?id=${l.id}" class="group overflow-hidden border border-ash/40 transition hover:border-mint">
          <div class="relative h-48 overflow-hidden">
            <img src="${l.image || Utils.placeholderImage(400,300,l.rooms)}" class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]">
          </div>
          <div class="p-5">
            <h3 class="font-brand text-[14px] uppercase tracking-[0.023em] text-navy">${Utils.sanitize(l.title)}</h3>
            <p class="mt-2 font-brand text-[12px] uppercase tracking-[0.023em] text-steel">${l.rooms || '-'} · ${l.area || l.squareMeters || '-'} m²</p>
            <strong class="mt-3 block font-brand text-[16px] tracking-[0.023em] text-mint-dark">₺ ${Utils.formatPriceShort(l.price)}</strong>
          </div>
        </a>
      `).join('');
    }
  }
};
