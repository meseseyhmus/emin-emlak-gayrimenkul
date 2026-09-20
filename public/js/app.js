const App = {
  getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  },

  initFiltersFromUrl() {
    const type = this.getParam('type');
    const category = this.getParam('category');
    if (type) { const s = document.getElementById('filterType'); if (s) s.value = type; }
    if (category) { const s = document.getElementById('filterCategory'); if (s) s.value = category; }
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
              <img loading="lazy" src="${imgUrl}" alt="" class="h-full w-full object-cover" onerror="this.onerror=null; this.src='${Utils.placeholderImage(600, 400, l.rooms || 'Emlak')}';">
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

    if (sort === 'price_asc') listings.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') listings.sort((a, b) => b.price - a.price);
    else listings.sort((a, b) => b.id - a.id);

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
              <img loading="lazy" src="${imgUrl}" alt="" class="h-full w-full object-cover" onerror="this.onerror=null; this.src='${Utils.placeholderImage(400, 300, l.rooms || 'Emlak')}';">
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

    // Image Gallery & Slider
    const imageList = [];
    if (listing.image) imageList.push(listing.image);
    if (Array.isArray(listing.images)) {
      listing.images.forEach(img => {
        if (img && !imageList.includes(img)) imageList.push(img);
      });
    }
    if (Array.isArray(listing.imageUrls)) {
      listing.imageUrls.forEach(img => {
        if (img && !imageList.includes(img)) imageList.push(img);
      });
    }

    if (imageList.length === 0) {
      imageList.push(Utils.placeholderImage(800, 600, listing.rooms));
    }

    window.sliderImages = imageList;
    window.currentSlideIndex = 0;

    let galleryHTML = `
      <div class="relative overflow-hidden rounded-xl bg-navy-deep shadow-xl border border-graphite/40">
        <!-- Main Image View -->
        <div class="relative aspect-[4/3] sm:aspect-auto sm:h-[480px] md:h-[580px] lg:h-[620px] w-full overflow-hidden flex items-center justify-center bg-black/90 group">
          <img id="slider-main-img" 
               src="${imageList[0]}" 
               alt="${Utils.sanitize(listing.title)}" 
               class="h-full w-full object-contain transition-opacity duration-300 select-none cursor-pointer"
               onclick="App.openLightbox(window.currentSlideIndex)"
               onerror="this.onerror=null; this.src='${Utils.placeholderImage(800, 600, listing.rooms)}'">

          <!-- Navigation Controls -->
          ${imageList.length > 1 ? `
            <button onclick="App.prevSlide()" 
                    class="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-navy/80 text-white border border-white/20 backdrop-blur-md transition-all duration-200 hover:bg-mint hover:text-navy hover:scale-110 shadow-lg"
                    aria-label="Önceki Fotoğraf">
              <iconify-icon icon="lucide:chevron-left" class="text-2xl sm:text-3xl pointer-events-none"></iconify-icon>
            </button>

            <button onclick="App.nextSlide()" 
                    class="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-navy/80 text-white border border-white/20 backdrop-blur-md transition-all duration-200 hover:bg-mint hover:text-navy hover:scale-110 shadow-lg"
                    aria-label="Sonraki Fotoğraf">
              <iconify-icon icon="lucide:chevron-right" class="text-2xl sm:text-3xl pointer-events-none"></iconify-icon>
            </button>
          ` : ''}

          <!-- Top Overlay Controls -->
          <div class="absolute top-4 right-4 z-20 flex items-center gap-2.5">
            <span id="slider-counter" class="rounded-full bg-navy/90 px-4 py-1.5 font-brand text-xs uppercase tracking-wider text-mint border border-mint/40 backdrop-blur-md shadow-md font-bold">
              1 / ${imageList.length} Fotoğraf
            </span>
            <button onclick="App.openLightbox(window.currentSlideIndex)" class="flex h-9 w-9 items-center justify-center rounded-full bg-navy/90 text-white border border-white/20 backdrop-blur-md transition hover:bg-mint hover:text-navy shadow-md" title="Tam Ekran Büyüt">
              <iconify-icon icon="lucide:maximize-2" class="text-base pointer-events-none"></iconify-icon>
            </button>
          </div>
        </div>

        <!-- Thumbnail Navigation Strip -->
        ${imageList.length > 1 ? `
          <div class="bg-navy/95 p-3 border-t border-graphite/40 overflow-x-auto custom-scrollbar flex gap-2.5 items-center scroll-smooth" id="slider-thumbnails">
            ${imageList.map((img, i) => `
              <button onclick="App.goToSlide(${i})" 
                      id="thumb-${i}"
                      class="relative h-16 w-24 sm:h-20 sm:w-28 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all duration-200 ${i === 0 ? 'border-mint scale-105 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'}">
                <img src="${img}" class="h-full w-full object-cover" loading="lazy" onerror="this.onerror=null; this.src='${Utils.placeholderImage(400, 300, listing.rooms)}'">
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    const galleryGrid = document.getElementById('detail-images-grid');
    if (galleryGrid) {
      galleryGrid.className = 'mx-auto max-w-[1440px] reveal delay-1';
      galleryGrid.innerHTML = galleryHTML;
    }

    // Video Section
    const videoSection = document.getElementById('detail-video-section');
    if (videoSection) {
      if (listing.videoUrl) {
        let embedUrl = listing.videoUrl;
        if (embedUrl.includes('youtube.com/watch?v=')) {
          embedUrl = embedUrl.replace('watch?v=', 'embed/');
        } else if (embedUrl.includes('youtu.be/')) {
          embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
        } else if (embedUrl.includes('drive.google.com/file/d/')) {
          embedUrl = embedUrl.replace(/\/view.*$/, '/preview');
        }

        videoSection.classList.remove('hidden');
        if (embedUrl.startsWith('data:video/')) {
          document.getElementById('detail-video-container').innerHTML = `
            <video class="w-full aspect-video rounded-xl" controls controlsList="nodownload">
              <source src="${embedUrl}" type="video/mp4">
              Tarayıcınız video etiketini desteklemiyor.
            </video>
          `;
        } else {
          document.getElementById('detail-video-container').innerHTML = `
            <iframe class="w-full aspect-video rounded-xl" src="${embedUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
          `;
        }
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
            <img src="${l.image || Utils.placeholderImage(400, 300, l.rooms)}" class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]">
          </div>
          <div class="p-5">
            <h3 class="font-brand text-[14px] uppercase tracking-[0.023em] text-navy">${Utils.sanitize(l.title)}</h3>
            <p class="mt-2 font-brand text-[12px] uppercase tracking-[0.023em] text-steel">${l.rooms || '-'} · ${l.area || l.squareMeters || '-'} m²</p>
            <strong class="mt-3 block font-brand text-[16px] tracking-[0.023em] text-mint-dark">₺ ${Utils.formatPriceShort(l.price)}</strong>
          </div>
        </a>
      `).join('');
    }
  },

  // ── Slider Methods ──
  goToSlide(index) {
    if (!window.sliderImages || window.sliderImages.length === 0) return;
    if (index < 0) index = window.sliderImages.length - 1;
    if (index >= window.sliderImages.length) index = 0;

    window.currentSlideIndex = index;
    const mainImg = document.getElementById('slider-main-img');
    const counter = document.getElementById('slider-counter');

    if (mainImg) {
      mainImg.style.opacity = '0.3';
      setTimeout(() => {
        mainImg.src = window.sliderImages[index];
        mainImg.style.opacity = '1';
      }, 120);
    }

    if (counter) {
      counter.textContent = `${index + 1} / ${window.sliderImages.length} Fotoğraf`;
    }

    window.sliderImages.forEach((_, i) => {
      const thumb = document.getElementById(`thumb-${i}`);
      if (thumb) {
        if (i === index) {
          thumb.className = 'relative h-16 w-24 sm:h-20 sm:w-28 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all duration-200 border-mint scale-105 shadow-md';
          thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          thumb.className = 'relative h-16 w-24 sm:h-20 sm:w-28 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all duration-200 border-transparent opacity-50 hover:opacity-100';
        }
      }
    });
  },

  nextSlide() {
    this.goToSlide((window.currentSlideIndex || 0) + 1);
  },

  prevSlide() {
    this.goToSlide((window.currentSlideIndex || 0) - 1);
  },

  openLightbox(index) {
    let modal = document.getElementById('lightbox-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'lightbox-modal';
      modal.className = 'fixed inset-0 z-[100] flex flex-col justify-between bg-black/95 p-4 sm:p-6 backdrop-blur-xl transition-all duration-300';
      modal.innerHTML = `
        <div class="flex w-full items-center justify-between font-brand text-sm uppercase tracking-wider text-white border-b border-white/10 pb-3">
          <span id="lightbox-counter" class="text-mint font-bold text-base">1 / 1</span>
          <button onclick="App.closeLightbox()" class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-red-500 hover:text-white" title="Kapat">
            <iconify-icon icon="lucide:x" class="text-2xl pointer-events-none"></iconify-icon>
          </button>
        </div>
        <div class="relative flex h-[82vh] w-full items-center justify-center my-auto">
          <button onclick="App.lightboxPrev()" class="absolute left-2 sm:left-6 z-10 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-black/70 text-white border border-white/20 transition hover:bg-mint hover:text-navy shadow-2xl">
            <iconify-icon icon="lucide:chevron-left" class="text-3xl sm:text-4xl pointer-events-none"></iconify-icon>
          </button>
          <img id="lightbox-img" src="" class="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-all duration-300 select-none">
          <button onclick="App.lightboxNext()" class="absolute right-2 sm:right-6 z-10 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-black/70 text-white border border-white/20 transition hover:bg-mint hover:text-navy shadow-2xl">
            <iconify-icon icon="lucide:chevron-right" class="text-3xl sm:text-4xl pointer-events-none"></iconify-icon>
          </button>
        </div>
      `;
      document.body.appendChild(modal);
    }

    window.lightboxIndex = index || 0;
    this.updateLightbox();
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  updateLightbox() {
    const img = document.getElementById('lightbox-img');
    const counter = document.getElementById('lightbox-counter');
    if (img && window.sliderImages) {
      img.src = window.sliderImages[window.lightboxIndex];
    }
    if (counter && window.sliderImages) {
      counter.textContent = `${window.lightboxIndex + 1} / ${window.sliderImages.length} Fotoğraf`;
    }
  },

  lightboxNext() {
    if (!window.sliderImages) return;
    window.lightboxIndex = (window.lightboxIndex + 1) % window.sliderImages.length;
    this.updateLightbox();
    this.goToSlide(window.lightboxIndex);
  },

  lightboxPrev() {
    if (!window.sliderImages) return;
    window.lightboxIndex = (window.lightboxIndex - 1 + window.sliderImages.length) % window.sliderImages.length;
    this.updateLightbox();
    this.goToSlide(window.lightboxIndex);
  },

  closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
};

// Global Keyboard Navigation for Slider & Lightbox
document.addEventListener('keydown', (e) => {
  const lightbox = document.getElementById('lightbox-modal');
  if (lightbox && !lightbox.classList.contains('hidden')) {
    if (e.key === 'ArrowLeft') App.lightboxPrev();
    if (e.key === 'ArrowRight') App.lightboxNext();
    if (e.key === 'Escape') App.closeLightbox();
  } else if (document.getElementById('slider-main-img')) {
    if (e.key === 'ArrowLeft') App.prevSlide();
    if (e.key === 'ArrowRight') App.nextSlide();
  }
});
