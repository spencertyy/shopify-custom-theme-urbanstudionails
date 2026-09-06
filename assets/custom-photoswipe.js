/**
 * PhotoSwipe 5 on the product page.
 *
 * Reads the media list that main-product.liquid prints as JSON, then takes
 * over the zoom button on each product image (the size chart keeps Dawn's
 * own pop-up). The click listener runs in the capture phase and stops
 * propagation, so Dawn's <modal-opener> never sees the click. Videos / 3D
 * media are not in the list and still fall through to Dawn's modal.
 */
(async () => {
  const dataEl = document.querySelector('[data-product-lightbox]');
  if (!dataEl) return;
  let cfg;
  try { cfg = JSON.parse(dataEl.textContent); } catch (e) { return; }
  const { default: PhotoSwipeLightbox } = await import(dataEl.dataset.lightboxModule);
  const pswpModule = () => import(dataEl.dataset.coreModule);

  const common = {
    pswpModule,
    bgOpacity: 1,
    padding: { top: 24, bottom: 24, left: 12, right: 12 },
    initialZoomLevel: 'fit',
    secondaryZoomLevel: 2.5,
    maxZoomLevel: 5,
    closeOnVerticalDrag: true,
    pinchToClose: true,
    wheelToZoom: true,
    showHideAnimationType: 'none',
    counter: true,
    arrowPrev: true,
    arrowNext: true,
  };

  const gallery = new PhotoSwipeLightbox({ ...common, dataSource: cfg.media });
  gallery.init();

  document.addEventListener(
    'click',
    (event) => {
      const toggle = event.target.closest('.product__media-toggle');
      if (toggle) {
        const index = cfg.media.findIndex((m) => String(m.id) === String(toggle.dataset.mediaId));
        if (index === -1) return; // video / model: let Dawn handle it
        event.preventDefault();
        event.stopImmediatePropagation();
        gallery.loadAndOpen(index);
        return;
      }
    },
    true
  );
})();
