# Historical deletion ledger

Updated: 2026-08-24

This ledger closes the false assumption that a missing in-repository import means a deleted URL had no consumer. It accounts for the files removed during the first restructuring commit. “Platform migration” preserves the workflow decision, not the historical path or defective implementation; every path break remains downstream migration work.

| Historical files | Disposition |
| --- | --- |
| `audio.js`, `media.js`, `components/camera.js`, `components/time.js`, `time.js` | Recovered in `media/audio.js`, `media/capture.js`, `media/video.js`, `media/session.js`, `elements/camera.js`, `datetime/format.js`, and `elements/time.js`. |
| `examples/media/recorder.html` | Rebuilt at the same example path over `media/recording.js`; permission, track cleanup, and object-URL cleanup are explicit. |
| `canvas.js`, `color.js` | Recovered in `graphics/canvas.js` and `graphics/color.js`. |
| `animate/easing.js`, `animate/fn.js`, `animate/tween.js` | Recovered as `animation/easing.js`, `animation/tween.js`, and `animation/web.js`. |
| `animate/effect.js`, `animate/matrix.js`, `animate/ripple.js`, `examples/noise.html`, `examples/tween/*` | TODO: rebuild as `labs/animation/` recipes with injected target, cancellable RAF/timers, pointer events, and state restoration. No global event-property writes. |
| `crypto/base32.js`, `crypto/base64.js`, `crypto/bech32.js`, incomplete `crypto/md5.js`, hex portion of `string.js`, empty `bytes.js` | Recovered as strict byte modules under `encoding/` and legacy-only `crypto/md5.js`. |
| `crypto/csr.js` | TODO: a pinned ASN.1 adapter with algorithm/OID agreement, subject validation, RSA/ECDSA fixtures, and OpenSSL interoperability. The floating CDN and hard-coded RSA OID are rejected. |
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
| `webrtc.js`, `examples/webrtc/index.html` | Core offer/answer work recovered in `net/webrtc.js`; TODO: a new explicit signaling example. No default third-party STUN or prefixed constructors. |
| `bluetooth.js`, `hid.js`, `usb.js`, related example styles | Native Web Bluetooth/HID/USB are the target. Existing examples import the standards directly and request devices only after user action. Wrapper files added no contract. |
| `serialport.js`, `location.js`, `notification.js` | Recovered under `devices/` and `browser/`; examples remain explicit user actions. |
| `service-worker.js`, `sw.js`, `dom/page.js` | Recovered as inert `browser/service-worker.js` and `browser/page-lifecycle.js`; logging and registration never happen on import. |
| `keyboard.js`, `motion.js`, sensor example files | Recovered as `dom/keyboard.js` and `devices/orientation.js`; TODO: rebuild a permission-aware sensor example without import-time listeners. |
| `file.js`, `storage.js`, `stream.js`, `router.js` | Recovered under `files/`, `storage/`, `streams/`, and `navigation/`. |
| `dom.js`, `dom/dom.js`, `dom/index.js`, `dom/form.js`, `form.js`, `query.js` | Split into DOM leaf modules. Form data/request workflows are recovered; broad barrels and deprecation warnings are not. |
| `dom/movable.js`, `dom/resizable.js` | Preserved in `labs/dom/` pending pointer capture, geometry, multi-pointer, and cleanup promotion gates. |
| `dom/style.js` | Class composition is already `dom/classes.js`. TODO: decide constructable stylesheet/adoption ownership before restoring dynamic stylesheet creation. |
| `dom/webcomponent.js` | Explicit registration is recovered in `elements/define.js`; unsafe implicit HTML rendering and auto-mount inheritance are superseded by explicit component implementations. |
| `events.js` | DOM subscriptions are `dom/events.js`, throttle is `async/throttle.js`, and page visibility is `browser/page-lifecycle.js`; a global singleton emitter is replaced by native `EventTarget`. |
| `components/icon.js`, `components/progressbar.js`, `components/tabs.js`, `components/dialog.js` and React counterparts | Recovered or represented in `elements/` and `adapters/preact/` with explicit registration/boundaries. |
| `components/copy-button.js`, `components/table.js`, matching examples | Rebuilt as portable autonomous `copy-button` and `data-table`; no customized-built-in compatibility branch. |
| `components/select.js`, select example | Data mapping recovered in `dom/select.js` over a native select. TODO: only restore rich content as a new combobox after complete ARIA/keyboard/focus tests. |
| `components/local-storage-backup.js` | Rebuilt as `storage/snapshot.js` plus `elements/storage-backup.js`; import validates before mutation and defaults to merge. |
| `components/form.js`, form example | Empty component replaced by `dom/form-data.js` and `dom/form-request.js`; TODO: a new example once endpoint/response policy is deliberately local. |
| `components/button.js`, `components/link.js`, link example | Empty components are platform migrations to native button/link. TODO: a method-link workflow, if still needed, must be an explicit Fetch action with CSRF/security policy—not anchor semantics mutation. |
| `components/calendar.js` | TODO: rebuild as an autonomous date-grid element with locale/week-start, keyboard navigation, focus, valid date math, and cross-engine tests; native `input[type=date]` remains the simple-path target. |
| `components/piano-keyboard.js`, `components/spectrum-analyzer.js` | TODO: rebuild under media-oriented optional elements with Pointer Events, keyboard access, injected AudioNode/AnalyserNode, cancellable timers/RAF, resize handling, and disconnect cleanup. |
| `components/sidebar.js`, sidebar examples | TODO: rebuild as an explicit controller returning a disposer, without preventing navigation for leaf links or assuming external CSS/global selectors. |
| `html/index.js`, `html/package*.json`, `html/test-html.html`, old for/list examples | TODO: isolated renderer/adaptor with pinned implementation, trusted template boundary, event replacement cleanup, nested/iterable update tests, and no random import-time marker. It is not safe to restore the old partial renderer. |
| deleted forwarding roots (`audio.js`, `crypto.js`, `dom.js`, `file.js`, `form.js`, `location.js`, `media.js`, `network.js`, `notification.js`, `router.js`, `serialport.js`, `storage.js`, `stream.js`, `websocket.js`) | Their capabilities are accounted for above. Old root URLs intentionally remain a downstream path migration rather than permanent forwarding code. |

## Remaining recovery order

1. CSR interoperability adapter.
2. HTML renderer boundary.
3. Calendar and rich combobox accessibility contracts.
4. Audio visualization/piano and animation recipes with deterministic cleanup.
5. Sidebar/method-link/application examples after their security and navigation policies are explicit.

These TODOs are release blockers only if their paths are selected for the first published surface. They are not permission to delete the historical workflow or claim it had no users.
