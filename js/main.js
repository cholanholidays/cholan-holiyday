/**
 * CHOLAN HOLIDAYS - Main Interactive & Supabase Dynamic Data Scripts
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Mobile Menu Toggle & Auto-Close
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mainNav = document.querySelector('.main-nav');

  function closeMobileNav() {
    if (mainNav && mainNav.classList.contains('active')) {
      mainNav.classList.remove('active');
      const icon = mobileToggle ? mobileToggle.querySelector('i') : null;
      if (icon) {
        icon.classList.remove('fa-times', 'fa-xmark');
        icon.classList.add('fa-bars');
      }
    }
  }

  if (mobileToggle && mainNav) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      mainNav.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        if (mainNav.classList.contains('active')) {
          icon.classList.remove('fa-bars');
          icon.classList.add('fa-xmark');
        } else {
          icon.classList.remove('fa-xmark', 'fa-times');
          icon.classList.add('fa-bars');
        }
      }
    });

    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });

    document.addEventListener('click', (e) => {
      if (!mainNav.contains(e.target) && !mobileToggle.contains(e.target)) {
        closeMobileNav();
      }
    });
  }

  // 2. Enquiry Modal Dialog Handling
  const modalOverlay = document.getElementById('enquiryModal');
  const closeModalBtn = document.querySelector('.modal-close-btn');
  const modalPackageSelect = document.getElementById('modalPackageSelect');

  function openEnquiryModal(packageName = '') {
    if (modalOverlay) {
      if (modalPackageSelect && packageName) {
        const cleanPkg = packageName.trim().toLowerCase();
        let matchedIndex = -1;

        for (let i = 0; i < modalPackageSelect.options.length; i++) {
          const optText = modalPackageSelect.options[i].text.trim().toLowerCase();
          const optVal = modalPackageSelect.options[i].value.trim().toLowerCase();
          if (
            (optText && (cleanPkg.includes(optText) || optText.includes(cleanPkg))) ||
            (optVal && (cleanPkg.includes(optVal) || optVal.includes(cleanPkg)))
          ) {
            matchedIndex = i;
            break;
          }
        }

        if (matchedIndex !== -1) {
          modalPackageSelect.selectedIndex = matchedIndex;
        } else {
          modalPackageSelect.selectedIndex = 0;
        }
      }
      modalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeEnquiryModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  }

  function attachModalOpenListeners() {
    document.querySelectorAll('.open-enquiry-modal, .btn-enquire').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const packageName = btn.getAttribute('data-package') || '';
        openEnquiryModal(packageName);
      };
    });
  }
  attachModalOpenListeners();

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeEnquiryModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeEnquiryModal();
    });
  }

  // 3. Form Submissions (Enquiry & Contact) Connected to Supabase
  const enquiryForm = document.getElementById('enquiryForm');
  if (enquiryForm) {
    enquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = enquiryForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Submit Enquiry';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
      }

      const name = document.getElementById('modalName')?.value || 'Valued Guest';
      const email = document.getElementById('modalEmail')?.value || '';
      const phone = document.getElementById('modalPhone')?.value || '';
      const pkg = document.getElementById('modalPackageSelect')?.value || 'South India Tour';
      const message = document.getElementById('modalMessage')?.value || '';

      try {
        if (window.CholanAPI) {
          await window.CholanAPI.submitEnquiry({
            name, email, phone, packageName: pkg, message
          });
        }
        alert(`Thank you, ${name}!\n\nYour enquiry for "${pkg}" has been recorded. Our travel specialist will call you at ${phone} shortly.`);
        enquiryForm.reset();
        closeEnquiryModal();
      } catch (err) {
        console.error('Enquiry submission error:', err);
        alert(`Thank you, ${name}! Your enquiry for "${pkg}" has been received.`);
        enquiryForm.reset();
        closeEnquiryModal();
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  }

  const contactPageForm = document.getElementById('contactPageForm');
  if (contactPageForm) {
    contactPageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = contactPageForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Send Message';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
      }

      const name = document.getElementById('contactName')?.value || 'Guest';
      const email = document.getElementById('contactEmail')?.value || '';
      const phone = document.getElementById('contactPhone')?.value || '';
      const packageInterest = document.getElementById('contactPackage')?.value || '';
      const message = document.getElementById('contactMessage')?.value || '';

      try {
        if (window.CholanAPI) {
          await window.CholanAPI.submitContactMessage({
            name, email, phone, packageInterest, message
          });
        }
        alert(`Thank you, ${name}!\n\nWe have received your message and will get back to you at ${email} shortly.`);
        contactPageForm.reset();
      } catch (err) {
        console.error('Contact submission error:', err);
        alert(`Thank you, ${name}! We have received your message.`);
        contactPageForm.reset();
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  }

  // 4. Lightbox Gallery Viewer
  function attachLightboxListeners() {
    document.querySelectorAll('.lightbox-trigger').forEach(item => {
      item.onclick = () => {
        const src = item.getAttribute('data-full') || item.querySelector('img')?.src;
        const title = item.getAttribute('data-title') || 'Cholan Holidays South India Tour';
        if (src) showLightbox(src, title);
      };
    });
  }
  attachLightboxListeners();

  function closeLightbox() {
    const lb = document.getElementById('lightboxViewer');
    if (lb) {
      lb.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }

  function showLightbox(src, title) {
    let lb = document.getElementById('lightboxViewer');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'lightboxViewer';
      lb.style.position = 'fixed';
      lb.style.top = '0';
      lb.style.left = '0';
      lb.style.width = '100vw';
      lb.style.height = '100vh';
      lb.style.backgroundColor = 'rgba(0,0,0,0.92)';
      lb.style.display = 'flex';
      lb.style.flexDirection = 'column';
      lb.style.alignItems = 'center';
      lb.style.justifyContent = 'center';
      lb.style.zIndex = '2000';
      lb.style.padding = '20px';
      lb.innerHTML = `
        <div id="lbInner" style="position:relative; max-width:90%; max-height:85%; text-align:center;">
          <img id="lbImg" src="" style="max-width:100%; max-height:80vh; border-radius:8px; border:2px solid #c6923c; box-shadow:0 10px 40px rgba(0,0,0,0.8);" />
          <p id="lbTitle" style="color:#ffffff; text-align:center; margin-top:12px; font-family:'Playfair Display', serif; font-size:1.1rem; letter-spacing:1px;"></p>
          <button id="lbCloseBtn" style="position:absolute; top:-38px; right:-10px; background:none; border:none; color:#c6923c; font-size:2.2rem; cursor:pointer; line-height:1;" aria-label="Close Lightbox">&times;</button>
        </div>
      `;
      document.body.appendChild(lb);

      lb.addEventListener('click', (e) => {
        if (e.target === lb || e.target.id === 'lbCloseBtn') closeLightbox();
      });
    }

    document.getElementById('lbImg').src = src;
    document.getElementById('lbTitle').textContent = title;
    lb.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  // 5. Global Escape Key Listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeEnquiryModal();
      closeLightbox();
      closeMobileNav();
    }
  });

  // 6. Animated Number Counters (for Stats)
  const statNumbers = document.querySelectorAll('.stat-number');
  let animated = false;
  function animateStats() {
    if (!statNumbers.length) return;
    const triggerBottom = window.innerHeight * 0.9;
    const firstStat = statNumbers[0];
    const statTop = firstStat.getBoundingClientRect().top;

    if (statTop < triggerBottom && !animated) {
      animated = true;
      statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'), 10) || 0;
        const suffix = stat.getAttribute('data-suffix') || '+';
        let count = 0;
        const duration = 2000;
        const increment = target / (duration / 30);
        const timer = setInterval(() => {
          count += increment;
          if (count >= target) {
            stat.innerText = target.toLocaleString() + suffix;
            clearInterval(timer);
          } else {
            stat.innerText = Math.floor(count).toLocaleString() + suffix;
          }
        }, 30);
      });
    }
  }
  window.addEventListener('scroll', animateStats);
  animateStats();

  // 7. Hero Banner Slider Initialization
  function initHeroSlider() {
    const heroSlides = document.querySelectorAll('.hero-slide');
    const sliderDots = document.querySelectorAll('.slider-dots .dot');
    const prevBtn = document.querySelector('.slider-arrow.prev');
    const nextBtn = document.querySelector('.slider-arrow.next');
    let currentSlide = 0;
    let slideInterval = null;

    if (!heroSlides.length) return;

    function showSlide(index) {
      if (index >= heroSlides.length) currentSlide = 0;
      else if (index < 0) currentSlide = heroSlides.length - 1;
      else currentSlide = index;

      heroSlides.forEach((slide, idx) => {
        if (idx === currentSlide) slide.classList.add('active');
        else slide.classList.remove('active');
      });

      if (sliderDots.length) {
        sliderDots.forEach((dot, idx) => {
          if (idx === currentSlide) dot.classList.add('active');
          else dot.classList.remove('active');
        });
      }
    }

    function nextSlide() { showSlide(currentSlide + 1); }
    function prevSlide() { showSlide(currentSlide - 1); }

    function restartSlideTimer() {
      if (slideInterval) clearInterval(slideInterval);
      if (heroSlides.length > 1) {
        slideInterval = setInterval(nextSlide, 10000); // 10 seconds auto-slide
      }
    }

    if (nextBtn) nextBtn.onclick = () => { nextSlide(); restartSlideTimer(); };
    if (prevBtn) prevBtn.onclick = () => { prevSlide(); restartSlideTimer(); };

    if (sliderDots.length) {
      sliderDots.forEach((dot, idx) => {
        dot.onclick = () => { showSlide(idx); restartSlideTimer(); };
      });
    }

    restartSlideTimer();
  }

  // 8. DYNAMIC DATA RENDERING FROM SUPABASE
  if (window.CholanAPI) {
    // 8.0 Render Dynamic Hero Banners on Home Page
    const heroSliderContainer = document.querySelector('.hero-slider-container');
    if (heroSliderContainer) {
      try {
        const banners = await window.CholanAPI.getHeroBanners();
        if (banners && banners.length > 0) {
          const slidesHtml = banners.map((b, i) => `
            <div class="hero-slide ${i === 0 ? 'active' : ''}" style="background-image: linear-gradient(to right, rgba(16, 12, 9, 0.92) 20%, rgba(20, 15, 12, 0.7) 60%, rgba(20, 15, 12, 0.35) 100%), url('${b.image_url}');">
              <div class="container">
                <div class="hero-content">
                  <div class="hero-subtitle-badge">${b.badge || 'Spiritual & Heritage Tours'}</div>
                  <h1 class="hero-title">${b.title}</h1>
                  <p class="hero-desc">${b.description || ''}</p>
                  <div class="hero-buttons">
                    <a href="${b.btn1_link || 'packages.html'}" class="btn-primary">
                      <i class="fa-solid fa-compass"></i> ${b.btn1_text || 'Explore Tours'}
                    </a>
                    <a href="${b.btn2_link || 'contact.html'}" class="btn-outline">
                      <i class="fa-solid fa-headset"></i> ${b.btn2_text || 'Contact Us'}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          `).join('');

          const dotsHtml = banners.map((b, i) => `<span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('');

          heroSliderContainer.innerHTML = `
            ${slidesHtml}
            <button class="slider-arrow prev" aria-label="Previous Slide"><i class="fa-solid fa-chevron-left"></i></button>
            <button class="slider-arrow next" aria-label="Next Slide"><i class="fa-solid fa-chevron-right"></i></button>
            <div class="slider-dots">
              ${dotsHtml}
            </div>
          `;
        }
      } catch (err) {
        console.warn('Using static hero banners fallback:', err);
      }
    }

    // 8.1 Render Destinations on Home or Destinations Page
    const destContainer = document.querySelector('.destinations-grid');
    const isHomePage = !!document.querySelector('.hero-slider-section');
    
    if (destContainer) {
      try {
        const dests = await window.CholanAPI.getDestinations(isHomePage);
        if (dests && dests.length > 0) {
          destContainer.innerHTML = dests.map(d => `
            <div class="destination-card">
              <div class="destination-image-box">
                <img src="${d.image_url}" alt="${d.name}">
                <span class="destination-badge">${d.category}</span>
              </div>
              <div class="destination-info">
                <h3>${d.name}</h3>
                <p>${d.subtitle || ''}</p>
                <a href="destination-detail.html?slug=${d.slug}" class="btn-card-gold">View Tours</a>
              </div>
            </div>
          `).join('');
        }
      } catch (e) {
        console.warn('Could not load destinations dynamically:', e);
      }
    }

    // 8.2 Render Destination Detail Page Dynamically
    const isDetailPage = window.location.pathname.includes('destination-detail.html') || !!document.querySelector('.destination-detail-layout');
    if (isDetailPage) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('slug') || 'thanjavur';
        const dest = await window.CholanAPI.getDestinationBySlug(slug);

        if (dest) {
          document.title = `${dest.name} - Destination Details | Cholan Holidays`;
          
          const metaTitleEl = document.querySelector('.dest-meta-header h2');
          if (metaTitleEl) metaTitleEl.textContent = `${dest.name} – ${dest.subtitle || 'The Land of Temples'}`;

          const breadcrumbSpan = document.querySelector('.breadcrumb-nav span');
          if (breadcrumbSpan) breadcrumbSpan.textContent = dest.name;

          const mainImg = document.querySelector('.dest-main-img img');
          if (mainImg) {
            mainImg.src = dest.image_url;
            mainImg.alt = dest.name;
          }

          const descEl = document.querySelector('.dest-detail-desc');
          if (descEl) descEl.textContent = dest.description;

          const ratingEl = document.querySelector('.star-rating span');
          if (ratingEl) ratingEl.textContent = `${dest.rating || '4.8'} (${dest.reviews_count || 240}+ Traveler Reviews)`;

          // Attractions
          if (dest.attractions && Array.isArray(dest.attractions)) {
            const attrList = document.querySelector('.attraction-list');
            if (attrList) {
              attrList.innerHTML = dest.attractions.map(a => `
                <li>
                  <i class="fa-solid fa-diamond"></i>
                  <span>${a}</span>
                </li>
              `).join('');
            }
          }

          // Enquiry CTA button
          const destEnqBtn = document.querySelector('.dest-enquire-center button');
          if (destEnqBtn) {
            destEnqBtn.setAttribute('data-package', `${dest.name} Tour Package`);
            destEnqBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Enquire Now for ${dest.name} Tour`;
          }
        }
      } catch (e) {
        console.warn('Could not load destination detail dynamically:', e);
      }
    }

    // 8.3 Render Tour Packages (Home & Packages Page)
    const packagesGrid = document.querySelector('.packages-grid:not(.grid-3-col)');
    if (packagesGrid && !isDetailPage) {
      try {
        const pkgs = await window.CholanAPI.getTourPackages('all', isHomePage ? 4 : null);
        if (pkgs && pkgs.length > 0) {
          packagesGrid.innerHTML = pkgs.map(p => `
            <div class="package-card" data-category="${p.category}">
              <div class="package-thumb">
                <img src="${p.image_url}" alt="${p.title}">
                <span class="package-category-tag">${p.category_tag}</span>
              </div>
              <div class="package-details">
                <h3 class="package-title">${p.title}</h3>
                <div class="package-duration">
                  <i class="fa-regular fa-clock"></i> ${p.duration}
                </div>
                <div class="package-price-wrap">
                  <span class="package-price">₹${Number(p.price).toLocaleString()} <span>Onwards</span></span>
                  <button class="btn-book-tour open-enquiry-modal" data-package="${p.title} (${p.duration} - ₹${Number(p.price).toLocaleString()})">Enquire Now</button>
                </div>
              </div>
            </div>
          `).join('');

          attachModalOpenListeners();
        }
      } catch (e) {
        console.warn('Could not load packages dynamically:', e);
      }
    }

    // 8.4 Package Category Filter
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (filterBtns.length) {
      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          filterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const filterValue = (btn.getAttribute('data-filter') || 'all').toLowerCase();
          document.querySelectorAll('.package-card').forEach(card => {
            const cardCat = (card.getAttribute('data-category') || '').toLowerCase();
            const matches = filterValue === 'all' || cardCat === filterValue || cardCat.includes(filterValue);
            if (matches) {
              card.style.display = 'flex';
              requestAnimationFrame(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
              });
            } else {
              card.style.display = 'none';
              card.style.opacity = '0';
              card.style.transform = 'translateY(15px)';
            }
          });
        });
      });
    }

    // 8.5 Render Gallery on gallery.html
    const galleryContainer = document.querySelector('.grid-3-col');
    const isGalleryPage = window.location.pathname.includes('gallery.html') || (document.title.toLowerCase().includes('gallery') && galleryContainer);
    if (isGalleryPage && galleryContainer) {
      try {
        const galItems = await window.CholanAPI.getGalleryItems();
        if (galItems && galItems.length > 0) {
          galleryContainer.innerHTML = galItems.map(g => `
            <div class="destination-card lightbox-trigger" data-full="${g.image_url}" data-title="${g.title} - ${g.location}">
              <div class="destination-image-box" style="height: 250px; cursor: pointer;">
                <img src="${g.image_url}" alt="${g.title}">
              </div>
              <div class="destination-info">
                <h3>${g.title}</h3>
                <p>${g.location}</p>
              </div>
            </div>
          `).join('');

          attachLightboxListeners();
        }
      } catch (e) {
        console.warn('Could not load gallery dynamically:', e);
      }
    }

    // 8.6 Render Blogs on blogs.html
    const isBlogsPage = window.location.pathname.includes('blogs.html') || (document.title.toLowerCase().includes('blog') && galleryContainer);
    if (isBlogsPage && galleryContainer) {
      try {
        const blogs = await window.CholanAPI.getBlogs();
        if (blogs && blogs.length > 0) {
          galleryContainer.innerHTML = blogs.map(b => `
            <div class="package-card">
              <div class="package-thumb">
                <img src="${b.image_url}" alt="${b.title}">
                <span class="package-category-tag">${b.category_tag}</span>
              </div>
              <div class="package-details" style="text-align: left;">
                <div style="font-size: 0.78rem; color: #a46d1e; font-weight: 600; margin-bottom: 5px;">
                  <i class="fa-regular fa-calendar"></i> ${new Date(b.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} • ${b.read_time}
                </div>
                <h3 class="package-title" style="font-size: 1.15rem; margin-bottom: 8px;">${b.title}</h3>
                <p style="font-size: 0.85rem; color: var(--text-dark-muted); line-height: 1.6; margin-bottom: 15px;">
                  ${b.summary}
                </p>
                <div class="package-price-wrap" style="border:none; padding-top:0;">
                  <a href="packages.html" class="btn-card-gold" style="display:inline-block;">Read More &rarr;</a>
                </div>
              </div>
            </div>
          `).join('');
        }
      } catch (e) {
        console.warn('Could not load blogs dynamically:', e);
      }
    }

    // 8.7 Sync Site Settings to Header and Footers
    try {
      const settings = await window.CholanAPI.getSiteSettings();
      if (settings) {
        document.querySelectorAll('a[href^="tel:"]').forEach(a => {
          a.href = `tel:+91${settings.phone.replace(/[^0-9]/g, '')}`;
          a.textContent = settings.phone;
        });
        document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
          a.href = `mailto:${settings.email}`;
          a.textContent = settings.email;
        });
      }
    } catch (e) {
      console.warn('Could not sync site settings:', e);
    }
  }

  // Initialize Hero Slider if present
  initHeroSlider();
});
