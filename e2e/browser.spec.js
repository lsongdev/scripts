import { expect, test } from '@playwright/test';

const coreModules = [
  '/animation/easing.js',
  '/animation/tween.js',
  '/animation/web.js',
  '/async/debounce.js',
  '/async/delay.js',
  '/async/retry.js',
  '/async/serial.js',
  '/async/timeout.js',
  '/browser/notifications.js',
  '/browser/service-worker.js',
  '/browser/page-lifecycle.js',
  '/collections/random.js',
  '/collections/records.js',
  '/crypto/digest.js',
  '/crypto/keys.js',
  '/crypto/md5.js',
  '/crypto/pem.js',
  '/datetime/format.js',
  '/devices/geolocation.js',
  '/devices/serial.js',
  '/devices/orientation.js',
  '/dom/dialog.js',
  '/dom/events.js',
  '/dom/form-data.js',
  '/dom/keyboard.js',
  '/dom/nodes.js',
  '/dom/query.js',
  '/encoding/base32.js',
  '/encoding/base64.js',
  '/encoding/bech32.js',
  '/encoding/csv.js',
  '/files/read.js',
  '/graphics/canvas.js',
  '/graphics/color.js',
  '/media/audio.js',
  '/media/capture.js',
  '/media/video.js',
  '/media/session.js',
  '/media/recording.js',
  '/navigation/router.js',
  '/net/websocket.js',
  '/storage/local.js',
  '/storage/cookies.js',
  '/storage/snapshot.js',
  '/streams/text.js',
];

const examplePages = [
  '/examples/audio/',
  '/examples/bluetooth/',
  '/examples/dom/dialog.html',
  '/examples/dom/copy.html',
  '/examples/dom/icon.html',
  '/examples/dom/move.html',
  '/examples/dom/progressbar.html',
  '/examples/dom/resize.html',
  '/examples/dom/tabs.html',
  '/examples/dom/table.html',
  '/examples/file/',
  '/examples/hid/',
  '/examples/location/',
  '/examples/media/',
  '/examples/media/recorder.html',
  '/examples/notification/',
  '/examples/qrcode/',
  '/examples/router/',
  '/examples/serialport/',
  '/examples/services/',
  '/examples/time/',
  '/examples/usb/',
];

function collectRuntimeErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

test('every core leaf module imports without starting work', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/tests/blank.html');
  const exportsByModule = await page.evaluate(async modules => {
    const entries = await Promise.all(modules.map(async path => [
      path,
      Object.keys(await import(path)),
    ]));
    return Object.fromEntries(entries);
  }, coreModules);

  expect(errors).toEqual([]);
  for (const path of coreModules) {
    expect(exportsByModule[path].length, `${path} must expose a deliberate API`).toBeGreaterThan(0);
  }
});

test('browser contract harness passes', async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto('/tests/browser.html');
  await expect(page.locator('html')).toHaveAttribute('data-status', 'passed');
  await expect(page.locator('html')).toHaveAttribute('data-failures', '0');
  await expect(page.locator('#results li')).toHaveCount(19);
  expect(errors).toEqual([]);
});

test('experimental QR element renders from the exact vendor snapshot', async ({ page }) => {
  await page.goto('/examples/qrcode/');
  const image = page.locator('x-qrcode img');
  await expect(image).toHaveAttribute('src', /^data:image\/png/);
});

test('WebSocket helpers preserve native events and AbortSignal lifecycle', async ({ page }) => {
  await page.goto('/tests/blank.html');
  const result = await page.evaluate(async () => {
    const { connect, createMessageStream } = await import('/net/websocket.js');
    const controller = new AbortController();
    const socket = await connect(`ws://${location.host}/__test__/websocket`, {
      signal: controller.signal,
    });
    const reader = createMessageStream(socket).getReader();
    socket.send('browser echo');
    const { value: event } = await reader.read();
    await reader.cancel();

    const closed = new Promise(resolve => {
      socket.addEventListener('close', closeEvent => resolve({
        code: closeEvent.code,
        reason: closeEvent.reason,
      }), { once: true });
    });
    controller.abort(new DOMException('test complete', 'AbortError'));

    return {
      close: await closed,
      data: event.data,
      isMessageEvent: event instanceof MessageEvent,
      isWebSocket: socket instanceof WebSocket,
    };
  });

  expect(result).toEqual({
    close: { code: 1000, reason: 'Aborted' },
    data: 'browser echo',
    isMessageEvent: true,
    isWebSocket: true,
  });
});

test('geolocation helper returns the native browser position', async ({ page, context }) => {
  await context.grantPermissions(['geolocation'], {
    origin: 'http://127.0.0.1:4173',
  });
  await context.setGeolocation({ latitude: 31.2304, longitude: 121.4737 });
  await page.goto('/tests/blank.html');

  const result = await page.evaluate(async () => {
    const { getCurrentPosition } = await import('/devices/geolocation.js');
    const position = await getCurrentPosition();
    return {
      isNativePosition: position instanceof GeolocationPosition,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  });

  expect(result).toEqual({
    isNativePosition: true,
    latitude: 31.2304,
    longitude: 121.4737,
  });
});

test('autonomous data table renders idempotently across engines', async ({ page }) => {
  await page.goto('/examples/dom/table.html');
  await expect(page.locator('data-table thead th')).toHaveCount(2);
  await expect(page.locator('data-table tbody tr')).toHaveCount(2);
  await page.locator('data-table').evaluate(table => {
    table.data = [{ name: 'Updated', role: 'Tester' }];
  });
  await expect(page.locator('data-table tbody tr')).toHaveCount(1);
  await expect(page.locator('data-table tbody')).toContainText('Updated');
});

test('autonomous copy button exposes an explicit Clipboard workflow', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText(value) {
          globalThis.__copiedText = value;
          return Promise.resolve();
        },
      },
    });
  });
  await page.goto('/examples/dom/copy.html');
  await page.locator('copy-button[value]').click();
  await expect.poll(() => page.evaluate(() => globalThis.__copiedText)).toBe('Explicit value');
});

for (const path of examplePages) {
  test(`example loads without runtime errors: ${path}`, async ({ page }) => {
    const errors = collectRuntimeErrors(page);
    const response = await page.goto(path);
    expect(response?.ok()).toBe(true);
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
}
