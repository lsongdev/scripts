import { setPositionFromEvent } from '../dom.js';

class MovementBox extends HTMLElement {
  constructor() {
    super();
    this.style.position = 'absolute';
  }
  connectedCallback() {
    this.addEventListener('mousedown', () => this.isDown = true, true);
    this.addEventListener('mouseout', () => this.isDown = false, true);
    this.addEventListener('mouseup', () => this.isDown = false, true);
    this.addEventListener('mousemove', e => {
      e.preventDefault();
      if (this.isDown) {
        setPositionFromEvent(e);
      }
    }, true);
  }
}

customElements.define('move-box', MovementBox);
