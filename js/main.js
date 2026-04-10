(function () {
  'use strict';

  /* ── Loader ── */
  var loader     = document.getElementById('loader');
  var loaderFill = document.getElementById('loaderBarFill');
  var loaderDone = false;

  document.documentElement.style.overflow = 'hidden';

  function dismissLoader() {
    if (loaderDone) return;
    loaderDone = true;
    if (loaderFill) loaderFill.style.width = '100%';
    setTimeout(function () {
      /* Show the white flash FIRST — all layout changes happen underneath it
         so the logo jump and page shift are completely hidden */
      var flash = document.createElement('div');
      flash.style.cssText = 'position:fixed;inset:0;z-index:999;background:#fff;opacity:0;pointer-events:none;transition:opacity 220ms ease-out;';
      document.body.appendChild(flash);

      requestAnimationFrame(function () {
        flash.style.opacity = '1';

        /* Wait for flash to reach full white, then do layout changes */
        setTimeout(function () {
          document.documentElement.style.overflow = '';
          /* Measure scrollbar width now that overflow is restored — same frame
             as the change so both are batched into one paint */
          var scrollbarW = window.innerWidth - document.documentElement.clientWidth;
          if (loader) loader.style.paddingRight = scrollbarW + 'px';
          window.scrollTo(0, 0);
          /* Sync Lenis to position 0 and release */
          if (window._lenis) { window._lenis.scrollTo(0, { immediate: true }); window._lenis.start(); }

          loader.classList.add('loader--hidden');
          flash.style.transition = 'opacity 600ms ease-in';
          flash.style.opacity = '0';
          setTimeout(function () {
            if (loader) loader.style.paddingRight = '';
            flash.remove();
          }, 650);
        }, 240);
      });
    }, 300);
  }

  var videoReady = false;
  var docReady   = false;
  var timerReady = false;

  setTimeout(function () { timerReady = true; checkReady(); }, 3000);

  function checkReady() {
    var allAssets = docReady && videoReady;
    if (allAssets && loaderFill) loaderFill.style.width = '85%';
    if (allAssets && timerReady) dismissLoader();
  }

  var fallback = setTimeout(dismissLoader, 8000);

  document.addEventListener('DOMContentLoaded', function () {
    docReady = true;
    checkReady();

    var video = document.querySelector('.hero__video');
    if (!video) { videoReady = true; checkReady(); return; }

    if (video.readyState >= 3) {
      videoReady = true; checkReady();
    } else {
      video.addEventListener('canplaythrough', function onReady() {
        video.removeEventListener('canplaythrough', onReady);
        clearTimeout(fallback);
        videoReady = true; checkReady();
      });
      video.addEventListener('loadeddata', function onData() {
        video.removeEventListener('loadeddata', onData);
        clearTimeout(fallback);
        videoReady = true; checkReady();
      });
    }
  });

  /* ── Video playback ── */
  var heroVideo = document.querySelector('.hero__video');
  if (heroVideo) {
    heroVideo.addEventListener('loadedmetadata', function () { heroVideo.playbackRate = 0.55; });
    if (heroVideo.readyState >= 1) heroVideo.playbackRate = 0.55;
    /* iOS Safari sometimes needs an explicit play() call */
    var playPromise = heroVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(function () {
        /* Autoplay blocked — try again on first user interaction */
        document.addEventListener('touchstart', function tryPlay() {
          heroVideo.play();
          document.removeEventListener('touchstart', tryPlay);
        }, { once: true });
      });
    }
  }

  /* ── Mobile detection — must be before GSAP block ── */
  var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 900;

  /* ── GSAP animations ── */
  var heroLines = document.querySelectorAll('.hero__line');

  if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    gsap.fromTo(heroLines,
      { yPercent: 105, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 1.4, ease: 'power4.out', stagger: 0.14, delay: 1.1 }
    );

    if (!isMobile) {
      gsap.to('.hero__content', {
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.2 },
        yPercent: -18, opacity: 0, ease: 'none'
      });
      gsap.to('.hero__video', {
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.2 },
        yPercent: 16, ease: 'none'
      });
    }

    var clawSection  = document.querySelector('.claw');
    var clawFeatures = clawSection ? gsap.utils.toArray('.claw__feature') : [];
    var clawImgs     = gsap.utils.toArray('.claw__img');
    var clawIntro    = clawSection ? clawSection.querySelector('.claw__intro') : null;
    var clawStage    = clawSection ? clawSection.querySelector('.claw__stage') : null;
    var cards        = gsap.utils.toArray('.enquiry-card');

    if (clawFeatures.length && clawSection && window.innerWidth > 768) {
      var clawBlur = document.getElementById('clawBlur');
      clawFeatures.forEach(function (f) { f.classList.remove('reveal', 'visible'); });
      gsap.set(clawFeatures, { opacity: 0, y: 40 });
      gsap.set(clawImgs,     { opacity: 0 });
      gsap.set(clawStage,    { opacity: 0 });

      var clawTl = gsap.timeline({
        scrollTrigger: {
          trigger: clawSection,
          start: 'top top',
          end: function () { return '+=' + ((clawFeatures.length + 1) * window.innerHeight * 0.65); },
          pin: true, anticipatePin: 0, scrub: 0.4
        }
      });

      clawTl.to(clawIntro, { opacity: 0, y: -30, duration: 0.8, ease: 'power2.in' }, 0);
      if (clawBlur) clawTl.to(clawBlur, { opacity: 1, duration: 0.8, ease: 'none' }, 0.1);
      clawTl.to(clawStage, { opacity: 1, duration: 0.01 }, 0.9);
      if (clawImgs[0]) clawTl.to(clawImgs[0], { opacity: 1, duration: 0.5 }, 0.9);

      clawFeatures.forEach(function (feature, i) {
        var pos = 1 + i;
        clawTl.to(feature, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, pos);
        if (i > 0 && clawImgs[i]) {
          clawTl.to(clawImgs[i - 1], { opacity: 0, duration: 0.7, ease: 'none' }, pos);
          clawTl.to(clawImgs[i],     { opacity: 1, duration: 0.7, ease: 'none' }, pos);
        }
      });
    }

    if (isMobile) {
      /* On mobile: full-bleed image carousel — slide 0 = intro text, slides 1-4 = features */
      if (clawSection && clawImgs.length && clawFeatures.length) {
        /* Hide the original inner content */
        var clawInnerEl = clawSection.querySelector('.claw__inner');
        if (clawInnerEl) clawInnerEl.style.display = 'none';

        /* Collect intro copy from original DOM */
        var introHeadline = clawIntro ? clawIntro.querySelector('.claw__headline') : null;
        var introBodies   = clawIntro ? clawIntro.querySelectorAll('.claw__body')   : [];

        /* Collect feature data */
        var featData = clawImgs.map(function (img, i) {
          var feat = clawFeatures[i];
          return {
            src:   img.src,
            num:   feat ? (feat.querySelector('.claw__feature-num')   || {}).textContent || '' : '',
            title: feat ? (feat.querySelector('.claw__feature-title') || {}).textContent || '' : '',
            desc:  feat ? (feat.querySelector('.claw__feature-desc')  || {}).textContent || '' : ''
          };
        });

        /* Total slides: 1 intro + 4 features */
        var totalSlides = featData.length + 1;

        /* ── Build markup ── */
        var carousel = document.createElement('div');
        carousel.className = 'claw__fbc';

        /* Top dissolve — pale-oak → transparent, blends with About section above */
        var topDissolve = document.createElement('div');
        topDissolve.className = 'claw__fbc-top-dissolve';
        carousel.appendChild(topDissolve);

        /* Background image layers (one per feature slide, indices 0–3) */
        var bgWrap = document.createElement('div');
        bgWrap.className = 'claw__fbc-bgs';
        featData.forEach(function (d) {
          var bg = document.createElement('div');
          bg.className = 'claw__fbc-bg';
          bg.style.backgroundImage = 'url(' + d.src + ')';
          bgWrap.appendChild(bg);
        });

        /* Bottom gradient overlay for feature text legibility */
        var overlay = document.createElement('div');
        overlay.className = 'claw__fbc-overlay';

        /* Panel container — fills entire carousel */
        var panelWrap = document.createElement('div');
        panelWrap.className = 'claw__fbc-panels';

        /* Panel 0: intro copy + swipe hint */
        var introBodyHTML = '';
        introBodies.forEach(function (b) {
          introBodyHTML += '<p class="claw__fbc-intro-body">' + b.textContent + '</p>';
        });
        var introPanel = document.createElement('div');
        introPanel.className = 'claw__fbc-panel claw__fbc-intro claw__fbc-panel--active';
        introPanel.innerHTML =
          '<h2 class="claw__fbc-intro-headline">' + (introHeadline ? introHeadline.innerHTML : 'One Experience.<br>Infinite Memories.') + '</h2>' +
          introBodyHTML +
          '<div class="claw__fbc-swipe-hint" aria-hidden="true">' +
            '<span>Swipe to explore</span>' +
            '<svg viewBox="0 0 20 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M1 6h18M13 1l5 5-5 5"/>' +
            '</svg>' +
          '</div>';
        panelWrap.appendChild(introPanel);

        /* Panels 1–4: feature descriptions */
        featData.forEach(function (d) {
          var panel = document.createElement('div');
          panel.className = 'claw__fbc-panel claw__fbc-feat';
          panel.innerHTML =
            '<span class="claw__feature-num">' + d.num + '</span>' +
            '<p class="claw__fbc-title">' + d.title + '</p>' +
            '<p class="claw__fbc-desc">'  + d.desc  + '</p>';
          panelWrap.appendChild(panel);
        });

        /* Dot indicators */
        var dotsWrap = document.createElement('div');
        dotsWrap.className = 'claw__fbc-dots';
        for (var di = 0; di < totalSlides; di++) {
          var dot = document.createElement('button');
          dot.className = 'claw__dot' + (di === 0 ? ' claw__dot--active' : '');
          dot.setAttribute('aria-label', 'Slide ' + (di + 1));
          dot.dataset.index = di;
          dotsWrap.appendChild(dot);
        }

        carousel.appendChild(bgWrap);
        carousel.appendChild(overlay);
        carousel.appendChild(panelWrap);
        carousel.appendChild(dotsWrap);
        clawSection.appendChild(carousel);

        /* ── State & navigation ── */
        var currentSlide = 0;
        var allBgs    = bgWrap.querySelectorAll('.claw__fbc-bg');
        var allPanels = panelWrap.querySelectorAll('.claw__fbc-panel');
        var allDots   = dotsWrap.querySelectorAll('.claw__dot');

        function goToSlide(index) {
          var next = Math.max(0, Math.min(index, totalSlides - 1));
          if (next === currentSlide) return;

          /* Deactivate current */
          allPanels[currentSlide].classList.remove('claw__fbc-panel--active');
          allDots[currentSlide].classList.remove('claw__dot--active');
          if (currentSlide > 0) allBgs[currentSlide - 1].classList.remove('claw__fbc-bg--active');

          currentSlide = next;

          /* Activate next */
          allPanels[currentSlide].classList.add('claw__fbc-panel--active');
          allDots[currentSlide].classList.add('claw__dot--active');
          if (currentSlide > 0) allBgs[currentSlide - 1].classList.add('claw__fbc-bg--active');

          /* Show overlay only when a feature image is active */
          overlay.style.opacity = currentSlide > 0 ? '1' : '0';
        }

        /* Initialise overlay hidden on intro slide */
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.55s ease';

        /* Dot taps */
        dotsWrap.addEventListener('click', function (e) {
          var dot = e.target.closest('.claw__dot');
          if (dot) goToSlide(parseInt(dot.dataset.index, 10));
        });

        /* Touch swipe */
        var swipeStartX = 0;
        var swipeStartY = 0;
        carousel.addEventListener('touchstart', function (e) {
          swipeStartX = e.touches[0].clientX;
          swipeStartY = e.touches[0].clientY;
        }, { passive: true });
        carousel.addEventListener('touchend', function (e) {
          var dx = e.changedTouches[0].clientX - swipeStartX;
          var dy = e.changedTouches[0].clientY - swipeStartY;
          if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
            goToSlide(dx < 0 ? currentSlide + 1 : currentSlide - 1);
          }
        }, { passive: true });
      }

      /* On mobile: ensure all animated elements are visible — no scrub */
      document.querySelectorAll('.about__headline,.about__body,.about__pillar,.enquiry-entry__headline,.enquiry-entry__sub,.enquiry-card,.contact__headline,.contact__body,.contact__details').forEach(function (el) {
        el.classList.remove('reveal','reveal-d1','reveal-d2','reveal-d3');
      });
    }

    if (!isMobile) {
    /* ── About section — scrubbed entry ── */
    var aboutHeadline = document.querySelector('.about__headline');
    var aboutBodies   = document.querySelectorAll('.about__body');
    var aboutPillars  = document.querySelectorAll('.about__pillar');

    if (aboutHeadline) {
      aboutHeadline.classList.remove('reveal', 'reveal-d1', 'visible');
      gsap.fromTo(aboutHeadline,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: aboutHeadline, start: 'top 90%', end: 'top 40%', scrub: 0.6 } }
      );
    }
    aboutBodies.forEach(function (el) {
      el.classList.remove('reveal', 'reveal-d2', 'visible');
      gsap.fromTo(el,
        { opacity: 0, y: 35 },
        { opacity: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 55%', scrub: 0.6 } }
      );
    });
    aboutPillars.forEach(function (el, i) {
      el.classList.remove('reveal', 'reveal-d1', 'reveal-d2', 'reveal-d3', 'visible');
      gsap.fromTo(el,
        { opacity: 0, y: 40 + i * 10 },
        { opacity: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 50%', scrub: 0.6 } }
      );
    });

    /* ── Enquiry entry — scrubbed entry ── */
    var eqHeadline = document.querySelector('.enquiry-entry__headline');
    var eqSub      = document.querySelector('.enquiry-entry__sub');

    if (eqHeadline) {
      eqHeadline.classList.remove('reveal', 'reveal-d1', 'visible');
      gsap.fromTo(eqHeadline,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: eqHeadline, start: 'top 90%', end: 'top 45%', scrub: 0.6 } }
      );
    }
    if (eqSub) {
      eqSub.classList.remove('reveal', 'reveal-d2', 'visible');
      gsap.fromTo(eqSub,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: eqSub, start: 'top 92%', end: 'top 55%', scrub: 0.6 } }
      );
    }

    if (cards.length) {
      cards.forEach(function (c) { c.classList.remove('reveal', 'visible'); });
      cards.forEach(function (c) {
        gsap.fromTo(c,
          { opacity: 0, y: 60, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, ease: 'none',
            scrollTrigger: { trigger: c, start: 'top 92%', end: 'top 55%', scrub: 0.5 } }
        );
      });
    }

    /* ── Contact section — scrubbed entry ── */
    var contactHeadline = document.querySelector('.contact__headline');
    var contactBody     = document.querySelector('.contact__body');
    var contactDetails  = document.querySelector('.contact__details');

    if (contactHeadline) {
      contactHeadline.classList.remove('reveal', 'reveal-d1', 'visible');
      gsap.fromTo(contactHeadline,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: contactHeadline, start: 'top 95%', end: 'top 65%', scrub: 0.6 } }
      );
    }
    if (contactBody) {
      contactBody.classList.remove('reveal', 'reveal-d2', 'visible');
      gsap.fromTo(contactBody,
        { opacity: 0, y: 30 },
        { opacity: 0.85, y: 0, ease: 'none',
          scrollTrigger: { trigger: contactBody, start: 'top 95%', end: 'top 70%', scrub: 0.6 } }
      );
    }
    if (contactDetails) {
      contactDetails.classList.remove('reveal', 'reveal-d3', 'visible');
      gsap.fromTo(contactDetails,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: contactDetails, start: 'top 95%', end: 'top 72%', scrub: 0.6 } }
      );
    }

    /* ── Subtle parallax depth on section backgrounds ── */
    gsap.to('.about__left', {
      yPercent: -8, ease: 'none',
      scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: 0.4 }
    });
    gsap.to('.about__right', {
      yPercent: -5, ease: 'none',
      scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: 0.4 }
    });
    gsap.to('.enquiry-entry__header', {
      yPercent: -6, ease: 'none',
      scrollTrigger: { trigger: '.enquiry-entry', start: 'top bottom', end: 'bottom top', scrub: 0.4 }
    });
    gsap.to('.contact__inner', {
      yPercent: -5, ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: 0.4 }
    });

    } /* end !isMobile scrub block */


  } else {
    heroLines.forEach(function (el, i) {
      el.style.animation = 'heroLineIn 0.9s cubic-bezier(0.25,0.46,0.45,0.94) ' + (0.2 + i * 0.14) + 's both';
    });
  }

  /* ── Lenis smooth scroll — desktop only ── */
  if (!isMobile && typeof Lenis !== 'undefined') {
    var lenis = new Lenis({
      duration:        1.3,
      easing:          function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel:     true,
      wheelMultiplier: 0.9,
      syncTouch:       false
    });

    /* Sync Lenis with GSAP ScrollTrigger so pinning works correctly */
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    /* Expose lenis globally so modal open/close can stop/start it */
    window._lenis = lenis;

    /* Start paused — loader will release it once overflow is cleared */
    lenis.stop();
  }

  /* ── Navigation ── */
  var nav = document.getElementById('nav');

  function updateNav() {
    var isHidden = nav.classList.contains('nav--hidden');
    nav.classList.toggle('scrolled', !isHidden && window.scrollY > 40);
  }
  updateNav();

  var lastScrollY = window.scrollY;
  var isOpen = false;

  window.addEventListener('scroll', function () {
    var currentY = window.scrollY;
    if (currentY > lastScrollY && currentY > 10) {
      if (!isOpen) { nav.classList.add('nav--hidden'); nav.classList.remove('scrolled'); }
    } else {
      nav.classList.remove('nav--hidden');
    }
    updateNav();
    lastScrollY = currentY;
  }, { passive: true });

  var burger    = document.getElementById('burger');
  var mobileNav = document.getElementById('mobileNav');

  function openMenu() {
    isOpen = true;
    burger.classList.add('active');
    burger.setAttribute('aria-expanded', 'true');
    mobileNav.classList.add('open');
    mobileNav.setAttribute('aria-hidden', 'false');
    nav.classList.add('scrolled');
  }

  function closeMenu() {
    isOpen = false;
    burger.classList.remove('active');
    burger.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    updateNav();
  }

  burger.addEventListener('click', function () {
    if (isOpen) { closeMenu(); } else { openMenu(); }
  });

  document.querySelectorAll('[data-mobile-close]').forEach(function (el) {
    el.addEventListener('click', closeMenu);
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      closeMenu();
      var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
      var top = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* ── Footer reveal ── */
  var footer = document.querySelector('.footer');
  if (footer && 'IntersectionObserver' in window) {
    var footerIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { footer.classList.add('footer--visible'); footerIO.unobserve(footer); }
      });
    }, { threshold: 0.15 });
    footerIO.observe(footer);
  } else if (footer) {
    footer.classList.add('footer--visible');
  }

  /* ── Enquiry modal ── */
  var eqModal    = document.getElementById('eqModal');
  var eqBackdrop = document.getElementById('eqBackdrop');
  var eqClose    = document.getElementById('eqClose');
  var eqPanel    = eqModal ? eqModal.querySelector('.eq-modal__panel') : null;
  var navEnquire = document.getElementById('navEnquireBtn');

  if (eqBackdrop) gsap.set(eqBackdrop, { opacity: 0 });
  if (eqPanel)    gsap.set(eqPanel,    { opacity: 0, y: 28, scale: 0.97 });

  function openModal() {
    if (window._lenis) window._lenis.stop();
    var scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = scrollbarW + 'px';
    nav.style.paddingRight = scrollbarW + 'px';
    eqModal.classList.add('open');
    eqModal.setAttribute('aria-hidden', 'false');
    gsap.to(eqBackdrop, { opacity: 1, duration: 0.55, ease: 'power2.out' });
    gsap.to(eqPanel,    { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.5)', delay: 0.05 });
    if (eqClose) eqClose.focus();
  }

  function closeModal() {
    gsap.to(eqBackdrop, { opacity: 0, duration: 0.35, ease: 'power2.in' });
    gsap.to(eqPanel, { opacity: 0, y: 16, scale: 0.97, duration: 0.3, ease: 'power2.in',
      onComplete: function () {
        eqModal.classList.remove('open');
        eqModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        nav.style.paddingRight = '';
        if (window._lenis) window._lenis.start();
      }
    });
  }

  var mobileEnquire = document.getElementById('mobileEnquireBtn');
  if (navEnquire)    navEnquire.addEventListener('click', openModal);
  if (mobileEnquire) mobileEnquire.addEventListener('click', function () { closeMenu(); openModal(); });
  if (eqClose)       eqClose.addEventListener('click', closeModal);
  if (eqBackdrop)    eqBackdrop.addEventListener('click', closeModal);
  if (eqModal) {
    eqModal.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  }

  /* ── Scroll reveal ── */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

}());
