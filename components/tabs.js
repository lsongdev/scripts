
function getTabs(el) {
  return Array.from(el.querySelectorAll('[role="tablist"] [role="tab"]')).filter(
    tab => tab instanceof HTMLElement && tab.closest(el.tagName) === el
  )
}

class TabContainer extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', (event) => {
      const tabs = getTabs(this);
      if (!(event.target instanceof Element)) return
      if (event.target.closest(this.tagName) !== this) return

      const tab = event.target.closest('[role="tab"]')
      if (!(tab instanceof HTMLElement) || !tab.closest('[role="tablist"]')) return

      const index = tabs.indexOf(tab)
      this.selectTab(index)
    })
  }
  connectedCallback() {
    for (const tab of getTabs(this)) {
      if (!tab.hasAttribute('aria-selected')) {
        tab.setAttribute('aria-selected', 'false')
      }
      console.log(tab);
    }
  }
  selectTab(index) {
    const tabs = getTabs(this)
    const panels = Array.from(this.querySelectorAll('[role="tabpanel"]')).filter(
      panel => panel.closest(this.tagName) === this
    );

    if (index > tabs.length - 1) {
      throw new RangeError(`Index "${index}" out of bounds`)
    }

    const selectedTab = tabs[index]
    const selectedPanel = panels[index]
    for (const tab of tabs) {
      tab.setAttribute('aria-selected', 'false')
    }
    for (const panel of panels) {
      panel.hidden = true;
    }
    selectedPanel.hidden = false;
    selectedTab.setAttribute('aria-selected', 'true')
    // console.log('selectTab', index, selectedTab, selectedPanel);
    this.dispatchEvent(
      new CustomEvent('tab-container-changed', {
        bubbles: true,
        detail: { relatedTarget: selectedPanel }
      })
    )
  }
}

customElements.define('tab-container', TabContainer);
