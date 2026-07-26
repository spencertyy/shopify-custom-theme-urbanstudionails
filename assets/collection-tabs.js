class CollectionTabs extends HTMLElement {
  constructor() {
    super();
    this.tabs = Array.from(this.querySelectorAll('[role="tab"]'));
    this.panels = Array.from(this.querySelectorAll('[role="tabpanel"]'));
  }

  connectedCallback() {
    this.tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => this.select(index));
      tab.addEventListener('keydown', (event) => this.onKeydown(event, index));
    });
  }

  select(index) {
    this.tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', selected);
      tab.tabIndex = selected ? 0 : -1;
      if (this.panels[i]) this.panels[i].hidden = !selected;
    });
    this.tabs[index].focus({ preventScroll: true });
  }

  onKeydown(event, index) {
    const keys = {
      ArrowRight: (index + 1) % this.tabs.length,
      ArrowLeft: (index - 1 + this.tabs.length) % this.tabs.length,
      Home: 0,
      End: this.tabs.length - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    this.select(keys[event.key]);
  }
}

customElements.define('collection-tabs', CollectionTabs);
