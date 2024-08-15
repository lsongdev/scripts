class LocalStorageBackup extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
      :host {
        display: block;
        margin: 10px 0;
      }
      button {
        margin: 5px;
        padding: 5px 10px;
        cursor: pointer;
      }
      </style>
      <button id="import">Import</button>
      <button id="export">Export</button>
      <input type="file" id="fileInput" style="display: none;">
    `;
  }

  setupEventListeners() {
    const exportBtn = this.shadowRoot.getElementById('export');
    const importBtn = this.shadowRoot.getElementById('import');
    const fileInput = this.shadowRoot.getElementById('fileInput');

    exportBtn.addEventListener('click', () => this.exportLocalStorage());
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (event) => this.importLocalStorage(event));
  }

  exportLocalStorage() {
    const data = JSON.stringify(localStorage);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'localStorage_backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  importLocalStorage(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          localStorage.clear();
          Object.keys(data).forEach(key => {
            localStorage.setItem(key, data[key]);
          });
          this.dispatchEvent(new CustomEvent('storage-imported', { bubbles: true, composed: true }));
        } catch (error) {
          console.error('Error importing data:', error);
        }
      };
      reader.readAsText(file);
    }
  }
}

customElements.define('local-storage-backup', LocalStorageBackup);