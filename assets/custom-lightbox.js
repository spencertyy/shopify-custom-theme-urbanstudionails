/**
 * Turns Dawn's product media modal into a swipeable, fitted lightbox.
 *
 * Dawn's ProductModal (product-modal.js) keeps every media item in one
 * scrollable box and shows the clicked one at full size. custom-product-media.css
 * lays those items out as full-screen, scroll-snapped slides instead; this
 * script adds what CSS can't: jumping to the clicked slide, a "2 / 4" counter,
 * prev/next arrows for pointer users, and arrow-key navigation.
 *
 * It hooks in by watching the modal's `open` attribute, so Dawn's own
 * show()/hide() and the opener buttons stay untouched.
 *
 * Two more things live here because they need the same hook:
 *  - a body scroll lock that iOS Safari actually respects (Dawn only sets
 *    overflow:hidden on <body>, which iOS ignores for touch scrolling, so the
 *    page behind a modal rubber-bands and the modal drifts with it);
 *  - drag-to-dismiss on the lightbox: a vertical swipe moves the image and
 *    fades the backdrop; past a threshold it closes, otherwise it snaps back.
 */
(function () {
  /* ---- body scroll lock ---- */
  const lock = { on: false, y: 0 };
  function lockBody() {
    if (lock.on) return;
    lock.on = true;
    lock.y = window.scrollY;
    const b = document.body.style;
    b.position = 'fixed';
    b.top = -lock.y + 'px';
    b.left = '0';
    b.right = '0';
    b.width = '100%';
  }
  function unlockBody() {
    if (!lock.on) return;
    lock.on = false;
    const b = document.body.style;
    b.position = b.top = b.left = b.right = b.width = '';
    window.scrollTo(0, lock.y);
  }

  /* ---- drag to dismiss (touch only) ---- */
  function enableDrag(modal) {
    const { content } = modal._lightbox;
    const dialog = modal.querySelector('.product-media-modal__dialog');
    let startX = 0, startY = 0, dy = 0, axis = null, active = false;
    const setAlpha = (a) => dialog.style.setProperty('--lightbox-bg-alpha', String(a));
    dialog.style.transition = 'background-color 0.18s ease';
    const reset = () => {
      content.style.transition = 'transform 0.25s ease';
      content.style.transform = '';
      setAlpha(1);
    };
    content.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      axis = null; dy = 0; active = true;
      content.style.transition = 'none';
    }, { passive: true });
    content.addEventListener('touchmove', (e) => {
      if (!active) return;
      const dx = e.touches[0].clientX - startX;
      const ddy = e.touches[0].clientY - startY;
      if (!axis) {
        if (Math.abs(dx) < 6 && Math.abs(ddy) < 6) return;
        axis = Math.abs(dx) > Math.abs(ddy) ? 'x' : 'y';
      }
      if (axis !== 'y') return;
      e.preventDefault();
      dy = ddy;
      content.style.transform = 'translateY(' + dy + 'px)';
      // Backdrop steps aside as soon as the drag is vertical, so only the
      // photo moves and the page shows right up to its edges - no white band.
      setAlpha(0);
    }, { passive: false });
    const end = () => {
      if (!active) return;
      active = false;
      if (axis === 'y' && Math.abs(dy) > 110) {
        content.style.transition = 'transform 0.2s ease';
        content.style.transform = 'translateY(' + (dy > 0 ? '100vh' : '-100vh') + ')';
        setAlpha(0);
        setTimeout(() => { modal.hide(); reset(); }, 200);
      } else {
        reset();
      }
    };
    content.addEventListener('touchend', end);
    content.addEventListener('touchcancel', end);
    modal._lightbox.reset = reset;
  }

  function enhance(modal) {
    if (modal.dataset.lightboxReady) return;
    modal.dataset.lightboxReady = '1';

    const dialog = modal.querySelector('.product-media-modal__dialog');
    const content = modal.querySelector('.product-media-modal__content');
    const slides = () => Array.from(content.children);
    const index = () => Math.round(content.scrollLeft / Math.max(content.clientWidth, 1));

    const counter = document.createElement('div');
    counter.className = 'custom-lightbox__counter';
    counter.setAttribute('aria-live', 'polite');

    const arrow = (dir) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'custom-lightbox__arrow custom-lightbox__arrow--' + dir;
      button.setAttribute('aria-label', dir === 'prev' ? 'Previous image' : 'Next image');
      button.innerHTML = dir === 'prev' ? '&#8249;' : '&#8250;';
      // Dawn closes a media modal on any mouse pointerup outside a video; keep
      // clicks on the arrows from reaching that handler.
      button.addEventListener('pointerup', (event) => event.stopPropagation());
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        go(dir === 'prev' ? -1 : 1);
      });
      return button;
    };
    const prev = arrow('prev');
    const next = arrow('next');
    dialog.append(prev, next, counter);

    const update = () => {
      const total = slides().length;
      counter.textContent = index() + 1 + ' / ' + total;
      prev.hidden = next.hidden = total < 2;
    };
    const go = (delta) => {
      const total = slides().length;
      const target = Math.min(total - 1, Math.max(0, index() + delta));
      content.scrollTo({ left: target * content.clientWidth, behavior: 'smooth' });
    };

    let timer;
    content.addEventListener(
      'scroll',
      () => {
        clearTimeout(timer);
        timer = setTimeout(update, 80);
      },
      { passive: true }
    );
    modal.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') go(1);
      if (event.key === 'ArrowLeft') go(-1);
    });

    modal._lightbox = { content, slides, update };
    enableDrag(modal);
  }

  function onOpen(modal) {
    enhance(modal);
    const { content, slides, update } = modal._lightbox;
    const wanted = modal.openedBy && modal.openedBy.getAttribute('data-media-id');
    const target = Math.max(
      0,
      slides().findIndex((el) => el.getAttribute('data-media-id') === wanted)
    );
    // Dawn's show() has just scrolled the box to its own idea of "centred";
    // land on the clicked slide after that settles.
    requestAnimationFrame(() => {
      content.scrollLeft = target * content.clientWidth;
      update();
    });
  }

  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      const el = record.target;
      const isOpen = el.hasAttribute('open');
      if (isOpen) lockBody(); else if (!document.querySelector('product-modal[open], modal-dialog[open]')) unlockBody();
      if (el.tagName === 'PRODUCT-MODAL') {
        if (isOpen) onOpen(el);
        else if (el._lightbox && el._lightbox.reset) el._lightbox.reset();
      }
    });
  });

  const watch = () => {
    document.querySelectorAll('product-modal, modal-dialog').forEach((modal) => {
      if (modal.dataset.lightboxWatched) return;
      modal.dataset.lightboxWatched = '1';
      observer.observe(modal, { attributes: true, attributeFilter: ['open'] });
    });
  };
  watch();
  document.addEventListener('shopify:section:load', watch);
})();
