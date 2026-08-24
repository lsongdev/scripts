# Third-party notices

Project-owned source is MIT licensed. Optional adapters and isolated vendor snapshots retain their upstream licenses:

| Dependency | Version | License | Use |
| --- | ---: | --- | --- |
| [`yaml`](https://github.com/eemeli/yaml) | 2.9.0 | ISC | `adapters/yaml.js` |
| [`lit-html`](https://github.com/lit/lit) | 3.3.3 | BSD-3-Clause | `adapters/lit.js` |
| [`qr`](https://github.com/paulmillr/qr) | 0.6.0 snapshot | MIT OR Apache-2.0 | `vendor/qr/`, experimental QR elements |
| [`marked`](https://github.com/markedjs/marked) | 4.2.12 snapshot | MIT | `vendor/marked.js` |

Installed development-only test tools do not form part of the browser module runtime. Exact dependency versions and integrity hashes are recorded in `package-lock.json`; included vendor source carries its corresponding license files and provenance under `vendor/`.
