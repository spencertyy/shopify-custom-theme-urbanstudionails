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
 */
(function () {
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
      if (record.target.hasAttribute('open')) onOpen(record.target);
    });
  });

  const watch = () => {
    document.querySelectorAll('product-modal').forEach((modal) => {
      if (modal.dataset.lightboxWatched) return;
      modal.dataset.lightboxWatched = '1';
      observer.observe(modal, { attributes: true, attributeFilter: ['open'] });
    });
  };
  watch();
  document.addEventListener('shopify:section:load', watch);
})();
