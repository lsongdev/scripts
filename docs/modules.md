# Module registry

This registry defines the support status of repository modules during the stdlib refactor. A file existing in the repository does not by itself make it public API.

## Status definitions

| Status | Meaning |
| --- | --- |
| `candidate` | Fits the target architecture, but still requires contract review and tests before release. |
| `experimental` | Useful work under active redesign; not part of the future core contract yet. |
| `adapter` | Optional framework, element, or provider integration outside core. |
| `retire` | Duplicates the platform, is incomplete, or violates the target architecture; scheduled for removal. |
| `vendor` | Third-party source isolated from project-owned API. |

There are currently no `stable` modules.

## Capability modules

| Module | Status | Required work |
| --- | --- | --- |
| `animation/easing.js` | `candidate` | Pure normalized easing functions preserve endpoints and have symmetry tests. |
| `animation/tween.js` | `candidate` | Numeric record interpolation is immutable, frame-owned, promise-based, and AbortSignal-aware. |
| `animation/web.js` | `candidate` | Returns the native Animation and binds optional signal cancellation; add deeper timeline/browser lifecycle cases. |
| `async/delay.js` | `candidate` | Abort reason, validation, cleanup, and real-browser timer cancellation have contract tests. |
| `async/debounce.js` | `candidate` | Signal cancellation, flush, clear, pending state, and browser timer behavior have contract tests. |
| `async/retry.js` | `candidate` | Explicit attempt count, retry predicate/backoff, attempt metadata, and AbortSignal cancellation replace the former TODO body. |
| `async/serial.js` | `candidate` | Executes task functions sequentially with ordered results and explicit signal propagation; it does not accept already-started promises. |
| `async/timeout.js` | `candidate` | Enforces a deadline and passes a derived AbortSignal so cooperative work can stop; it does not pretend arbitrary promises are physically cancellable. |
| `async/throttle.js` | `candidate` | Leading/latest-trailing scheduling preserves receiver and exposes clear/flush/pending plus AbortSignal cleanup. |
| `browser/notifications.js` | `candidate` | Unsupported, denied, and granted states have unit contracts; the local Playwright grant does not produce a real granted Notification state, so native permission-browser coverage remains deferred. |
| `browser/page-lifecycle.js` | `candidate` | Visibility/page show-hide/freeze-resume observation is explicit, reports native state/events, and returns an AbortSignal-aware disposer. |
| `browser/service-worker.js` | `candidate` | Explicit module registration returns the native registration; state observation returns a disposer and has injected workflow tests. |
| `collections/random.js` | `candidate` | Fisher-Yates shuffle/sample return new arrays, validate injected randomness, and never use biased sort comparators. |
| `collections/records.js` | `candidate` | Own-property path reads and pick/omit produce null-prototype records while blocking prototype traversal keys. |
| `crypto/digest.js` | `candidate` | SHA/HMAC workflows return ArrayBuffer; SHA-256 known vectors run in Node and Chromium/WebKit Web Crypto. |
| `crypto/csr.js` | `candidate` | Dependency-free PKCS#10 DER/PEM for RSA PKCS#1, RSA-PSS, ECDSA, and Ed25519; RSA/ECDSA/PSS output is signature-verified by OpenSSL. |
| `crypto/keys.js` | `candidate` | AES/ECDH/RSA helpers return CryptoKey objects with secure defaults; AES native-object behavior has Chromium/WebKit coverage. |
| `crypto/md5.js` | `candidate` | Complete byte-oriented MD5 with published interoperability vectors. Explicitly limited to legacy protocol/file-manifest use; never a security primitive. |
| `crypto/pem.js` | `candidate` | Strict DER/PEM and CryptoKey round trips are tested; expand supported algorithm examples. |
| `datetime/format.js` | `candidate` | Validated instants, explicit IANA zones, stable date tokens, elapsed `MM:SS` clocks, and signed duration semantics have Node tests and Chromium/WebKit element coverage. |
| `devices/geolocation.js` | `candidate` | Promise/disposer workflows and metre-based distance are tested; granted permission and native GeolocationPosition have Chromium/WebKit coverage, while denial/watch lifecycle still need browser cases. |
| `devices/serial.js` | `candidate` | Returns the standard SerialPort and has workflow tests; add chooser and device browser coverage. |
| `devices/orientation.js` | `candidate` | Permission and orientation observers are inert, standard-event based, and disposer/AbortSignal aware. |
| `dom/dialog.js` | `candidate` | Safe text/Node defaults, signal cleanup, explicit unsafe HTML, and dialog lifecycle have browser coverage. |
| `dom/query.js` | `candidate` | Document XPath plus Document, Element, and ShadowRoot queries have Chromium/WebKit coverage. |
| `dom/events.js` | `candidate` | EventTarget, disposer, AbortSignal, and real-browser delegation behavior are tested. |
| `dom/nodes.js` | `candidate` | Node construction and explicit unsafe parsing have browser coverage; add Trusted Types guidance. |
| `dom/form-data.js` | `candidate` | Repeated names, File values, and real HTMLFormElement behavior are tested. |
| `dom/form-request.js` | `candidate` | Converts native successful controls and enctype/method/action semantics into a standard Request; binding and fetching remain explicit and abortable. |
| `dom/action-link.js` | `candidate` | Builds an explicit native Request and intercepts only ordinary primary activation; modified clicks, targets, and downloads retain native link behavior. |
| `dom/keyboard.js` | `candidate` | Explicit EventTarget/key filtering returns a disposer and preserves KeyboardEvent objects/options. |
| `dom/movable.js` | `candidate` | One-handle Pointer Events controller uses pointer capture, CSS translate, explicit axes/grid, viewport-consistent Element bounds, events, and disposer. |
| `dom/select.js` | `candidate` | Safely maps data into native Option nodes while preserving native form, keyboard, and accessibility semantics; rich custom combobox behavior is out of scope. |
| `dom/resizable.js` | `candidate` | One-handle Pointer Events controller applies explicit border-box limits and optional Element bounds with capture/events/disposer. |
| `dom/sidebar.js` | `candidate` | Button/ARIA disclosure controller returns a disposer and deliberately never intercepts leaf navigation links. |
| `dom/stylesheets.js` | `candidate` | Constructable stylesheet creation and selective adoption cleanup preserve standard CSSStyleSheet/ShadowRoot ownership. |
| `encoding/base32.js` | `candidate` | RFC 4648 vectors and strict malformed length/padding/alphabet/trailing-bit rejection are tested. |
| `encoding/base64.js` | `candidate` | Byte-only semantics and base64/base64url round trips are documented and tested. |
| `encoding/bech32.js` | `candidate` | Bech32/Bech32m detection, strict bit conversion, and official BIP-173/BIP-350 valid/invalid vectors are tested. |
| `encoding/csv.js` | `candidate` | Strict RFC 4180-style quoting/newline parsing and serialization have round-trip and malformed-input tests. |
| `encoding/hex.js` | `candidate` | Strict byte-only hexadecimal encoding/decoding replaces the former string helper and empty byte module. |
| `files/read.js` | `candidate` | Uses Blob methods; Node Blob and real-browser File text/byte workflows are covered. |
| `graphics/canvas.js` | `candidate` | Canvas drawing operations preserve context state and return the native context; pixel-level browser coverage is present. |
| `graphics/color.js` | `candidate` | Validated immutable sRGB colors plus hex/RGB/HSL conversion with unit contracts. |
| `integrations/oauth.js` | `adapter` | Browser Authorization Code + PKCE lifecycle with state validation and session-scoped token storage. |
| `localization/messages.js` | `candidate` | Isolated locale/fallback catalogs and plain-text placeholder interpolation; no global locale, HTML rendering, or dynamic evaluation. |
| `media/capture.js` | `candidate` | Uses standard MediaDevices, returns MediaStream, and has contract tests; add permission/browser coverage. |
| `media/audio.js` | `candidate` | Web Audio construction, note conversion, deterministic noise buffers, native node returns, and zero-gain semantics have Chromium/WebKit coverage. |
| `media/video.js` | `candidate` | Explicit MediaStream attachment/detachment and signal-owned native playback; add real-track browser coverage. |
| `media/session.js` | `candidate` | Explicit Media Session metadata, playback, action, position, camera, and microphone workflows with no silent unsupported fallback. |
| `media/recording.js` | `candidate` | Returns the native MediaRecorder plus an explicit stop/result lifecycle, rejects with AbortSignal reason, and leaves MediaStream track ownership to the caller. |
| `media/spectrum.js` | `candidate` | One-frame spectrum drawing preserves Canvas state; the renderer owns exactly one cancellable RAF loop around a native AnalyserNode. |
| `navigation/router.js` | `candidate` | Inert URLPattern router, real History state, explicit start, navigation, and prior-route abort have Chromium/WebKit coverage; deepen navigation edge cases. |
| `net/websocket.js` | `candidate` | A real local server verifies standard WebSocket/MessageEvent, echo, stream cancellation, and AbortSignal close in Chromium/WebKit; add failure and abnormal-close cases. |
| `net/webrtc.js` | `candidate` | Returns the native RTCPeerConnection and native local descriptions; configuration and ICE servers are caller-owned, with no prefixed constructors. |
| `storage/local.js` | `candidate` | Namespaced string semantics and clear/cache isolation are tested; add StorageEvent policy if needed. |
| `storage/cookies.js` | `candidate` | Raw Cookie parsing, explicit browser-settable serialization, scoped deletion, and validation are tested. |
| `storage/snapshot.js` | `candidate` | Versioned string-pair snapshots are fully validated before optional replace/restore; file selection, download, merge, and conflict UI remain adapters. |
| `streams/text.js` | `candidate` | Iteration, decoding, line parsing, writer cleanup, locks, and basic native-browser streams are tested; add backpressure coverage. |

## Optional layers

| Area | Status | Boundary |
| --- | --- | --- |
| `elements/` | `adapter` | Optional autonomous Web Components with inert imports and explicit registration; includes calendar, rich combobox, piano keyboard, spectrum view, icon, progressbar, tabs, time, camera, copy button, data table, and storage backup. |
| `adapters/preact/` | `adapter` | Optional Preact/htm bindings. Must not be imported by capability modules. |
| `adapters/yaml.js` | `adapter` | Deliberate parse/stringify surface over exact `yaml@2.9.0`; downstream browser import maps must resolve the bare package specifier. |
| `adapters/lit.js` | `adapter` | Selected `html`, `render`, `nothing`, and `noChange` surface over exact `lit-html@3.3.3`; browser consumers explicitly resolve its bare specifier. |
| `integrations/` | `adapter` | Provider-specific clients. Must depend only on standards or capability modules. |
| `labs/elements/` | `experimental` | QR elements with explicit registration and incomplete permission/portability contracts. The wrappers depend on the isolated vendor snapshot. |
| `labs/dom/` | `experimental` | Historical attribute-driven move/resize behavior retained for migration. New representative examples use tested `dom/movable.js` and `dom/resizable.js`; labs signatures are not stable core. |
| `labs/audio/` | `experimental` | Game/environment sound recipes built from `media/audio.js`; effect identity and mixing policy remain application-facing contracts. |
| `labs/animation/` | `experimental` | Matrix, particle-network, and ripple recipes now have explicit start/stop/dispose, no global handler assignment, RAF/timer cleanup, and browser tests; visual identity remains application policy. |
| `text/markedown.js` | `vendor` | Version 4.2.12 and MIT provenance are recorded; historical snapshot remains outside the public surface. |
| `media/qr/` | `vendor` | Exact unmodified `qr@0.6.0` snapshot with registry integrity, file hashes, and upstream dual-license files. |

## Retired modules

The former `labs/legacy/` area has been deleted. It contained Array/Object/Promise/Number/Math replacements, an XHR imitation of Fetch, incompatible URL/query parsing, unsafe string formatting, application-specific regular expressions/i18n, and a literally incomplete MD5 source. The incomplete MD5 has since been replaced by a tested interoperability-only implementation; the native duplicates remain migration workflows rather than restored wrappers.

Downstream users must migrate to platform APIs or deliberately own an application-level replacement. Historical behavior remains available through Git history rather than forwarding files or a permanent legacy directory.

Already removed rather than retained as compatibility shims: root forwarding modules, empty modules, the XHR Fetch imitation from the active surface, prefixed Clipboard/WebRTC helpers, redundant Bluetooth/HID/USB wrappers, the custom EventEmitter, the broad DOM barrel, import-time DOM auto-init, and import-time custom-element registration.

The first experimental-layer audit incorrectly treated missing in-repository imports as proof of no consumers. External use invalidates that assumption. The recovery audit now preserves capabilities while still refusing defective implementations and compatibility shims; see [`deleted-module-audit.md`](./deleted-module-audit.md).

Audio, time, camera/video/recording/session/spectrum, YAML, MD5, CSR, Canvas/color, Bech32/Bech32m, animation primitives/recipes, CSV/cookie, service-worker, page lifecycle, keyboard/orientation, form/action-link, movable/resizable, sidebar, HTML rendering, and the remaining named elements have been recovered behind new contracts or explicit platform migrations.

The HTML template surface is a pinned optional Lit adapter rather than a project-owned parser. Tween/easing/Web Animations primitives live in `animation/`; application-specific visual recipes remain in `labs/animation/` with deterministic cleanup. Camera is an autonomous explicit-start element composed from `media/capture.js` and `media/video.js`.

Executable Chromium/WebKit tests proved that the former customized built-in table and copy button did not upgrade in WebKit. Their capabilities are now recovered as the portable autonomous `data-table` and `copy-button`; there is no engine-specific branch or old customized-builtin registration.

Examples that were empty, only redirected elsewhere, duplicated native APIs, used prefixed fallbacks, or requested permissions during page load were removed. Remaining permission/network examples require an explicit user action.

## Promotion gate

A `candidate` becomes `stable` only when all of the following evidence exists:

1. a written contract covering inputs, outputs, errors, side effects, security, permissions, and cancellation;
2. no import-time work or dependency on optional/experimental/legacy layers;
3. tests for normal, failure, cancellation, and cleanup paths where applicable;
4. a direct-browser example using only immutable, resolvable imports;
5. a deliberate versioned release URL;
6. no known implementation defect or empty behavior.
