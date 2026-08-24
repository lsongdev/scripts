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
| `async/delay.js` | `candidate` | Abort reason, validation, cleanup, and real-browser timer cancellation have contract tests. |
| `async/debounce.js` | `candidate` | Signal cancellation, flush, clear, pending state, and browser timer behavior have contract tests. |
| `browser/notifications.js` | `candidate` | Unsupported, denied, and granted states have unit contracts; the local Playwright grant does not produce a real granted Notification state, so native permission-browser coverage remains deferred. |
| `crypto/digest.js` | `candidate` | SHA/HMAC workflows return ArrayBuffer; SHA-256 known vectors run in Node and Chromium/WebKit Web Crypto. |
| `crypto/keys.js` | `candidate` | AES/ECDH/RSA helpers return CryptoKey objects with secure defaults; AES native-object behavior has Chromium/WebKit coverage. |
| `crypto/md5.js` | `candidate` | Complete byte-oriented MD5 with published interoperability vectors. Explicitly limited to legacy protocol/file-manifest use; never a security primitive. |
| `crypto/pem.js` | `candidate` | Strict DER/PEM and CryptoKey round trips are tested; expand supported algorithm examples. |
| `datetime/format.js` | `candidate` | Validated instants, explicit IANA zones, stable formatting tokens, and signed duration semantics have Node tests and Chromium/WebKit element coverage. |
| `devices/geolocation.js` | `candidate` | Promise/disposer workflows and metre-based distance are tested; granted permission and native GeolocationPosition have Chromium/WebKit coverage, while denial/watch lifecycle still need browser cases. |
| `devices/serial.js` | `candidate` | Returns the standard SerialPort and has workflow tests; add chooser and device browser coverage. |
| `dom/dialog.js` | `candidate` | Safe text/Node defaults, signal cleanup, explicit unsafe HTML, and dialog lifecycle have browser coverage. |
| `dom/query.js` | `candidate` | Document XPath plus Document, Element, and ShadowRoot queries have Chromium/WebKit coverage. |
| `dom/events.js` | `candidate` | EventTarget, disposer, AbortSignal, and real-browser delegation behavior are tested. |
| `dom/nodes.js` | `candidate` | Node construction and explicit unsafe parsing have browser coverage; add Trusted Types guidance. |
| `dom/form-data.js` | `candidate` | Repeated names, File values, and real HTMLFormElement behavior are tested. |
| `encoding/base32.js` | `candidate` | RFC 4648 vectors and strict malformed length/padding/alphabet/trailing-bit rejection are tested. |
| `encoding/base64.js` | `candidate` | Byte-only semantics and base64/base64url round trips are documented and tested. |
| `files/read.js` | `candidate` | Uses Blob methods; Node Blob and real-browser File text/byte workflows are covered. |
| `media/capture.js` | `candidate` | Uses standard MediaDevices, returns MediaStream, and has contract tests; add permission/browser coverage. |
| `media/audio.js` | `candidate` | Web Audio construction, note conversion, deterministic noise buffers, native node returns, and zero-gain semantics have Chromium/WebKit coverage. |
| `media/video.js` | `candidate` | Explicit MediaStream attachment/detachment and signal-owned native playback; add real-track browser coverage. |
| `navigation/router.js` | `candidate` | Inert URLPattern router, real History state, explicit start, navigation, and prior-route abort have Chromium/WebKit coverage; deepen navigation edge cases. |
| `net/websocket.js` | `candidate` | A real local server verifies standard WebSocket/MessageEvent, echo, stream cancellation, and AbortSignal close in Chromium/WebKit; add failure and abnormal-close cases. |
| `storage/local.js` | `candidate` | Namespaced string semantics and clear/cache isolation are tested; add StorageEvent policy if needed. |
| `streams/text.js` | `candidate` | Iteration, decoding, line parsing, writer cleanup, locks, and basic native-browser streams are tested; add backpressure coverage. |

## Optional layers

| Area | Status | Boundary |
| --- | --- | --- |
| `elements/` | `adapter` | Optional Web Components with inert imports and explicit registration; includes icon, progressbar, tabs, autonomous time, and explicit-start camera view. |
| `adapters/preact/` | `adapter` | Optional Preact/htm bindings. Must not be imported by capability modules. |
| `adapters/yaml.js` | `adapter` | Deliberate parse/stringify surface over exact `yaml@2.9.0`; downstream browser import maps must resolve the bare package specifier. |
| `integrations/` | `adapter` | Provider-specific clients. Must depend only on standards or capability modules. |
| `labs/elements/` | `experimental` | QR elements with explicit registration and incomplete permission/portability contracts. The wrappers depend on the isolated vendor snapshot. |
| `labs/dom/` | `experimental` | Movable/resizable Pointer Events behaviors with browser examples but unresolved positioning, pointer-capture, and multi-pointer contracts. They are not core DOM utilities. |
| `labs/audio/` | `experimental` | Game/environment sound recipes built from `media/audio.js`; effect identity and mixing policy remain application-facing contracts. |
| `vendor/marked.js` | `vendor` | Version 4.2.12 and MIT provenance are recorded; historical snapshot remains outside the public surface. |
| `vendor/qr/` | `vendor` | Exact unmodified `qr@0.6.0` snapshot with registry integrity, file hashes, and upstream dual-license files. |

## Retired modules

The former `labs/legacy/` area has been deleted. It contained Array/Object/Promise/Number/Math replacements, an XHR imitation of Fetch, incompatible URL/query parsing, unsafe string formatting, application-specific regular expressions/i18n, and a literally incomplete MD5 source. The incomplete MD5 has since been replaced by a tested interoperability-only implementation; the native duplicates remain migration workflows rather than restored wrappers.

Downstream users must migrate to platform APIs or deliberately own an application-level replacement. Historical behavior remains available through Git history rather than forwarding files or a permanent legacy directory.

Already removed rather than retained as compatibility shims: root forwarding modules, empty modules, the XHR Fetch imitation from the active surface, prefixed Clipboard/WebRTC helpers, redundant Bluetooth/HID/USB wrappers, the custom EventEmitter, the broad DOM barrel, import-time DOM auto-init, and import-time custom-element registration.

The first experimental-layer audit incorrectly treated missing in-repository imports as proof of no consumers. External use invalidates that assumption. The recovery audit now preserves capabilities while still refusing defective implementations and compatibility shims; see [`deleted-module-audit.md`](./deleted-module-audit.md).

Audio, time, camera/video, YAML, and MD5 have already been recovered behind new contracts. Canvas/color, Bech32, CSR, animation, the HTML renderer, and remaining elements are queued for the same treatment rather than considered permanently retired.

The HTML template/Part renderer and tween/easing runtime remain outside core while their independent contracts are rebuilt. Camera is now an autonomous explicit-start element composed from `media/capture.js` and `media/video.js`.

The customized built-in table and copy-button experiments were removed after executable Chromium/WebKit tests proved that WebKit did not upgrade them. The repository will not preserve them through an engine-specific branch or a second component model. A downstream application that accepts a restricted browser matrix may own the original approach; a portable application should design an autonomous component or application UI around the relevant platform APIs.

Examples that were empty, only redirected elsewhere, duplicated native APIs, used prefixed fallbacks, or requested permissions during page load were removed. Remaining permission/network examples require an explicit user action.

## Promotion gate

A `candidate` becomes `stable` only when all of the following evidence exists:

1. a written contract covering inputs, outputs, errors, side effects, security, permissions, and cancellation;
2. no import-time work or dependency on optional/experimental/legacy layers;
3. tests for normal, failure, cancellation, and cleanup paths where applicable;
4. a direct-browser example using only immutable, resolvable imports;
5. a deliberate versioned release URL;
6. no known implementation defect or empty behavior.
