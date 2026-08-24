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
| animation | canvas particle/matrix/ripple recipes and tween example | Core easing, numeric tween, and native Web Animations ownership are recovered in `animation/`; visual recipes remain queued for explicit labs implementations. |
| graphics | `canvas.js`, `color.js` | Recovered as `graphics/canvas.js` and `graphics/color.js` with Canvas state ownership, correct CSS HSL math, validation, and tests. |
| encodings/security | `crypto/csr.js` | CSR as an explicitly versioned ASN.1 adapter rather than a floating CDN import. Bech32/Bech32m has been recovered as `encoding/bech32.js` with official vectors. |
| document runtime | `html/*` | Separately bounded renderer package/labs module with security, event cleanup, update, and nested-template tests. |
| UI elements | calendar, form, link, backup, piano, select, sidebar, spectrum | Copy/table are recovered as autonomous, explicitly registered `copy-button` and `data-table`; the remaining elements follow the same portability review. |
| formats/storage | empty `csv.js`, empty `cookie.js` | Recovered as implemented `encoding/csv.js` and `storage/cookies.js` contracts rather than restoring empty bodies. |
| input/device | former keyboard/motion singleton APIs | Recovered as inert `dom/keyboard.js` and `devices/orientation.js`; no import-time singleton or listener. |
| media | recorder example, player | Media Session and explicit MediaRecorder ownership are recovered in `media/session.js` and `media/recording.js`; player UI remains queued. |
| lifecycle | `dom/page.js` | Service-worker and page lifecycle observation are recovered in `browser/service-worker.js` and `browser/page-lifecycle.js`; neither starts work during import. |
| generic workflows | non-native portions of `array.js`, `object.js`, `promise.js` | Recovered as narrow `collections/random.js`, `collections/records.js`, `async/retry.js`, `async/timeout.js`, and `async/serial.js`; native duplicates stay mapped to the language. |
| application helpers | i18n, regex, form persistence/request | Separate optional/application modules after safe interpolation, validation, and storage ownership are defined. |

## Behaviors not restored as implementations

Some old files consisted only of an empty body, deprecated forwarding, unsafe dynamic evaluation, or a defective imitation of a native API. Their external use still matters, but the migration target is the standard or a newly designed narrow capability—not the old implementation:

- root forwarding/barrel files and import-time auto-registration;
- empty `bytes.js`, `csv.js`, and `cookie.js` bodies;
- Array/Object/Promise/Number wrappers already provided by the language; their non-native shuffle/sample, record selection, retry/timeout, and serial-task workflows now have narrow replacements;
- regex URL parsing instead of `URL`/`URLSearchParams`;
- XHR pretending to be Fetch;
- string interpolation based on `new Function`;
- prefixed browser APIs and silent unsupported fallbacks.

This section is not a license to discard the external workflow. Each workflow remains in the recovery queue until it has either a documented standard migration or a tested replacement module.
