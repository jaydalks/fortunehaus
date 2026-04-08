(function () {
  'use strict';

  /* ── Loader ── */
  var loader      = document.getElementById('loader');
  var loaderFill  = document.getElementById('loaderBarFill');
  var loaderDone  = false;

  /* Lock scroll immediately */
  document.documentElement.style.overflow = 'hidden';

  function dismissLoader() {
    if (loaderDone) return;
    loaderDone = true;
    if (loaderFill) loaderFill.style.width = '100%';
    setTimeout(function () {
      var scrollbarW = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.overflow = '';
      window.scrollTo(0, 0);
      document.body.style.paddingRight = scrollbarW + 'px';
      var navEl = document.getElementById('nav');
      if (navEl) navEl.style.paddingRight = scrollbarW + 'px';
      loader.classList.add('loader--hidden');

      /* Start Lenis only after loader exits so it doesn't interfere */
      setTimeout(function () {
        document.body.style.paddingRight = '';
        if (navEl) navEl.style.paddingRight = '';
        initLenis();
      }, 750);
    }, 300);
  }

  /* Track assets: video + document ready */
  var videoReady = false;
  var docReady   = false;

  function checkReady() {
    if (docReady && loaderFill)   loaderFill.style.width = '60%';
    if (videoReady && loaderFill) loaderFill.style.width = '90%';
    if (docReady && videoReady)   dismissLoader();
  }

  var fallback = setTimeout(dismissLoader, 4000);

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
        videoReady = true;
        checkReady();
      });
      video.addEventListener('loadeddata', function onData() {
        video.removeEventListener('loadeddata', onData);
        clearTimeout(fallback);
        videoReady = true;
        checkReady();
      });
    }
  });

  /* ── Lenis smooth scroll ── */
  var lenis;

  function initLenis() {
    lenis = new Lenis({
      duration: 1.4,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
    });

    /* Connect Lenis to GSAP's ticker so ScrollTrigger stays in sync */
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop: function (value) {
        if (arguments.length) {
          lenis.scrollTo(value, { immediate: true });
        }
        return lenis.scroll;
      },
      getBoundingClientRect: function () {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      }
    });
    lenis.on('scroll', ScrollTrigger.update);

    /* Nav state driven by Lenis scroll */
    lenis.on('scroll', function (e) {
      nav.classList.toggle('scrolled', e.scroll > 40);
      if (e.velocity > 0 && e.scroll > 80) {
        if (!isOpen) nav.classList.add('nav--hidden');
      } else if (e.velocity < 0) {
        nav.classList.remove('nav--hidden');
      }
    });

    /* Anchor links — route through Lenis */
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        closeMenu();
        var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
        lenis.scrollTo(target, { offset: -navH, duration: 1.4 });
      });
    });

    /* About section snap via Lenis */
    initAboutSnap();
  }

  /* ── Video playback speed ── */
  var heroVideo = document.querySelector('.hero__video');
  if (heroVideo) {
    heroVideo.addEventListener('loadedmetadata', function () {
      heroVideo.playbackRate = 0.55;
    });
    if (heroVideo.readyState >= 1) heroVideo.playbackRate = 0.55;
  }

  /* ── Hero & scroll animations (GSAP) ── */
  var heroLines = document.querySelectorAll('.hero__line');

  if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    gsap.fromTo(heroLines,
      { yPercent: 105, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 1.4, ease: 'power4.out', stagger: 0.14, delay: 1.1 }
    );

    gsap.to('.hero__content', {
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
      yPercent: -18, opacity: 0, ease: 'none'
    });

    gsap.to('.hero__video', {
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
      yPercent: 16, ease: 'none'
    });

    /* ── Claw section pin ── */
    var clawSection  = document.querySelector('.claw');
    var clawFeatures = clawSection ? gsap.utils.toArray('.claw__feature') : [];
    var clawImgs     = gsap.utils.toArray('.claw__img');
    var clawIntro    = clawSection ? clawSection.querySelector('.claw__intro') : null;
    var clawStage    = clawSection ? clawSection.querySelector('.claw__stage') : null;
    var cards        = gsap.utils.toArray('.enquiry-card');

    if (clawFeatures.length && clawSection && window.innerWidth > 768) {
      clawFeatures.forEach(function (f) { f.classList.remove('reveal', 'visible'); });
      gsap.set(clawFeatures, { opacity: 0, y: 40 });
      gsap.set(clawImgs,     { opacity: 0 });
      gsap.set(clawStage,    { opacity: 0 });

      var clawTl = gsap.timeline({
        scrollTrigger: {
          trigger: clawSection,
          start: 'top top',
          end: function () { return '+=' + ((clawFeatures.length + 1) * window.innerHeight * 0.65); },
          pin: true,
          anticipatePin: 1,
          scrub: 1.5,
        }
      });

      clawTl.to(clawIntro, { opacity: 0, y: -30, duration: 0.8, ease: 'power2.in' }, 0);
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

    if (cards.length) {
      cards.forEach(function (c) { c.classList.remove('reveal', 'visible'); });
      gsap.fromTo(cards,
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out', stagger: 0.14,
          scrollTrigger: { trigger: '.enquiry-entry__cards', start: 'top 82%', toggleActions: 'play none none reverse' }
        }
      );
    }
  } else {
    heroLines.forEach(function (el, i) {
      el.style.animation = 'heroLineIn 0.9s cubic-bezier(0.25,0.46,0.45,0.94) ' + (0.2 + i * 0.14) + 's both';
    });
  }

  /* ── Navigation ── */
  var nav    = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var mobileNav = document.getElementById('mobileNav');
  var isOpen = false;

  /* Fallback nav scroll state (before Lenis inits) */
  function updateNav() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }
  updateNav();

  function openMenu() {
    isOpen = true;
    burger.classList.add('active');
    burger.setAttribute('aria-expanded', 'true');
    mobileNav.classList.add('open');
    mobileNav.setAttribute('aria-hidden', 'false');
    nav.classList.add('scrolled');
    if (lenis) lenis.stop();
  }

  function closeMenu() {
    isOpen = false;
    burger.classList.remove('active');
    burger.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    updateNav();
    if (lenis) lenis.start();
  }

  burger.addEventListener('click', function () {
    if (isOpen) { closeMenu(); } else { openMenu(); }
  });

  document.querySelectorAll('[data-mobile-close]').forEach(function (el) {
    el.addEventListener('click', closeMenu);
  });

  /* ── Footer reveal ── */
  var footer = document.querySelector('.footer');
  if (footer && 'IntersectionObserver' in window) {
    var footerIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          footer.classList.add('footer--visible');
          footerIO.unobserve(footer);
        }
      });
    }, { threshold: 0.15 });
    footerIO.observe(footer);
  } else if (footer) {
    footer.classList.add('footer--visible');
  }

  /* ── About section snap ── */
  function initAboutSnap() {
    var aboutEl = document.getElementById('about');
    if (!aboutEl || typeof gsap === 'undefined') return;

    var triggered = false;
    var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;

    ScrollTrigger.create({
      trigger: aboutEl,
      start: 'top 55%',
      once: true,
      onEnter: function () {
        if (triggered) return;
        triggered = true;
        var sectionH = aboutEl.offsetHeight;
        var viewH    = window.innerHeight - navH;
        var offset   = sectionH < viewH ? navH + (viewH - sectionH) / 2 : navH;
        var targetY  = aboutEl.getBoundingClientRect().top + window.scrollY - offset;
        lenis.scrollTo(targetY, { duration: 1.8, easing: function (t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; } });
      }
    });
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
    var scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    if (lenis) lenis.stop();
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
        if (lenis) lenis.start();
      }
    });
  }

  var mobileEnquire = document.getElementById('mobileEnquireBtn');
  if (navEnquire)    navEnquire.addEventListener('click', openModal);
  if (mobileEnquire) mobileEnquire.addEventListener('click', function () { closeMenu(); openModal(); });
  if (eqClose)       eqClose.addEventListener('click', closeModal);
  if (eqBackdrop)    eqBackdrop.addEventListener('click', closeModal);
  if (eqModal) {
    eqModal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  /* ── Scroll reveal ── */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

}());
