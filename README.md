# Web Standard Library

Small, composable ES modules that fill recurring gaps in the Web Platform without replacing it.

> Use the Web. Fill the gaps. Own nothing.

This repository is being reorganized from a long-lived scripts collection into a versioned Web standard library. There is not yet a stable release surface. See [the module registry](./docs/modules.md) before depending on a URL, [the candidate API contracts](./docs/api-contracts.md), [the deleted-module recovery audit](./docs/deleted-module-audit.md), and [the refactor status](./docs/refactor-status.md) for the remaining distance.

## Design rules

- Return standard Web objects instead of library-owned wrappers.
- Importing a module must not start work or mutate global state.
- Prefer leaf-module imports over broad namespace imports.
- Use `AbortSignal` as the shared lifecycle and cancellation protocol.
- Do not wrap a modern native API when it is already sufficient.
- Do not require a compiler, bundler, package manager, or application runtime.
- Do not place legacy-browser fallbacks or deprecated entry points in the core library.

Development tools may be used to test the repository. Consumers receive ordinary, directly importable ESM.

## Repository structure

```text
animation/      timing and Web Animations workflows
async/          asynchronous workflows
browser/        browser-level capabilities
crypto/         Web Crypto workflows
datetime/       date, time-zone, and duration workflows
devices/        device and sensor capabilities
dom/            DOM workflows
encoding/       binary and textual encodings
files/          File and Blob workflows
graphics/       Canvas and color workflows
media/          media capture workflows
navigation/     URL/history navigation workflows
net/            network protocols beyond native fetch
storage/        storage workflows
streams/        Web Streams workflows

elements/       optional Web Components
adapters/       optional framework adapters
integrations/   provider-specific APIs
labs/           experiments outside the core admission boundary
vendor/         isolated third-party source
examples/       browser examples
docs/           architecture and project decisions
```

The allowed dependency direction is:

```text
Web Platform <- capability modules <- elements / adapters / integrations / examples
```

Capability modules must never depend on optional layers, `labs/`, or `vendor/`.

Optional adapters may use pinned bare package specifiers. Browser consumers of
those adapters own the corresponding import map; capability modules remain
dependency-free.

## Current usage

Until a versioned release exists, use relative paths while developing against this checkout and import the narrowest module that provides the capability:

```js
import { delay } from './async/delay.js';
import { on } from './dom/events.js';
import { $ } from './dom/query.js';

on($('#save'), 'click', save);
```

The public API will be published through immutable version URLs. A floating `latest` URL may be offered for experimentation, but it will not be recommended for production use.

## Compatibility policy

Core modules target the standard API directly. Vendor-prefixed APIs, deprecated signatures, forwarding files, and behavior compatibility are not maintained in the core.

When a downstream environment lacks a required capability, the downstream application may choose a separate adapter or polyfill. Such compatibility code must not become a transitive dependency of this library. See the full [roadmap and compatibility policy](./docs/web-stdlib-roadmap.md#6-兼容性政策).

## Status

The project is currently in the boundary and correctness phases of the roadmap:

1. classify every module;
2. make imports inert and dependencies one-directional;
3. remove native reimplementations and incomplete APIs;
4. add contract tests and real-browser tests;
5. publish a deliberately small, immutable versioned surface.

No module is `stable` until those gates are satisfied.

## Verification

Run the repository gate before committing:

```sh
npm run check
```

On a new development machine, install the pinned test dependencies and browser engines once:

```sh
npm ci
npx playwright install
```

The local gate checks JavaScript syntax, relative-import resolution, local HTML assets, the absence of root-level JavaScript entry points, core dependency direction, the Node contract suite, core import smoke tests, the browser contract harness, and representative examples in Chromium and WebKit. CI additionally runs the same browser suite in Firefox. Playwright and its browser binaries are development-only; published modules have no runtime dependency on them.

## License

[MIT](./LICENSE) © Lsong
