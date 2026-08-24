import { defineElement } from './define.js';
import {
  createStorageSnapshot,
  parseStorageSnapshot,
  restoreStorageSnapshot,
  stringifyStorageSnapshot,
} from '../storage/snapshot.js';

export class StorageBackup extends HTMLElement {
  #storage = globalThis.localStorage;
  #url;

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const exportButton = document.createElement('button');
    exportButton.type = 'button';
    exportButton.textContent = 'Export';
    exportButton.part = 'export-button';
    const importButton = document.createElement('button');
    importButton.type = 'button';
    importButton.textContent = 'Import';
    importButton.part = 'import-button';
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.hidden = true;
    root.append(exportButton, importButton, input);
    exportButton.addEventListener('click', () => this.download());
    importButton.addEventListener('click', () => input.click());
    input.addEventListener('change', async () => {
      const [file] = input.files;
      if (!file) return;
      try {
        const count = await this.importFile(file);
        this.dispatchEvent(new CustomEvent('storageimport', { detail: { count } }));
      } catch (error) {
        this.dispatchEvent(new CustomEvent('storageerror', { detail: { error } }));
      } finally {
        input.value = '';
      }
    });
  }

  get storage() { return this.#storage; }
  set storage(value) { this.#storage = value; }

  disconnectedCallback() {
    if (this.#url) URL.revokeObjectURL(this.#url);
    this.#url = undefined;
  }

  exportText(space = 2) {
    return stringifyStorageSnapshot(createStorageSnapshot(this.#storage), space);
  }

  download(filename = 'storage-backup.json') {
    if (this.#url) URL.revokeObjectURL(this.#url);
    this.#url = URL.createObjectURL(new Blob([this.exportText()], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = this.#url;
    anchor.download = filename;
    anchor.click();
  }

  async importFile(file, { replace = this.hasAttribute('replace') } = {}) {
    const snapshot = parseStorageSnapshot(await file.text());
    return restoreStorageSnapshot(snapshot, { storage: this.#storage, replace });
  }
}

export const defineStorageBackup = registry =>
  defineElement('storage-backup', StorageBackup, undefined, registry);
