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
      var scrollbarW = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.overflow = '';
      window.scrollTo(0, 0);
      document.body.style.paddingRight = scrollbarW + 'px';
      var navEl = document.getElementById('nav');
      if (navEl) navEl.style.paddingRight = scrollbarW + 'px';
      loader.classList.add('loader--hidden');
      setTimeout(function () {
        document.body.style.paddingRight = '';
        if (navEl) navEl.style.paddingRight = '';
      }, 750);
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
      clawFeatures.forEach(function (f) { f.classList.remove('reveal', 'visible'); });
      gsap.set(clawFeatures, { opacity: 0, y: 40 });
      gsap.set(clawImgs,     { opacity: 0 });
      gsap.set(clawStage,    { opacity: 0 });

      var clawTl = gsap.timeline({
        scrollTrigger: {
          trigger: clawSection,
          start: 'top top',
          end: function () { return '+=' + ((clawFeatures.length + 1) * window.innerHeight * 0.65); },
          pin: true, anticipatePin: 1, scrub: 0.4
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

    if (isMobile) {
      /* On mobile: ensure claw section is visible and laid out statically */
      if (clawStage)  { clawStage.style.opacity  = ''; clawStage.style.position  = ''; }
      if (clawIntro)  { clawIntro.style.opacity   = ''; clawIntro.style.position   = ''; }
      clawImgs.forEach(function (img, i) { img.style.opacity = i === 0 ? '1' : ''; });
      clawFeatures.forEach(function (f) { f.style.opacity = '1'; f.style.transform = 'none'; f.style.willChange = 'auto'; });

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
      cards.forEach(function (c, i) {
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
          scrollTrigger: { trigger: contactHeadline, start: 'top 90%', end: 'top 45%', scrub: 0.6 } }
      );
    }
    if (contactBody) {
      contactBody.classList.remove('reveal', 'reveal-d2', 'visible');
      gsap.fromTo(contactBody,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: contactBody, start: 'top 92%', end: 'top 58%', scrub: 0.6 } }
      );
    }
    if (contactDetails) {
      contactDetails.classList.remove('reveal', 'reveal-d3', 'visible');
      gsap.fromTo(contactDetails,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: contactDetails, start: 'top 92%', end: 'top 60%', scrub: 0.6 } }
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

    /* About section snap — desktop only */
    if (!isMobile)
    (function () {
      var aboutEl = document.getElementById('about');
      if (!aboutEl) return;
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
          gsap.to(window, { scrollTo: { y: targetY, autoKill: true }, duration: 1.4, ease: 'power2.inOut' });
        }
      });
    }());

  } else {
    heroLines.forEach(function (el, i) {
      el.style.animation = 'heroLineIn 0.9s cubic-bezier(0.25,0.46,0.45,0.94) ' + (0.2 + i * 0.14) + 's both';
    });
  }

  /* ── Scroll momentum — desktop only (touch has native momentum) ── */
  var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 900;

  if (!isMobile) {
    (function () {
      var velocity      = 0;
      var lastY         = window.scrollY;
      var wheelTimer    = null;
      var momentumTween = null;

      function trackVelocity() {
        var currentY = window.scrollY;
        velocity = currentY - lastY;
        lastY = currentY;
        requestAnimationFrame(trackVelocity);
      }
      requestAnimationFrame(trackVelocity);

      window.addEventListener('wheel', function () {
        if (momentumTween) { momentumTween.kill(); momentumTween = null; }
        clearTimeout(wheelTimer);
        wheelTimer = setTimeout(function () {
          if (Math.abs(velocity) < 1.5) return;
          var distance = velocity * 6;
          distance = Math.max(-350, Math.min(350, distance));
          var target = Math.max(0, Math.min(window.scrollY + distance, document.body.scrollHeight - window.innerHeight));
          var dur = 0.9 + Math.min(Math.abs(distance) / 1200, 0.7);
          momentumTween = gsap.to(window, { scrollTo: { y: target, autoKill: true }, duration: dur, ease: 'power3.out' });
        }, 40);
      }, { passive: true });
    }());
  }

  /* ── Navigation ── */
  var nav = document.getElementById('nav');

  function updateNav() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }
  updateNav();

  var lastScrollY = window.scrollY;
  var isOpen = false;

  window.addEventListener('scroll', function () {
    var currentY = window.scrollY;
    if (currentY > lastScrollY && currentY > 80) {
      if (!isOpen) nav.classList.add('nav--hidden');
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
