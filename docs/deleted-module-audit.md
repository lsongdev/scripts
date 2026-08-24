# Deleted-module recovery audit

Updated: 2026-08-24

The original removal pass treated absence of in-repository imports as evidence that a module had no users. That inference was wrong: this repository is consumed by external URL imports that are not visible in the worktree.

The corrected rule is:

1. no deleted capability is considered valueless merely because local imports are absent;
2. preserve the capability, but do not preserve a defective implementation or old-path forwarding shim;
3. move it to the correct capability, optional, integration, or labs boundary;
4. replace incomplete/native-duplicate behavior with a deliberate contract;
5. record path and behavior breaks as downstream migration work rather than compatibility branches.

## Recovered or already represented

| Former surface | Current surface | State |
| --- | --- | --- |
| `audio.js` | `media/audio.js`, `labs/audio/effects.js` | Recovered; core primitives tested in Chromium/WebKit, opinionated recipes retained in labs. |
| `time.js`, `components/time.js` | `datetime/format.js`, `elements/time.js` | Recovered; IANA-zone/date validation contract and autonomous element replace the WebKit-incompatible customized built-in. |
| `components/camera.js`, video attachment behavior | `elements/camera.js`, `media/video.js` | Recovered; permission is explicit and streams have deterministic cleanup. |
| `yaml.js` | `adapters/yaml.js` | Recovered over exact `yaml@2.9.0`; no floating CDN import. |
| `crypto/md5.js` | `crypto/md5.js` | Replaced: former source was literally incomplete; the new byte implementation passes published interoperability vectors and is explicitly non-security-only. |
| `file.js`, `location.js`, `notification.js`, `serialport.js`, `router.js`, `websocket.js`, `storage.js`, `stream.js` | capability leaf modules | Recovered through the earlier refactor with standard return objects and contract tests. |
| `crypto/base32.js`, `crypto/base64.js` | `encoding/base32.js`, `encoding/base64.js` | Recovered with strict byte contracts and vectors. |
| retained component and React files | `elements/`, `adapters/preact/` | Recovered under explicit-registration and adapter boundaries. |
| `services/*` | `integrations/*` | Recovered as provider-specific integrations. |
| QR implementation/components | `vendor/qr/`, `labs/elements/` | Recovered with exact upstream provenance plus experimental wrappers. |

## Recovery queue

These capabilities are externally relevant. Their historical source is recoverable from Git, but it must not be reintroduced unchanged.

| Group | Historical files | Intended boundary and required redesign |
| --- | --- | --- |
| animation | canvas particle/matrix/ripple recipes and tween example | Core easing/tween/Web Animations live in `animation/`; visual recipes are recovered in `labs/animation/` with explicit lifecycle and browser cleanup tests. |
| graphics | `canvas.js`, `color.js` | Recovered as `graphics/canvas.js` and `graphics/color.js` with Canvas state ownership, correct CSS HSL math, validation, and tests. |
| encodings/security | `crypto/csr.js` | CSR and Bech32/Bech32m are recovered. CSR is dependency-free PKCS#10 with algorithm-specific OIDs/encoding and OpenSSL interoperability; Bech32 uses official vectors. |
| document runtime | `html/*` | Recovered as a narrow adapter over exact `lit-html@3.3.3`, with explicit browser import map and Chromium/WebKit nested/event update tests. |
| UI elements | calendar, form, link, backup, piano, select, sidebar, spectrum | All named workflows now have tested native helpers, controllers, or explicitly registered autonomous elements; rich combobox/calendar/piano/spectrum/sidebar run in Chromium/WebKit. |
| formats/storage | empty `csv.js`, empty `cookie.js` | Recovered as implemented `encoding/csv.js` and `storage/cookies.js` contracts rather than restoring empty bodies. |
| input/device | former keyboard/motion singleton APIs | Recovered as inert `dom/keyboard.js` and `devices/orientation.js`; no import-time singleton or listener. |
| media | recorder example, player | Media Session, MediaRecorder, native video attachment/playback, piano events, and analyser rendering are recovered; generic player UI remains a native HTMLMediaElement/application composition rather than a hidden wrapper. |
| lifecycle | `dom/page.js` | Service-worker and page lifecycle observation are recovered in `browser/service-worker.js` and `browser/page-lifecycle.js`; neither starts work during import. |
| generic workflows | non-native portions of `array.js`, `object.js`, `promise.js` | Recovered as narrow `collections/random.js`, `collections/records.js`, `async/retry.js`, `async/timeout.js`, and `async/serial.js`; native duplicates stay mapped to the language. |
| byte/event/network workflows | `bytes.js`, hex/throttle portions of `string.js`/`events.js`, `webrtc.js` | Empty bytes surface is replaced by strict `encoding/hex.js`; throttle is lifecycle-owned in `async/throttle.js`; WebRTC returns native peer connections/descriptions without default third-party STUN or prefixes. |
| form workflows | `dom/form.js`, `form.js`, form component/example | Native successful controls plus action/method/enctype are recovered as `dom/form-data.js` and `dom/form-request.js`; validation and persistence remain separate policies. |
| application helpers | `i18n.js`, `regexp.js` | i18n is recovered as isolated `localization/messages.js` with safe plain-text interpolation. Broad regex validation remains mapped to native controls/URL parsing or application policy rather than frozen, incomplete patterns. |

## Behaviors not restored as implementations

Some old files consisted only of an empty body, deprecated forwarding, unsafe dynamic evaluation, or a defective imitation of a native API. Their external use still matters, but the migration target is the standard or a newly designed narrow capability—not the old implementation:

- root forwarding/barrel files and import-time auto-registration;
- empty `bytes.js`, `csv.js`, and `cookie.js` bodies;
- Array/Object/Promise/Number wrappers already provided by the language; their non-native shuffle/sample, record selection, retry/timeout, and serial-task workflows now have narrow replacements;
- regex URL parsing instead of `URL`/`URLSearchParams`;
- XHR pretending to be Fetch;
- string interpolation based on `new Function`;
- prefixed browser APIs and silent unsupported fallbacks.

This section is not a license to discard the external workflow. Every first-pass workflow now has either a documented standard migration, a tested replacement module, or an explicitly retained experimental implementation.
