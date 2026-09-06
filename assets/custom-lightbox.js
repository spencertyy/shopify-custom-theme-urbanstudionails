/**
 * Body scroll lock for Dawn's remaining modals (pickup availability, any
 * pop-up that still uses <modal-dialog>). Dawn only sets overflow:hidden on
 * <body>, which iOS Safari ignores for touch scrolling, so the page behind a
 * modal rubber-bands and the modal drifts with it. Fixing the body in place
 * (and restoring the scroll position on close) is what iOS respects.
 *
 * Product images and the size chart open in PhotoSwipe (custom-photoswipe.js),
 * which brings its own lock.
 */
(function () {
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
  const observer = new MutationObserver(() => {
    if (document.querySelector('product-modal[open], modal-dialog[open]')) lockBody();
    else unlockBody();
  });
  const watch = () => {
    document.querySelectorAll('product-modal, modal-dialog').forEach((modal) => {
      if (modal.dataset.lockWatched) return;
      modal.dataset.lockWatched = '1';
      observer.observe(modal, { attributes: true, attributeFilter: ['open'] });
    });
  };
  watch();
  document.addEventListener('shopify:section:load', watch);
})();
