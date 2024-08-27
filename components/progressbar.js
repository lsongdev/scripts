
class ProgressBar extends HTMLElement {
  constructor() {
    super();
    this.progress = 0; // Internal value to store the progress value
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadow.innerHTML = `
      <style>
      @import url("https://lsong.org/stylesheets/progressbar.css");
      </style>
      <div class="progress-bar" >
        <div class="progress-bar-inner" ></div>
      </div>
    `;
    this.myBar = this.shadow.querySelector('.progress-bar');
    this.updateBar();
  }

  static get observedAttributes() {
    return ['value'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'value') {
      // Prevent recursive call by checking if the new value is different
      newValue = parseFloat(newValue);
      if (newValue !== this.progress) {
        this.value = newValue; // Set through property to handle rounding
      }
    }
  }

  get value() {
    return this.progress;
  }

  set value(newValue) {
    newValue = Math.min(Math.max(newValue, 0), 100); // Clamp the value between 0 and 100
    if (newValue !== this.progress) {
      this.progress = newValue;
      this.updateBar(); // Update the bar display
      // Reflect the property to the attribute only if it's different
      this.setAttribute('value', this.progress.toString());
    }
  }

  updateBar() {
    // Ensure the element is connected and `myBar` is defined.
    if (this.myBar) {
      const roundedValue = this.progress.toFixed(2); // Round to two decimal places
      this.myBar.style.width = roundedValue + '%';
      this.myBar.textContent = roundedValue + '%';
    }
  }
}

customElements.define('progress-bar', ProgressBar);
