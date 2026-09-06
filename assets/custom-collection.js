/**
 * Sort control for the collection toolbar.
 *
 * The visible list is ours; the value lives in the <select> Dawn renders
 * inside the filter drawer. Choosing an option writes to that select and
 * fires an input event, which is what facets.js listens for — so sorting
 * still goes through Dawn's fetch-and-swap, with no page reload.
 *
 * Only one panel is open at a time, and either closes on an outside tap.
 */
(function () {
  const closeAll = (except) => {
    document.querySelectorAll('[data-collection-sort][open]').forEach((el) => {
      if (el !== except) el.open = false;
    });
    document.querySelectorAll('.mobile-facets__wrapper .disclosure-has-popup[open]').forEach((el) => {
      if (el !== except) el.querySelector('summary')?.click();
    });
  };

  document.addEventListener('click', (event) => {
    const sortDetails = event.target.closest('[data-collection-sort]');
    const filterDetails = event.target.closest('.mobile-facets__wrapper .disclosure-has-popup');

    if (sortDetails) {
      const option = event.target.closest('.collection-sort__option');
      if (option) {
        const select = document.querySelector('#SortBy-mobile, #SortBy');
        if (select) {
          select.value = option.dataset.value;
          select.dispatchEvent(new Event('input', { bubbles: true }));
        }
        sortDetails.querySelectorAll('.collection-sort__option').forEach((el) => {
          if (el === option) el.setAttribute('aria-current', 'true');
          else el.removeAttribute('aria-current');
        });
        const label = sortDetails.querySelector('[data-sort-label]');
        if (label) label.textContent = option.textContent.trim();
        sortDetails.open = false;
        return;
      }
      // clicking the summary: let the browser toggle it, just close the other one
      closeAll(sortDetails);
      return;
    }

    if (filterDetails) {
      closeAll(filterDetails);
      return;
    }

    closeAll(null);
  });
})();
