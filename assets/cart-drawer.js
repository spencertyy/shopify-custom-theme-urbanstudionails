class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
    this.setHeaderCartIconAccessibility();
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector('#cart-icon-bubble');
    cartLink.setAttribute('role', 'button');
    cartLink.setAttribute('aria-haspopup', 'dialog');
    cartLink.addEventListener('click', (event) => {
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'SPACE') {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {
      this.classList.add('animate', 'active');
    });

    this.addEventListener(
      'transitionend',
      () => {
        const containerToTrapFocusOn = this.classList.contains('is-empty')
          ? this.querySelector('.drawer__inner-empty') || document.getElementById('CartDrawer')
          : document.getElementById('CartDrawer');
        const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
        trapFocus(containerToTrapFocusOn, focusElement);
      },
      { once: true }
    );

    document.body.classList.add('overflow-hidden');
  }

  close() {
    this.classList.remove('active');
    removeTrapFocus(this.activeElement);
    document.body.classList.remove('overflow-hidden');
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute('role', 'button');
    cartDrawerNote.setAttribute('aria-expanded', 'false');

    if (cartDrawerNote.nextElementSibling.getAttribute('id')) {
      cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });

    cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  renderContents(parsedState) {
    this.querySelector('.drawer__inner').classList.contains('is-empty') &&
      this.querySelector('.drawer__inner').classList.remove('is-empty');
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id);
      sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
    });

    setTimeout(() => {
      this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
      this.open();
    });
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        selector: '#CartDrawer',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: 'CartDrawer',
        section: 'cart-drawer',
        selector: '.drawer__inner',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
    ];
  }
}

customElements.define('cart-drawer-items', CartDrawerItems);

class CartDrawerRecommendations extends HTMLElement {
  connectedCallback() {
    const url = this.dataset.url;
    if (!url) {
      // Empty-bag rail is server-rendered (best sellers) — no fetch,
      // but the + buttons still need their handler.
      if (this.querySelector('.cart-drawer-recommendations__card')) {
        this.addEventListener('click', this.onClick.bind(this));
      } else {
        this.hidden = true;
      }
      return;
    }
    fetch(url)
      .then((response) => response.text())
      .then((text) => {
        const html = new DOMParser().parseFromString(text, 'text/html');
        const inner = html.querySelector('.cart-drawer-recommendations__inner');
        if (inner && inner.querySelector('.cart-drawer-recommendations__card')) {
          this.innerHTML = inner.outerHTML;
          this.addEventListener('click', this.onClick.bind(this));
        } else {
          this.hidden = true;
        }
      })
      .catch(() => {
        this.hidden = true;
      });
  }

  onClick(event) {
    const plusButton = event.target.closest('.cart-drawer-recommendations__plus');
    if (!plusButton) return;
    event.preventDefault();
    let variants = [];
    try {
      variants = JSON.parse(plusButton.dataset.variants);
    } catch (e) {
      return;
    }
    const available = variants.filter((v) => v.available);
    if (available.length === 0) return;
    if (variants.length === 1) {
      this.addVariant(available[0].id);
    } else {
      this.openPicker(plusButton.dataset.productTitle, plusButton.dataset.optionName, variants);
    }
  }

  addVariant(variantId) {
    const cartDrawer = this.closest('cart-drawer');
    const config = fetchConfig('javascript');
    config.body = JSON.stringify({
      items: [{ id: variantId, quantity: 1 }],
      sections: cartDrawer.getSectionsToRender().map((section) => section.id),
      sections_url: window.location.pathname,
    });
    this.classList.add('is-adding');
    fetch(`${routes.cart_add_url}`, config)
      .then((response) => response.json())
      .then((parsedState) => {
        if (parsedState.status) return; // add failed (e.g. sold out) — keep the drawer as is
        cartDrawer.renderContents(parsedState);
      })
      .finally(() => {
        this.classList.remove('is-adding');
        this.closePicker();
      });
  }

  openPicker(title, optionName, variants) {
    this.closePicker();
    const drawerInner = this.closest('.drawer__inner');
    if (!drawerInner) return;

    const picker = document.createElement('div');
    picker.className = 'cart-recs-picker';
    picker.innerHTML = `
      <div class="cart-recs-picker__panel">
        <div class="cart-recs-picker__head">
          <p class="cart-recs-picker__title"></p>
          <button type="button" class="cart-recs-picker__close" aria-label="Close">&times;</button>
        </div>
        <p class="cart-recs-picker__label"></p>
        <div class="cart-recs-picker__options"></div>
      </div>`;
    picker.querySelector('.cart-recs-picker__title').textContent = title;
    picker.querySelector('.cart-recs-picker__label').textContent = optionName
      ? `Choose ${optionName.toLowerCase()}:`
      : 'Choose an option:';

    const options = picker.querySelector('.cart-recs-picker__options');
    variants.forEach((variant) => {
      const optionButton = document.createElement('button');
      optionButton.type = 'button';
      optionButton.className = 'cart-recs-picker__option';
      optionButton.textContent = variant.title;
      if (variant.available) {
        optionButton.addEventListener('click', () => {
          picker.classList.add('is-adding');
          this.addVariant(variant.id);
        });
      } else {
        optionButton.disabled = true;
      }
      options.appendChild(optionButton);
    });

    picker.addEventListener('click', (event) => {
      if (event.target === picker || event.target.closest('.cart-recs-picker__close')) this.closePicker();
    });

    drawerInner.appendChild(picker);
  }

  closePicker() {
    this.closest('.drawer__inner')
      ?.querySelectorAll('.cart-recs-picker')
      .forEach((picker) => picker.remove());
  }
}

customElements.define('cart-drawer-recommendations', CartDrawerRecommendations);
