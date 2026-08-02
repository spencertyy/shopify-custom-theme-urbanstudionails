/**
 * Clickwrap consent gate for the cart.
 *
 * Shopify's hosted checkout can't carry a consent checkbox without Shopify Plus,
 * so consent is captured in the cart instead. Blocking has to cover every way a
 * customer can reach checkout from a given cart UI:
 *   1. the checkout <button name="checkout">
 *   2. submitting the cart form some other way (Enter key)
 *   3. the dynamic wallet buttons (Shop Pay / PayPal / Google Pay), which render
 *      inside third-party iframes we can't touch from JS — those are neutralised
 *      with the `inert` attribute plus a CSS pointer-events fallback.
 */
class TermsAgreement extends HTMLElement {
  connectedCallback() {
    this.checkbox = this.querySelector('.terms-agreement__checkbox');
    this.errorEl = this.querySelector('.terms-agreement__error');
    if (!this.checkbox) return;

    // Walk up until we find the container that also holds the checkout button.
    // Each cart surface (page / drawer / notification) nests differently, so a
    // fixed selector would silently miss one of them.
    this.scope = this.findScope();
    if (!this.scope) return;

    this.checkoutButton = this.scope.querySelector('[name="checkout"]');
    this.walletButtons = this.scope.querySelector('.additional-checkout-buttons');
    this.form = this.checkoutButton?.form || this.scope.querySelector('form');

    this.checkbox.addEventListener('change', () => this.sync());

    // Capture phase so we run before Dawn's own cart handlers.
    this.checkoutButton?.addEventListener('click', (event) => this.guard(event), true);
    this.form?.addEventListener('submit', (event) => this.guard(event), true);

    this.sync();
  }

  findScope() {
    let node = this.parentElement;
    while (node && node !== document.body) {
      if (node.querySelector('[name="checkout"]')) return node;
      node = node.parentElement;
    }
    return null;
  }

  get agreed() {
    return this.checkbox.checked;
  }

  /**
   * Reflect consent state in the UI. Uses aria-disabled rather than the disabled
   * attribute: a truly disabled button is skipped by screen reader tab order and
   * fires no click event, so the customer gets no explanation for why checkout
   * won't proceed. aria-disabled keeps it focusable and announced, and `guard()`
   * does the actual blocking.
   *
   * Note: Dawn already sets the real `disabled` attribute when the cart is empty.
   * That case is left alone — this only manages the consent layer.
   */
  sync() {
    const agreed = this.agreed;

    if (this.checkoutButton) {
      this.checkoutButton.setAttribute('aria-disabled', String(!agreed));
      this.checkoutButton.classList.toggle('cart__checkout-button--blocked', !agreed);
    }

    if (this.walletButtons) {
      this.walletButtons.toggleAttribute('inert', !agreed);
      this.walletButtons.classList.toggle('additional-checkout-buttons--blocked', !agreed);
    }

    if (agreed) this.hideBlockedFeedback();
  }

  /** Stops the checkout attempt when consent hasn't been given. */
  guard(event) {
    if (this.agreed) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.showBlockedFeedback();
  }

  /**
   * TODO — this one is yours. See the notes in LEGAL_POLICY_UPDATES.md.
   *
   * Right now this does the bare minimum: it reveals the error message. That is
   * enough to be correct, but probably not enough to be kind — on a long cart
   * page the customer may have tapped a checkout button that is nowhere near the
   * checkbox, so the message they need is off screen and nothing appears to
   * happen. You know how your customers actually shop; decide what should happen.
   *
   * Things worth considering (pick what fits, they trade off against each other):
   *   - this.checkbox.focus()                  → jumps focus to the control, best for keyboard and screen reader users
   *   - this.scrollIntoView({ behavior: 'smooth', block: 'center' })  → brings it on screen, but can feel jarring mid-tap
   *   - a brief shake/highlight class on the row → draws the eye without moving the page
   *   - doing nothing extra on mobile, where the cart is short anyway
   */
  showBlockedFeedback() {
    this.errorEl?.removeAttribute('hidden');
  }

  hideBlockedFeedback() {
    this.errorEl?.setAttribute('hidden', '');
  }
}

customElements.define('terms-agreement', TermsAgreement);
