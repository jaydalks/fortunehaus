(function () {
  'use strict';

  /* ── Video playback speed ── */
  var heroVideo = document.querySelector('.hero__video');
  if (heroVideo) {
    heroVideo.addEventListener('loadedmetadata', function () {
      heroVideo.playbackRate = 0.55;
    });
    // Also set immediately in case already loaded
    if (heroVideo.readyState >= 1) heroVideo.playbackRate = 0.55;
  }

  /* ── Hero animations ── */
  var heroLines = document.querySelectorAll('.hero__line');

  if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // On-load: each line slides up out of its clip container
    gsap.fromTo(heroLines,
      { yPercent: 105, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 1.4,
        ease: 'power4.out',
        stagger: 0.14,
        delay: 0.2
      }
    );

    // On scroll: content drifts up and fades (parallax exit)
    gsap.to('.hero__content', {
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      },
      yPercent: -18,
      opacity: 0,
      ease: 'none'
    });

    // Video moves slower than scroll (depth parallax)
    gsap.to('.hero__video', {
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      },
      yPercent: 16,
      ease: 'none'
    });

  } else {
    // Fallback: CSS animation if GSAP unavailable
    heroLines.forEach(function (el, i) {
      el.style.animation = 'heroLineIn 0.9s cubic-bezier(0.25,0.46,0.45,0.94) ' + (0.2 + i * 0.14) + 's both';
    });
  }

  /* ── Claw section: pinned scroll-driven feature reveal (GSAP) ── */
  /* ── Enquiry cards: scroll reveal via GSAP (accounts for pin offset) ── */
  if (typeof gsap !== 'undefined') {
    var clawSection  = document.querySelector('.claw');
    var clawFeatures = clawSection ? gsap.utils.toArray('.claw__feature') : [];
    var cards        = gsap.utils.toArray('.enquiry-card');

    /* ── Claw pin ── */
    var clawImgs    = gsap.utils.toArray('.claw__img');
    var clawIntro   = clawSection ? clawSection.querySelector('.claw__intro') : null;
    var clawStage   = clawSection ? clawSection.querySelector('.claw__stage') : null;

    if (clawFeatures.length && clawSection && window.innerWidth > 768) {
      /* Strip CSS reveal classes — GSAP owns all animations here */
      clawFeatures.forEach(function (f) { f.classList.remove('reveal', 'visible'); });

      /* Initial states */
      gsap.set(clawFeatures, { opacity: 0, y: 40 });
      gsap.set(clawImgs,     { opacity: 0 });
      gsap.set(clawStage,    { opacity: 0 });

      /* Timeline: 1 step to fade intro + 1 step per feature */
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

      /* Step 0: fade out intro, reveal stage */
      clawTl.to(clawIntro, { opacity: 0, y: -30, duration: 0.8, ease: 'power2.in' }, 0);
      clawTl.to(clawStage, { opacity: 1, duration: 0.01 }, 0.9);
      if (clawImgs[0]) clawTl.to(clawImgs[0], { opacity: 1, duration: 0.5 }, 0.9);

      /* Steps 1–4: features + image crossfades */
      clawFeatures.forEach(function (feature, i) {
        var pos = 1 + i;
        clawTl.to(feature, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, pos);

        if (i > 0 && clawImgs[i]) {
          clawTl.to(clawImgs[i - 1], { opacity: 0, duration: 0.7, ease: 'none' }, pos);
          clawTl.to(clawImgs[i],     { opacity: 1, duration: 0.7, ease: 'none' }, pos);
        }
      });
    }

    /* ── Enquiry cards — remove from IO, let GSAP handle (pin-aware) ── */
    if (cards.length) {
      cards.forEach(function (c) { c.classList.remove('reveal', 'visible'); });
      gsap.fromTo(cards,
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.14,
          scrollTrigger: {
            trigger: '.enquiry-entry__cards',
            start: 'top 82%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }
  }

  /* ── Navigation scroll state ── */
  var nav = document.getElementById('nav');

  function updateNav() {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }
  updateNav();

  /* ── Hide nav on scroll down, restore on scroll up ── */
  var lastScrollY = window.scrollY;
  window.addEventListener('scroll', function () {
    var currentY = window.scrollY;
    if (currentY > lastScrollY && currentY > 80) {
      /* Scrolling down — hide nav (unless menu is open) */
      if (!isOpen) nav.classList.add('nav--hidden');
    } else {
      /* Scrolling up — always restore */
      nav.classList.remove('nav--hidden');
    }
    updateNav();
    lastScrollY = currentY;
  }, { passive: true });

  /* ── Mobile burger ── */
  var burger     = document.getElementById('burger');
  var mobileNav  = document.getElementById('mobileNav');
  var isOpen     = false;

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

  /* Close on mobile nav link click */
  document.querySelectorAll('[data-mobile-close]').forEach(function (el) {
    el.addEventListener('click', closeMenu);
  });

  /* ── Smooth anchor scroll ── */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      closeMenu();
      var offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* ── Footer reveal on scroll ── */
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

  /* ── About section: snap into centered view on first entry ── */
  (function () {
    var aboutEl = document.getElementById('about');
    if (!aboutEl || !('IntersectionObserver' in window)) return;

    var snapped = false;
    var navH    = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;

    var snapIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || snapped) return;
        snapped = true;
        snapIO.disconnect();

        var sectionH = aboutEl.offsetHeight;
        var viewH    = window.innerHeight - navH;
        var offset   = sectionH < viewH ? navH + (viewH - sectionH) / 2 : navH;
        var targetY  = aboutEl.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      });
    }, { threshold: 0.2 });

    snapIO.observe(aboutEl);
  }());

  /* ── Enquiry modal ── */
  var eqModal    = document.getElementById('eqModal');
  var eqBackdrop = document.getElementById('eqBackdrop');
  var eqClose    = document.getElementById('eqClose');
  var navEnquire = document.getElementById('navEnquireBtn');

  function openModal() {
    /* Compensate for scrollbar disappearing so page doesn't jump */
    var scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = scrollbarW + 'px';
    nav.style.paddingRight = scrollbarW + 'px';
    eqModal.classList.add('open');
    eqModal.setAttribute('aria-hidden', 'false');
    if (eqClose) eqClose.focus();
  }
  function closeModal() {
    eqModal.classList.remove('open');
    eqModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    nav.style.paddingRight = '';
  }

  var mobileEnquire = document.getElementById('mobileEnquireBtn');
  if (navEnquire)    navEnquire.addEventListener('click', openModal);
  if (mobileEnquire) mobileEnquire.addEventListener('click', function () { closeMenu(); openModal(); });
  if (eqClose)    eqClose.addEventListener('click', closeModal);
  if (eqBackdrop) eqBackdrop.addEventListener('click', closeModal);
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
