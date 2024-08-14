class SpectrumAnalyzer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
            <style>
                canvas { width: 100%; height: 200px; background-color: #000; }
            </style>
            <canvas></canvas>
        `;
    this.canvas = this.shadowRoot.querySelector('canvas');
    this.canvasCtx = this.canvas.getContext('2d');
  }

  setAnalyser(analyser) {
    this.analyser = analyser;
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

      const barWidth = (this.canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        this.canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
        this.canvasCtx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();
  }
}

customElements.define('spectrum-analyzer', SpectrumAnalyzer);
