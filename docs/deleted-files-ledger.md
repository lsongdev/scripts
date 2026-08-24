# Historical deletion ledger

Updated: 2026-08-24

This ledger closes the false assumption that a missing in-repository import means a deleted URL had no consumer. It accounts for the files removed during the first restructuring commit. “Platform migration” preserves the workflow decision, not the historical path or defective implementation; every path break remains downstream migration work.

| Historical files | Disposition |
| --- | --- |
| `audio.js`, `media.js`, `components/camera.js`, `components/time.js`, `time.js` | Recovered in `media/audio.js`, `media/capture.js`, `media/video.js`, `media/session.js`, `elements/camera.js`, `datetime/format.js`, and `elements/time.js`. |
| `examples/media/recorder.html` | Rebuilt at the same example path over `media/recording.js`; permission, track cleanup, and object-URL cleanup are explicit. |
| `canvas.js`, `color.js` | Recovered in `graphics/canvas.js` and `graphics/color.js`. |
| `animate/easing.js`, `animate/fn.js`, `animate/tween.js` | Recovered as `animation/easing.js`, `animation/tween.js`, and `animation/web.js`. |
| `animate/effect.js`, `animate/matrix.js`, `animate/ripple.js`, `examples/noise.html`, `examples/tween/*` | Recovered as `labs/animation/` matrix, particle, and ripple recipes with injected targets, cancellable RAF/Web Animations, pointer events, and style cleanup. No global event-property writes. |
| `crypto/base32.js`, `crypto/base64.js`, `crypto/bech32.js`, incomplete `crypto/md5.js`, hex portion of `string.js`, empty `bytes.js` | Recovered as strict byte modules under `encoding/` and legacy-only `crypto/md5.js`. |
| `crypto/csr.js` | Recovered as dependency-free PKCS#10 in `crypto/csr.js`; algorithm/OID agreement, subject string types, RSA PKCS#1/PSS and ECDSA signature encoding are verified through OpenSSL. |
| `crypto.js`, `crypto/index.js`, `crypto/sha.js` | Narrow targets are `crypto/digest.js`, `crypto/keys.js`, and `crypto/pem.js`; broad barrels and duplicate SHA wrappers are not restored. |
| `yaml.js` | Recovered as `adapters/yaml.js` over exact `yaml@2.9.0`. |
| `csv.js`, `cookie.js` | Former empty bodies replaced by implemented `encoding/csv.js` and `storage/cookies.js`. |
| `array.js`, `object.js`, `promise.js`, `async/index.js`, throttle portion of `events.js` | Non-native workflows recovered under `collections/` and `async/`; native Array/Object/Promise methods remain platform migrations. |
| `math.js`, `number.js`, remaining `string.js` | `Intl.NumberFormat`, `String.padStart`, `String.trim`, `Array.from`, `crypto.randomUUID`, and Math are the documented targets. Unsafe `new Function` formatting is replaced by `localization/messages.js`. Random sampling has a real contract in `collections/random.js`. |
| `i18n.js` | Recovered as isolated, non-evaluating `localization/messages.js`. |
| `regexp.js`, `examples/regexp/*` | Platform/application migration: URL and email parsing/validation belong to `URL`, `URLSearchParams`, native form validity, or a domain-specific policy. The incomplete historical regexes are not a valid reusable contract. |
| `query.js`, `url.js` | Platform migration to `URL`/`URLSearchParams`; no import-time `location` snapshot or type guessing. |
| `fetch.js`, `network.js` | Platform migration to native Fetch plus `net/websocket.js` and `net/webrtc.js`; the XHR imitation is not restored. |
| `websocket.js` | Recovered as `net/websocket.js` with native events, streams, AbortSignal, and real-server tests. |
| `webrtc.js`, `examples/webrtc/index.html` | Core offer/answer work and explicit create/close example recovered in `net/webrtc.js` and `examples/webrtc/`. No default third-party STUN or prefixed constructors. |
| `bluetooth.js`, `hid.js`, `usb.js`, related example styles | Native Web Bluetooth/HID/USB are the target. Existing examples import the standards directly and request devices only after user action. Wrapper files added no contract. |
| `serialport.js`, `location.js`, `notification.js` | Recovered under `devices/` and `browser/`; examples remain explicit user actions. |
| `service-worker.js`, `sw.js`, `dom/page.js` | Recovered as inert `browser/service-worker.js` and `browser/page-lifecycle.js`; logging and registration never happen on import. |
| `keyboard.js`, `motion.js`, sensor example files | Recovered as `dom/keyboard.js`, `devices/orientation.js`, and a permission-aware sensor example without import-time listeners. |
| `file.js`, `storage.js`, `stream.js`, `router.js` | Recovered under `files/`, `storage/`, `streams/`, and `navigation/`. |
| `dom.js`, `dom/dom.js`, `dom/index.js`, `dom/form.js`, `form.js`, `query.js` | Split into DOM leaf modules. Form data/request workflows are recovered; broad barrels and deprecation warnings are not. |
| `dom/movable.js`, `dom/resizable.js` | Historical attribute workflows remain in `labs/dom/`; corrected one-handle core contracts now live in `dom/movable.js` and `dom/resizable.js` with pointer capture, consistent Element bounds, and cleanup. |
| `dom/style.js` | Class composition is `dom/classes.js`; dynamic stylesheet ownership is recovered through constructable `CSSStyleSheet` creation/adoption in `dom/stylesheets.js`. |
| `dom/webcomponent.js` | Explicit registration is recovered in `elements/define.js`; unsafe implicit HTML rendering and auto-mount inheritance are superseded by explicit component implementations. |
| `events.js` | DOM subscriptions are `dom/events.js`, throttle is `async/throttle.js`, and page visibility is `browser/page-lifecycle.js`; a global singleton emitter is replaced by native `EventTarget`. |
| `components/icon.js`, `components/progressbar.js`, `components/tabs.js`, `components/dialog.js` and React counterparts | Recovered or represented in `elements/` and `adapters/preact/` with explicit registration/boundaries. |
| `components/copy-button.js`, `components/table.js`, matching examples | Rebuilt as portable autonomous `copy-button` and `data-table`; no customized-built-in compatibility branch. |
| `components/select.js`, select example | Data mapping uses native select in `dom/select.js`; rich content is recovered as form-associated `rich-combobox` with ARIA, filtering, disabled-option and keyboard tests. |
| `components/local-storage-backup.js` | Rebuilt as `storage/snapshot.js` plus `elements/storage-backup.js`; import validates before mutation and defaults to merge. |
| `components/form.js`, form example | Empty component replaced by `dom/form-data.js`, `dom/form-request.js`, and an executable local Request preview example. |
| `components/button.js`, `components/link.js`, link example | Empty components map to native button/link; method-link is recovered as explicit `dom/action-link.js`, requiring application-owned Request headers/body and preserving modified/native navigation. |
| `components/calendar.js` | Rebuilt as autonomous `date-calendar` with locale/week-start, valid UTC civil-date math, six-week grid, roving focus, keyboard selection, and cross-engine tests. |
| `components/piano-keyboard.js`, `components/spectrum-analyzer.js` | Rebuilt as explicit `piano-keyboard` note-event adapter and `media/spectrum.js` plus `spectrum-view`; AudioContext/Analyser ownership and RAF cleanup are explicit. |
| `components/sidebar.js`, sidebar examples | Rebuilt as `dom/sidebar.js`, a button/ARIA disclosure controller with disposer that does not prevent leaf navigation. |
| `html/index.js`, `html/package*.json`, `html/test-html.html`, old for/list examples | Recovered as the selected `adapters/lit.js` surface over exact `lit-html@3.3.3`; nested iterable/event updates run in Chromium/WebKit. The incomplete project-owned parser and its separate package domain are not restored. |
| deleted forwarding roots (`audio.js`, `crypto.js`, `dom.js`, `file.js`, `form.js`, `location.js`, `media.js`, `network.js`, `notification.js`, `router.js`, `serialport.js`, `storage.js`, `stream.js`, `websocket.js`) | Their capabilities are accounted for above. Old root URLs intentionally remain a downstream path migration rather than permanent forwarding code. |

## Remaining release work

The first-pass deleted capability queue is now accounted for by a tested replacement, an explicit standards migration, or a retained experimental implementation. Remaining work is release governance: final stable-surface selection, immutable version/tag, and downstream migration validation. Experimental QR and historical attribute-based move/resize stay outside stable until their separate contracts are selected; this does not imply that their workflows or users are absent.
