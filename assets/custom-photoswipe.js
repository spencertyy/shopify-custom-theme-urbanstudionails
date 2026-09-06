/**
 * PhotoSwipe 5 on the product page.
 *
 * Reads the media list that main-product.liquid prints as JSON, then takes
 * over the two things that used to open Dawn's media modal: the zoom button
 * on each product image, and the "Size Chart" link (which opens the chart
 * image as a one-picture lightbox instead of a scrolling pop-up).
 *
 * The click listener runs in the capture phase and stops propagation, so
 * Dawn's own <modal-opener> never sees the click. Videos / 3D media are not
 * in the list and still fall through to Dawn's modal.
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
    showHideAnimationType: 'fade',
    counter: true,
    arrowPrev: true,
    arrowNext: true,
  };

  const gallery = new PhotoSwipeLightbox({ ...common, dataSource: cfg.media });
  gallery.init();

  let chart = null;
  const openChart = async () => {
    if (!cfg.sizeChart) return false;
    if (!chart) {
      const img = new Image();
      const size = await new Promise((resolve) => {
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve(null);
        img.src = cfg.sizeChart;
      });
      if (!size) return false;
      chart = new PhotoSwipeLightbox({
        ...common,
        counter: false,
        arrowPrev: false,
        arrowNext: false,
        dataSource: [{ src: cfg.sizeChart, width: size.w, height: size.h, alt: 'Size chart' }],
      });
      chart.init();
    }
    chart.loadAndOpen(0);
    return true;
  };

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
      const chartButton = event.target.closest('.size-chart-inline__button, .product-popup-modal__button');
      if (chartButton && cfg.sizeChart) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openChart();
      }
    },
    true
  );
})();
