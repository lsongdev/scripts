# v0 candidate API contracts

These contracts cover the deliberately small first-release candidate surface. They describe intended behavior, not a stable-version promise. A module remains `candidate` until the release gates in [`modules.md`](./modules.md) are satisfied.

## Shared rules

- Every file is a directly importable ES module and performs no work during import.
- Inputs and outputs use platform objects. Options bags do not hide application state.
- Unsupported platform capabilities throw `ReferenceError`; invalid arguments use `TypeError`, `RangeError`, or `SyntaxError` as appropriate.
- A supplied `AbortSignal` is authoritative. An already-aborted signal fails before work starts; later abort rejects or ends owned work with `signal.reason`.
- Functions that register listeners return an idempotent disposer when a synchronous return value is practical.
- Text means Unicode text. Binary codecs never guess a text encoding and accept or return byte-oriented standard objects.
- Functions containing `Unsafe` perform no sanitization. Their input must already be trusted or sanitized by the application.
- Compatibility aliases, deprecated signatures, vendor prefixes, and old-path forwarding files are outside this contract.

## Proposed first surface

### `async/delay.js`

```js
delay(milliseconds, { signal } = {}) -> Promise<void>
```

- `milliseconds` must be finite and non-negative.
- Resolves after the timer fires.
- Rejects with `signal.reason` and clears the timer when aborted.
- Owns no work after settlement.

### `async/debounce.js`

```js
debounce(fn, wait, { signal } = {}) -> debounced
debounced.clear() -> void
debounced.flush() -> ReturnType<fn> | undefined
debounced.pending -> boolean
```

- Only the latest pending call is retained; receiver and arguments are preserved.
- `clear()` discards pending work. `flush()` runs it synchronously once.
- Aborting clears pending work; later calls and flushes throw `signal.reason`.
- It does not promise a result for ordinary delayed invocations and is not an async task queue.

### `encoding/base32.js`

```js
bytesToBase32(bytes) -> string
base32ToBytes(text) -> Uint8Array
```

- Uses the RFC 4648 alphabet and emits padded uppercase output.
- Decoding accepts uppercase/lowercase and padded/unpadded input.
- Invalid alphabet characters throw `SyntaxError`; text encoding is the caller's responsibility.

### `encoding/base64.js`

```js
bytesToBase64(bytes) -> string
base64ToBytes(text) -> Uint8Array
bytesToBase64URL(bytes) -> string
base64URLToBytes(text) -> Uint8Array
```

- Byte input is `ArrayBuffer` or any `ArrayBufferView`.
- Base64url output is unpadded; decoding accepts padded or unpadded input.
- Native `btoa`/`atob` validation errors pass through.
- These functions do not encode or decode Unicode strings; use `TextEncoder`/`TextDecoder` explicitly.

### `dom/query.js`

```js
$(selector, root = document) -> Element | null
$$(selector, root = document) -> Element[]
xpath(expression, root = document) -> Node[]
```

- CSS selector parsing and errors are native.
- `$` preserves the native nullable result; `$$` deliberately snapshots into a plain array.
- `root` may be a compatible query context. XPath uses ordered snapshot semantics.
- No query is cached and no page state is read during import.

### `dom/events.js`

```js
on(target, type, listener, options) -> dispose
delegate(root, type, selector, listener, options) -> dispose
ready(callback?, { document, signal } = {}) -> Promise<unknown>
```

- `on` passes native event options through unchanged, including `signal`.
- `delegate` matches the closest descendant and invokes `listener` with that element as `this`.
- `ready` resolves immediately for interactive/complete documents or waits for `DOMContentLoaded`.
- Disposers remove only the listener created by that call.

### `dom/nodes.js`

```js
appendChildren(element, children) -> element
createElement(name, properties = {}, children) -> Element
parseHTMLUnsafe(html) -> DocumentFragment
```

- Children may be nested arrays of Nodes and primitive values; `null`, `undefined`, and `false` are omitted.
- Primitive children become text. Properties are assigned with standard DOM property semantics.
- `parseHTMLUnsafe` uses a template element and performs no sanitization or script policy enforcement.

### `dom/form-data.js`

```js
formDataToObject(formData) -> null-prototype object
formToObject(form, submitter?) -> null-prototype object
```

- Entry order is preserved.
- A unique name maps to its `string | File`; repeated names map to an array in encounter order.
- Browser `FormData` successful-control and submitter semantics remain authoritative.
- No JSON coercion, checkbox reinterpretation, validation, request, or persistence policy is added.

### `dom/dialog.js`

```js
createDialog(content?) -> HTMLDialogElement
createDialogFromHTMLUnsafe(html) -> HTMLDialogElement
bindDialog(dialog, { closeOnBackdrop, signal } = {}) -> dispose
showDialog(dialog, { initialFocus, modal, signal } = {}) -> HTMLDialogElement
createSimpleDialog(title, content, buttons?) -> HTMLDialogElement
confirmDialog(message, options?) -> Promise<boolean>
```

- Normal creation treats strings as text and accepts existing Nodes.
- `bindDialog` recognizes `[data-dialog-close]` controls and optional backdrop dismissal.
- `showDialog` uses native `showModal()`/`show()`, appends disconnected dialogs, and restores prior focus after close.
- `confirmDialog` owns and removes its generated dialog; it resolves only for the explicit confirm value and rejects with `signal.reason` on abort.
- Styling, animation, focus-trap replacement, and legacy modal emulation are out of scope.

### `files/read.js`

```js
readText(blob, { encoding = 'utf-8' } = {}) -> Promise<string>
readArrayBuffer(blob) -> Promise<ArrayBuffer>
```

- Input must be a `Blob` or subclass such as `File`.
- UTF-8 delegates to `Blob.text()`; another encoding uses `TextDecoder` over `Blob.arrayBuffer()`.
- No `FileReader`, binary-string mode, upload policy, or object-URL lifecycle is hidden here.

### `storage/local.js`

```js
createStorage({ namespace = '', storage = localStorage, cache = true } = {})
  -> { get, set, has, remove, keys, clear }
```

- Operations are synchronous and preserve native `Storage` string/null semantics.
- Namespace clear removes only keys owned by that namespace.
- The optional in-memory cache is local to the created view and kept consistent with its own writes/removes/clear.
- Cross-document `StorageEvent` synchronization and JSON serialization are separate policies, not implicit behavior.

### `streams/text.js`

```js
decodeText(stream, options?) -> ReadableStream<string>
encodeText(stream) -> ReadableStream<Uint8Array>
readStream(stream, { signal } = {}) -> AsyncIterable
readText(stream, { encoding, signal } = {}) -> Promise<string>
readLines(stream, { encoding, signal } = {}) -> AsyncIterable<string>
parseJSONLines(stream, { encoding, signal, skipBlank } = {}) -> AsyncIterable<unknown>
writeText(stream, chunks, { signal } = {}) -> Promise<void>
```

- Reader/writer locks are always released.
- Abort cancels/aborts the owned reader or writer with `signal.reason`.
- Decoding preserves multibyte characters split across chunks; line parsing accepts LF and CRLF and preserves interior blank lines.
- `writeText` stringifies chunks, closes on success, aborts on failure, and does not add byte encoding implicitly.

### `crypto/digest.js`

```js
digest(algorithm, value, { crypto } = {}) -> Promise<ArrayBuffer>
sha256(value, options?) -> Promise<ArrayBuffer>
sha384(value, options?) -> Promise<ArrayBuffer>
sha512(value, options?) -> Promise<ArrayBuffer>
hmac(hash, key, value, { crypto } = {}) -> Promise<ArrayBuffer>
```

- String values are UTF-8 encoded; other values are passed to Web Crypto as binary data.
- HMAC accepts a `CryptoKey` or raw byte-oriented key material.
- Algorithm validation and cryptographic failures are native Web Crypto behavior.
- Results remain bytes; hexadecimal/base64 presentation is explicit downstream work.

### `crypto/keys.js`

```js
generateAESKey(options?) -> Promise<CryptoKey>
generateECDHKeyPair(options?) -> Promise<CryptoKeyPair>
generateRSAKeyPair(options?) -> Promise<CryptoKeyPair>
deriveECDHKey(privateKey, publicKey, derivedKeyType, options?) -> Promise<CryptoKey>
```

- Defaults are AES-GCM 256, ECDH P-256, and RSA-PSS 3072/SHA-256.
- Generated and derived keys are non-extractable by default.
- Callers explicitly choose usages when defaults do not match the workflow.
- The module does not invent key containers, persistence, rotation, envelopes, or protocol formats.

### `crypto/pem.js`

```js
encodePEM(label, der) -> string
decodePEM(text) -> { label, bytes: Uint8Array }
exportKeyPEM(key, { crypto } = {}) -> Promise<string>
importKeyPEM(text, algorithm, options?) -> Promise<CryptoKey>
```

- `decodePEM` accepts exactly one matching uppercase-label PEM block and rejects malformed or mismatched boundaries.
- Key export uses SPKI/`PUBLIC KEY` or PKCS#8/`PRIVATE KEY`; unsupported key types fail through Web Crypto.
- Key import supports those two labels only. Algorithm, extractability, and usages remain explicit.
- Certificates, PKCS#1, encrypted private keys, CSR, ASN.1 authoring, and compatibility parsing are out of scope.

### `media/audio.js`

```js
createAudioContext(options?, dependencies?) -> AudioContext
createOscillator(context, options?) -> OscillatorNode
createGain(context, options?) -> GainNode
connectNodes(...nodes) -> AudioNode | AudioParam
noteToFrequency(note, options?) -> number
createNoiseBuffer(context, options?) -> AudioBuffer
createNoiseSource(context, options?) -> AudioBufferSourceNode
playNote(context, note, options?) -> { oscillator, gain, source, stop }
playNoise(context, type, duration?, options?) -> { source, gain, stop }
```

- Construction helpers return standard Web Audio nodes and never start playback implicitly.
- Zero gain is preserved; numeric timing, frequency, gain, and duration inputs are validated rather than coerced through truthiness.
- Note names use scientific pitch notation and accept sharps/flats; presentation, tuning systems beyond an explicit A4 reference, and MIDI transport are separate concerns.
- White, pink, and brown noise buffers are generated explicitly. Randomness may be injected for deterministic testing; this is signal generation, not cryptographic randomness.
- Playback helpers return native nodes plus an idempotent `stop()` and honor `AbortSignal`; the caller owns the AudioContext lifecycle.
- Named game/environment effects are recipes in `labs/audio/`, not core signal-processing contracts.

## Deferred from the first surface

The following modules remain useful candidates but are deliberately excluded from the first stable set until their browser-specific evidence is stronger:

- `browser/notifications.js`: real permission-state testing. The local Playwright grant is accepted by the harness but does not transition Chromium/WebKit `Notification.permission`, so mocks are not counted as browser evidence.
- `devices/geolocation.js`: granted permission and native position now have Chromium/WebKit coverage; denial and watch lifecycle remain deferred.
- `devices/serial.js`: permission/chooser/device lifecycle testing.
- `media/capture.js`: permission, track, and device-change workflows.
- `navigation/router.js`: History API and URLPattern now have Chromium/WebKit coverage; navigation edge cases remain deferred.
- `net/websocket.js`: real-server connect/message/normal-close behavior now has Chromium/WebKit coverage; failure, abnormal-close, and backpressure behavior remain deferred.
- `labs/dom/movable.js` and `labs/dom/resizable.js`: experimental UI behaviors, not first-surface DOM utilities; pointer capture, geometry bounds, multiple pointers, and cleanup contracts remain unresolved.

Deferral does not create compatibility obligations. Downstream applications may use a candidate knowingly, but its current signature may still be replaced or removed before the first stable release.
