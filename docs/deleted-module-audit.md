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
| animation | `animate/*`, tween example | `animation/` primitives around Web Animations plus optional recipes; explicit cancellation and native `Animation` objects. |
| graphics | `canvas.js`, `color.js` | `graphics/` candidate modules; correct Canvas state ownership, color-space math, validation, and tests. |
| encodings/security | `crypto/bech32.js`, `crypto/csr.js` | Bech32/Bech32m with published vectors; CSR as an explicitly versioned ASN.1 adapter rather than a floating CDN import. |
| document runtime | `html/*` | Separately bounded renderer package/labs module with security, event cleanup, update, and nested-template tests. |
| UI elements | calendar, copy, form, link, backup, piano, select, sidebar, spectrum, table | Autonomous and explicitly registered elements where portable; otherwise host-specific adapters with the browser constraint documented. |
| formats/storage | empty `csv.js`, empty `cookie.js` | New CSV and Cookie contracts rather than restoring empty files. |
| input/device | `keyboard.js`, `motion.js` | Inert EventTarget/AbortSignal workflows; no import-time singleton or listener. |
| media | Media Session helpers, recorder example, player | Separate capture, playback, recording, and Media Session contracts with explicit resource ownership. |
| lifecycle | `sw.js`, `dom/page.js` | Explicit service-worker/page-lifecycle operations returning native objects and disposers. |
| application helpers | i18n, regex, form persistence/request | Separate optional/application modules after safe interpolation, validation, and storage ownership are defined. |

## Behaviors not restored as implementations

Some old files consisted only of an empty body, deprecated forwarding, unsafe dynamic evaluation, or a defective imitation of a native API. Their external use still matters, but the migration target is the standard or a newly designed narrow capability—not the old implementation:

- root forwarding/barrel files and import-time auto-registration;
- empty `bytes.js`, `csv.js`, and `cookie.js` bodies;
- Array/Object/Promise/Number wrappers already provided by the language;
- regex URL parsing instead of `URL`/`URLSearchParams`;
- XHR pretending to be Fetch;
- string interpolation based on `new Function`;
- prefixed browser APIs and silent unsupported fallbacks.

This section is not a license to discard the external workflow. Each workflow remains in the recovery queue until it has either a documented standard migration or a tested replacement module.
