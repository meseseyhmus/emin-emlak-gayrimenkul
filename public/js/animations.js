/* =============================================
   EMIN EMLAK - Animations Engine
   IntersectionObserver + Scroll Effects
   ============================================= */

const Animations = {
  init() {
    this.initScrollReveal();
    this.initScrollProgress();
    this.initBackToTop();
    this.initCounters();
    this.initSpotlightCards();
    this.initParallax();
  },

  // Scroll Reveal with IntersectionObserver
  initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children');
    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Don't unobserve to allow re-trigger if needed
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(el => observer.observe(el));
  },

  // Scroll Progress Bar
  initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.style.width = '0%';
    document.body.appendChild(bar);

    window.addEventListener('scroll', Utils.throttle(() => {
      const winH = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / winH) * 100;
      bar.style.width = scrolled + '%';
    }, 16));
  },

  // Back to Top Button
  initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.innerHTML = Utils.icons.chevronUp;
    btn.setAttribute('aria-label', 'Yukarı çık');
    document.body.appendChild(btn);

    window.addEventListener('scroll', Utils.throttle(() => {
      if (window.scrollY > 400) btn.classList.add('visible');
      else btn.classList.remove('visible');
    }, 100));

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  },

  // Counter Animation
  initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          entry.target.dataset.counted = 'true';
          this.animateCounter(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  },

  animateCounter(el) {
    const target = parseInt(el.dataset.counter);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const duration = 2000;
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = prefix + new Intl.NumberFormat('tr-TR').format(current) + suffix;

      if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  },

  // Spotlight Card Effect (mouse follow gradient)
  initSpotlightCards() {
    const cards = document.querySelectorAll('.spotlight-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--spotlight-x', x + 'px');
        card.style.setProperty('--spotlight-y', y + 'px');
        if (card.querySelector('::before') !== null) {
          card.style.setProperty('--mouse-x', x + 'px');
          card.style.setProperty('--mouse-y', y + 'px');
        }
      });
    });

    // Apply CSS for spotlight position
    const style = document.createElement('style');
    style.textContent = `
      .spotlight-card::before {
        left: var(--spotlight-x, 50%);
        top: var(--spotlight-y, 50%);
      }
    `;
    document.head.appendChild(style);
  },

  // Parallax effect
  initParallax() {
    const parallaxEls = document.querySelectorAll('[data-parallax]');
    if (!parallaxEls.length) return;

    window.addEventListener('scroll', Utils.throttle(() => {
      const scrollY = window.scrollY;
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0.3;
        const rect = el.getBoundingClientRect();
        const offset = (rect.top + scrollY) * speed;
        el.style.transform = `translateY(${scrollY * speed - offset}px)`;
      });
    }, 16));
  },

  // Typing effect
  typeText(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';
    const type = () => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      }
    };
    type();
  },

  // Number ticker
  ticker(element, from, to, duration = 2000) {
    const startTime = performance.now();
    const update = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.round(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }
};
