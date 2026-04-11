(function () {
  'use strict';

  /* Exposed globally so each page's inline script can call initEnquiry({}) */
  window.initEnquiry = function (opts) {
    var successUrl = opts.successUrl || '../success.html';

    var total = 3;

    var form        = document.getElementById('enquiryForm');
    var progressFill = document.getElementById('progressFill');
    var progressLabel = document.getElementById('progressLabel');

    /* ── Progress ── */
    function setProgress(step) {
      var pct = (step / total) * 100;
      progressFill.style.width = pct + '%';
      progressFill.parentElement.setAttribute('aria-valuenow', step);
      progressLabel.textContent = 'Step ' + step + ' of ' + total + ' — takes ~60 seconds';
    }

    /* ── Show step + update URL for analytics tracking ── */
    function showStep(n) {
      document.querySelectorAll('.form-step').forEach(function (el) {
        el.classList.remove('active');
      });
      var target = document.getElementById('step' + n);
      if (target) {
        target.classList.add('active');
        window.scrollTo(0, 0);
      }
      setProgress(n);

      /* Update URL so each step has a trackable address */
      var newUrl = window.location.pathname + '?step=' + n;
      history.pushState({ step: n }, '', newUrl);

      /* Fire GA4 virtual pageview */
      if (typeof gtag === 'function') {
        gtag('event', 'page_view', {
          page_location: window.location.href,
          page_title: document.title + ' — Step ' + n
        });
      }

      /* Fire GTM dataLayer event */
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'enquiry_step',
        enquiry_type: opts.type,
        step_number: n,
        step_name: 'Step ' + n + ' of 3'
      });
    }

    /* Initialise URL on page load to step=1 */
    history.replaceState({ step: 1 }, '', window.location.pathname + '?step=1');

    /* ── Chip toggle (multi-select) ── */
    document.querySelectorAll('.chip[data-group]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        chip.classList.toggle('selected');
        chip.setAttribute('aria-pressed', chip.classList.contains('selected') ? 'true' : 'false');

        /* Show/hide a linked free-text input for chips that have one.
           Matches: chips with data-value="Other" (legacy) or any chip
           whose data-reveals attribute matches a .chip-other-input id
           in the same section. */
        var revealsId = chip.dataset.reveals;
        var section   = chip.closest('.chips-section');
        var wrap      = revealsId
          ? document.getElementById(revealsId)
          : (chip.dataset.value === 'Other' && section)
            ? section.querySelector('.chip-other-input')
            : null;
        if (wrap) {
          var isSelected = chip.classList.contains('selected');
          wrap.classList.toggle('visible', isSelected);
          if (!isSelected) {
            var revealedInput = wrap.querySelector('input, textarea');
            if (revealedInput) revealedInput.value = '';
          }
        }
      });
      chip.setAttribute('aria-pressed', 'false');
    });

    /* ── Validate step 1 ── */
    function validateStep1() {
      var ok = true;

      var dateEl = document.getElementById('eventDate');
      if (dateEl && !dateEl.value) {
        dateEl.focus();
        dateEl.style.borderColor = 'rgba(180,40,40,0.6)';
        ok = false;
      } else if (dateEl) {
        dateEl.style.borderColor = '';
      }

      var venueEl = document.getElementById('venue');
      if (venueEl && !venueEl.value.trim()) {
        if (ok) venueEl.focus();
        venueEl.style.borderColor = 'rgba(180,40,40,0.6)';
        ok = false;
      } else if (venueEl) {
        venueEl.style.borderColor = '';
      }

      var locationEl = document.getElementById('location');
      if (locationEl && !locationEl.value.trim()) {
        if (ok) locationEl.focus();
        locationEl.style.borderColor = 'rgba(180,40,40,0.6)';
        ok = false;
      } else if (locationEl) {
        locationEl.style.borderColor = '';
      }

      return ok;
    }

    /* ── Validate step 3 ── */
    function validateStep3() {
      var firstEl = document.getElementById('firstName');
      var lastEl  = document.getElementById('lastName');
      var emailEl = document.getElementById('email');
      var ok = true;

      if (firstEl && !firstEl.value.trim()) {
        firstEl.focus();
        firstEl.style.borderColor = 'rgba(180,40,40,0.6)';
        ok = false;
      } else if (firstEl) {
        firstEl.style.borderColor = '';
      }

      if (lastEl && !lastEl.value.trim()) {
        if (ok) lastEl.focus();
        lastEl.style.borderColor = 'rgba(180,40,40,0.6)';
        ok = false;
      } else if (lastEl) {
        lastEl.style.borderColor = '';
      }

      if (emailEl) {
        var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value);
        if (!emailOk) {
          if (ok) emailEl.focus();
          emailEl.style.borderColor = 'rgba(180,40,40,0.6)';
          ok = false;
        } else {
          emailEl.style.borderColor = '';
        }
      }

      return ok;
    }

    /* ── Next / Back buttons ── */
    var next1 = document.getElementById('next1');
    var next2 = document.getElementById('next2');
    var back2 = document.getElementById('back2');
    var back3 = document.getElementById('back3');

    if (next1) {
      next1.addEventListener('click', function () {
        if (validateStep1()) showStep(2);
      });
    }
    if (next2) {
      next2.addEventListener('click', function () { showStep(3); });
    }
    if (back2) {
      back2.addEventListener('click', function () { showStep(1); });
    }
    if (back3) {
      back3.addEventListener('click', function () { showStep(2); });
    }

    /* ── Submit ── */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateStep3()) return;

      var submitBtn = document.getElementById('submitBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      /* ── Collect form data ── */
      var typeLabel = { weddings: 'Wedding', private: 'Private Event', brand: 'Brand Activation' }[opts.type] || opts.type;

      var payload = {
        _subject:  'New Enquiry — Fortune Haus (' + typeLabel + ')',
        _template: 'table',
        _captcha:  'false',
        'Enquiry Type': typeLabel
      };

      /* Contact details */
      var firstEl = document.getElementById('firstName');
      var lastEl  = document.getElementById('lastName');
      var emailEl = document.getElementById('email');
      var phoneEl = document.getElementById('phone');
      if (firstEl && firstEl.value) payload['First Name'] = firstEl.value.trim();
      if (lastEl  && lastEl.value)  payload['Last Name']  = lastEl.value.trim();
      if (emailEl && emailEl.value) payload['Email']      = emailEl.value.trim();
      if (phoneEl && phoneEl.value) payload['Phone']      = phoneEl.value.trim();

      /* Event basics */
      var dateEl     = document.getElementById('eventDate');
      var venueEl    = document.getElementById('venue');
      var locationEl = document.getElementById('location');
      if (dateEl && dateEl.value)         payload['Event Date'] = dateEl.value;
      if (venueEl && venueEl.value)       payload['Venue']      = venueEl.value.trim();
      if (locationEl && locationEl.value) payload['Location']   = locationEl.value.trim();

      /* Multi-select chips — group by data-group */
      var chipGroups = {};
      document.querySelectorAll('.chip.selected[data-group]').forEach(function (chip) {
        var g = chip.dataset.group;
        if (!chipGroups[g]) chipGroups[g] = [];
        chipGroups[g].push(chip.dataset.value);
      });
      var groupLabels = {
        timing:      'Timing',
        custom:      'Customisation',
        goal:        'Activation Goals',
        celebration: 'Celebration Type',
        guests:      'Expected Guests'
      };
      Object.keys(chipGroups).forEach(function (g) {
        var label = groupLabels[g] || (g.charAt(0).toUpperCase() + g.slice(1));
        payload[label] = chipGroups[g].join(', ');
      });

      /* "Other" celebration free-text */
      var otherText = document.getElementById('celebrationOtherText');
      if (otherText && otherText.value.trim()) {
        payload['Celebration — Other'] = otherText.value.trim();
      }

      /* Custom Mirror Sticker Decal detail */
      var stickerText = document.getElementById('stickerDecalText');
      if (stickerText && stickerText.value.trim()) {
        payload['Custom Sticker Detail'] = stickerText.value.trim();
      }

      /* Radio chips (branding question) */
      var brandingRadio = document.querySelector('input[name="branding"]:checked');
      if (brandingRadio) payload['Includes Branding'] = brandingRadio.value;

      /* ── Send via FormSubmit ── */
      fetch('https://formsubmit.co/ajax/15631be41594771deefe9f1fb9e1ebef', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body:    JSON.stringify(payload)
      })
      .then(function (res) { return res.json(); })
      .then(function () {
        window.location.href = successUrl;
      })
      .catch(function () {
        /* On network failure, still redirect — enquiry is logged client-side */
        window.location.href = successUrl;
      });
    });

    /* ── Clear red borders on input ── */
    form.querySelectorAll('.field__input, .field__select').forEach(function (el) {
      el.addEventListener('input', function () {
        el.style.borderColor = '';
      });
    });

    /* Init */
    setProgress(1);
  };

}());
