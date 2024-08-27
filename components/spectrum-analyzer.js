class SpectrumAnalyzer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.options = {
      barWidth: 'auto',
      barSpacing: 1,
      minHeight: 2,
      maxHeight: 200,
      minDecibels: -100,
      maxDecibels: -30,
      smoothingTimeConstant: 0.8,
      colorMode: 'gradient',
      baseColor: [200, 50, 50],
      gradientColors: [
        [200, 50, 50],
        [50, 200, 50],
        [50, 50, 200]
      ],
      fftSize: 256
    };
  }

  static get observedAttributes() {
    return ['bar-width', 'bar-spacing', 'min-height', 'max-height', 'color-mode', 'base-color', 'fft-size'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'bar-width':
        this.options.barWidth = parseFloat(newValue) || 'auto';
        break;
      case 'bar-spacing':
        this.options.barSpacing = parseFloat(newValue) || 1;
        break;
      case 'min-height':
        this.options.minHeight = parseFloat(newValue) || 2;
        break;
      case 'max-height':
        this.options.maxHeight = parseFloat(newValue) || 200;
        break;
      case 'color-mode':
        this.options.colorMode = newValue === 'gradient' ? 'gradient' : 'solid';
        break;
      case 'base-color':
        this.options.baseColor = this.parseColor(newValue) || [200, 50, 50];
        break;
      case 'fft-size':
        const size = parseInt(newValue);
        if (this.isValidFFTSize(size)) {
          this.options.fftSize = size;
          if (this.analyser) {
            this.analyser.fftSize = size;
          }
        }
        break;
    }
    this.updateCanvas();
  }

  isValidFFTSize(size) {
    return size && (size & (size - 1)) === 0 && size >= 32 && size <= 32768;
  }

  parseColor(color) {
    const match = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : null;
  }

  connectedCallback() {
    this.render();
    this.updateCanvas();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: ${this.options.maxHeight}px;
        }
        canvas {
          width: 100%;
          height: 100%;
          background-color: #000;
        }
      </style>
      <canvas></canvas>`;
    this.canvas = this.shadowRoot.querySelector('canvas');
    this.canvasCtx = this.canvas.getContext('2d');
  }

  updateCanvas() {
    if (this.canvas) {
      this.canvas.width = this.clientWidth;
      this.canvas.height = this.options.maxHeight;
      this.calculateBarWidth();
    }
  }

  calculateBarWidth() {
    if (this.analyser) {
      const bufferLength = this.analyser.frequencyBinCount;
      if (this.options.barWidth === 'auto') {
        const totalSpacing = (bufferLength - 1) * this.options.barSpacing;
        this.effectiveBarWidth = (this.canvas.width - totalSpacing) / bufferLength;
      } else {
        this.effectiveBarWidth = this.options.barWidth;
      }
    }
  }

  setAnalyser(analyser) {
    this.analyser = analyser;
    this.analyser.fftSize = this.options.fftSize;
    this.analyser.minDecibels = this.options.minDecibels;
    this.analyser.maxDecibels = this.options.maxDecibels;
    this.analyser.smoothingTimeConstant = this.options.smoothingTimeConstant;
    this.calculateBarWidth();
    this.drawSpectrum();
  }

  drawSpectrum() {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      requestAnimationFrame(draw);
      this.analyser.getByteFrequencyData(dataArray);

      this.canvasCtx.fillStyle = 'rgb(0, 0, 0)';
      this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const percent = dataArray[i] / 255;
        const barHeight = (percent * (this.options.maxHeight - this.options.minHeight)) + this.options.minHeight;
        const [r, g, b] = this.options.colorMode === 'gradient' ? this.getGradientColor(percent) : this.options.baseColor;
        this.canvasCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        this.canvasCtx.fillRect(x, this.canvas.height - barHeight, this.effectiveBarWidth, barHeight);
        x += this.effectiveBarWidth + this.options.barSpacing;
      }
    };

    draw();
  }

  getGradientColor(percent) {
    const colors = this.options.gradientColors;
    const index = percent * (colors.length - 1);
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);
    const blend = index - lowerIndex;

    return colors[lowerIndex].map((start, i) => {
      const end = colors[upperIndex][i];
      return Math.round(start + blend * (end - start));
    });
  }
}

customElements.define('spectrum-analyzer', SpectrumAnalyzer);
