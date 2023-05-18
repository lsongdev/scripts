
const stylesheet = `
<style>
  #myProgress {
    width: 300px;
    background-color: #ddd;
  }
  #myBar {
    width: 0%;
    height: 20px;
    color: white;
    text-align: center;
    background-color: #04AA6D;
  }
</style>
`;

class ProgressBar extends HTMLElement {
  constructor() {
    super();
    this.progress = 0; // Internal value to store the progress value
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadow.innerHTML = `
      ${stylesheet}
      <div id="myProgress">
        <div id="myBar">0%</div>
      </div>
    `;
    this.myBar = this.shadow.querySelector('#myBar');
    this.updateBar(); // Set initial value
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
