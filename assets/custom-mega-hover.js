/*
  Opens the desktop mega menu on hover as well as on click.

  Dawn only opens it on click because the panel lives inside a <details>, and a
  browser will not render the contents of a closed <details> whatever CSS says —
  the open attribute is the only switch, and CSS cannot set an attribute. Hence
  a script.

  Behaviour:
    hover in    → open
    hover out   → close, unless it was opened by a click
    click       → unchanged; the panel stays down until clicked again
    Escape      → close, and return focus to the summary

  Only runs where a pointer can actually hover. On a touchscreen the first tap
  would both open the menu and follow the link underneath, and there would be no
  way to hover out again.
*/
(function () {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var CLOSE_DELAY = 120;

  document.querySelectorAll('.header__inline-menu details.mega-menu').forEach(function (details) {
    var summary = details.querySelector('summary');
    if (!summary) return;

    var closeTimer = null;
    // Tracks how the menu was opened. A click should keep it open after the
    // pointer leaves; a hover should not.
    var openedByClick = false;

    function open() {
      window.clearTimeout(closeTimer);
      if (!details.hasAttribute('open')) {
        details.setAttribute('open', '');
        summary.setAttribute('aria-expanded', 'true');
      }
    }

    function close() {
      details.removeAttribute('open');
      summary.setAttribute('aria-expanded', 'false');
      openedByClick = false;
    }

    /* A short delay before closing: the pointer crosses a few pixels of gap
       between the summary and the panel, and closing instantly there makes the
       menu feel like it is fighting the user. */
    function scheduleClose() {
      if (openedByClick) return;
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(close, CLOSE_DELAY);
    }

    details.addEventListener('mouseenter', open);
    details.addEventListener('mouseleave', scheduleClose);

    /* By the time a click lands the pointer has already hovered in, so the menu
       is open and the browser's native toggle would close it — "click to open"
       would behave as "click to close".

       Rather than taking the click over entirely, which fights Dawn's own
       handler, the native toggle is suppressed only in the case where it would
       be wrong: the first click on a menu that hover has already opened. That
       click pins it instead. A second click is left alone, so the browser
       closes it exactly as it normally would. */
    summary.addEventListener('click', function (event) {
      if (openedByClick) {
        openedByClick = false;
        return;
      }
      if (details.hasAttribute('open')) {
        event.preventDefault();
        openedByClick = true;
      }
    });

    /* A pinned menu ignores the pointer leaving, so it needs some other way to
       be dismissed. */
    document.addEventListener('click', function (event) {
      if (!openedByClick) return;
      if (details.contains(event.target)) return;
      close();
    });

    details.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      close();
      summary.focus();
    });
  });
})();
