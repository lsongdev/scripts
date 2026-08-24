# Vendored source

Files in this directory are third-party snapshots, not Web stdlib modules.

| File | Upstream | Version | License | Status |
| --- | --- | --- | --- | --- |
| `marked.js` | <https://github.com/markedjs/marked> | 4.2.12 | MIT | Historical snapshot; not part of the public surface. Prefer an immutable external dependency or a separately versioned integration. |
| `qr/` | <https://github.com/paulmillr/qr> | 0.6.0 | MIT OR Apache-2.0 | Exact unmodified registry snapshot used only by experimental QR elements. |

Do not import vendor files from capability modules.
