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
  '/async/throttle.js',
  '/browser/notifications.js',
  '/browser/service-worker.js',
  '/dom/page.js',
  '/array/random.js',
  '/array/records.js',
  '/crypto/index.js',
  '/crypto/csr.js',
  '/crypto/keys.js',
  '/crypto/md5.js',
  '/crypto/pem.js',
  '/datetime/format.js',
  '/devices/geolocation.js',
  '/devices/serial.js',
  '/devices/orientation.js',
  '/dom/dialog.js',
  '/dom/action-link.js',
  '/dom/events.js',
  '/dom/form-data.js',
  '/dom/form-request.js',
  '/dom/keyboard.js',
  '/dom/movable.js',
  '/dom/nodes.js',
  '/dom/query.js',
  '/dom/resizable.js',
  '/dom/select.js',
  '/dom/sidebar.js',
  '/dom/stylesheets.js',
  '/encoding/base32.js',
  '/encoding/base64.js',
  '/encoding/bech32.js',
  '/encoding/csv.js',
  '/encoding/hex.js',
  '/files/read.js',
  '/graphics/canvas.js',
  '/graphics/color.js',
  '/localization/messages.js',
  '/media/audio.js',
  '/media/capture.js',
  '/media/video.js',
  '/media/session.js',
  '/media/spectrum.js',
  '/media/recording.js',
  '/navigation/router.js',
  '/net/websocket.js',
  '/net/webrtc.js',
  '/storage/local.js',
  '/storage/cookies.js',
  '/storage/snapshot.js',
  '/streams/text.js',
];

const examplePages = [
  '/examples/animation/',
  '/examples/audio/',
  '/examples/audio/piano.html',
  '/examples/audio/spectrum.html',
  '/examples/bluetooth/',
  '/examples/dom/dialog.html',
  '/examples/dom/action-link.html',
  '/examples/dom/form.html',
  '/examples/dom/calendar.html',
  '/examples/dom/combobox.html',
  '/examples/dom/copy.html',
  '/examples/dom/icon.html',
  '/examples/dom/move.html',
  '/examples/dom/progressbar.html',
  '/examples/dom/resize.html',
  '/examples/dom/sidebar.html',
  '/examples/dom/storage-backup.html',
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
  '/examples/sensor/',
  '/examples/time/',
  '/examples/usb/',
  '/examples/webrtc/',
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
  await expect(page.locator('#results li')).toHaveCount(23);
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

test('storage backup validates and imports without clearing by default', async ({ page }) => {
  await page.goto('/examples/dom/storage-backup.html');
  const result = await page.locator('storage-backup').evaluate(async element => {
    const values = new Map([['existing', 'kept']]);
    element.storage = {
      get length() { return values.size; },
      key(index) { return [...values.keys()][index] ?? null; },
      getItem(key) { return values.get(key) ?? null; },
      setItem(key, value) { values.set(String(key), String(value)); },
      clear() { values.clear(); },
    };
    const file = new File([
      JSON.stringify({ version: 1, entries: [['imported', 'yes']] }),
    ], 'backup.json', { type: 'application/json' });
    const count = await element.importFile(file);
    return { count, entries: [...values.entries()] };
  });
  expect(result).toEqual({ count: 1, entries: [['existing', 'kept'], ['imported', 'yes']] });
});

test('date calendar provides roving keyboard selection and valid civil dates', async ({ page }) => {
  await page.goto('/examples/dom/calendar.html');
  const calendar = page.locator('date-calendar');
  await expect(calendar.locator('button[data-date]')).toHaveCount(42);
  const selected = calendar.locator('button[data-date="2024-02-14"]');
  await selected.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(calendar).toHaveAttribute('value', '2024-02-15');
  await expect(page.locator('#value')).toHaveText('2024-02-15');
  await expect(calendar.locator('button[data-date="2024-02-15"]')).toHaveAttribute('aria-pressed', 'true');
});

test('rich combobox preserves form value and skips disabled options by keyboard', async ({ page }) => {
  await page.goto('/examples/dom/combobox.html');
  const combobox = page.locator('rich-combobox');
  const input = combobox.locator('input[role="combobox"]');
  await input.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(combobox).toHaveJSProperty('value', 'gamma');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  const formValue = await page.locator('#example').evaluate(form => new FormData(form).get('flavor'));
  expect(formValue).toBe('gamma');
});

test('piano keyboard emits balanced accessible keyboard note events', async ({ page }) => {
  await page.goto('/examples/audio/piano.html');
  const key = page.locator('piano-keyboard button[aria-label="C4"]');
  await key.focus();
  await page.keyboard.down('Space');
  await expect(key).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#status')).toHaveText('Start C4');
  await page.keyboard.up('Space');
  await expect(key).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#status')).toHaveText('End C4');
});

test('spectrum element starts and stops an injected analyser explicitly', async ({ page }) => {
  await page.goto('/examples/audio/spectrum.html');
  const result = await page.locator('spectrum-view').evaluate(async view => {
    view.analyser = {
      frequencyBinCount: 4,
      getByteFrequencyData(values) { values.fill(128); },
    };
    view.start();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const wasRunning = view.running;
    view.stop();
    return { wasRunning, stopped: !view.running };
  });
  expect(result).toEqual({ wasRunning: true, stopped: true });
});

test('sidebar toggles button disclosures without hijacking leaf links', async ({ page }) => {
  await page.goto('/examples/dom/sidebar.html');
  const button = page.getByRole('button', { name: 'Projects' });
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#projects')).toBeVisible();
  const prevented = await page.locator('#settings').evaluate(anchor => {
    let result;
    anchor.addEventListener('click', event => { queueMicrotask(() => { result = event.defaultPrevented; }); }, { once: true });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    anchor.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(prevented).toBe(false);
});

test('animation recipes start and stop without global handlers or residual ripples', async ({ page }) => {
  await page.goto('/examples/animation/');
  await page.getByRole('button', { name: 'Start canvases' }).click();
  await page.getByRole('button', { name: 'Ripple' }).click({ position: { x: 5, y: 5 } });
  await expect(page.locator('#ripple span')).toHaveCount(1);
  await page.getByRole('button', { name: 'Stop canvases' }).click();
  await expect(page.locator('#ripple span')).toHaveCount(0, { timeout: 1_000 });
  const globals = await page.evaluate(() => ({ move: window.onmousemove, out: window.onmouseout }));
  expect(globals).toEqual({ move: null, out: null });
});

test('form and link examples construct requests without hidden network work', async ({ page }) => {
  await page.goto('/examples/dom/form.html');
  await page.getByRole('button', { name: 'Preview request' }).click();
  await expect(page.locator('#request')).toHaveText('POST /profiles name=Ada&intent=preview');
  await page.goto('/examples/dom/action-link.html');
  await page.getByRole('link', { name: 'Remove profile' }).click();
  await expect(page.locator('#request')).toHaveText('DELETE /profiles/42');
});

test('WebRTC example creates and explicitly closes a native peer connection', async ({ page }) => {
  await page.goto('/examples/webrtc/');
  await page.getByRole('button', { name: 'Create local offer' }).click();
  await expect(page.locator('#status')).toContainText('offer:');
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('#status')).toHaveText('Closed');
});

test('movable and resizable controllers use pointer capture and explicit bounds', async ({ page }) => {
  await page.goto('/examples/dom/move.html');
  const target = page.locator('#target');
  const targetBox = await target.boundingBox();
  await page.mouse.move(targetBox.x + 10, targetBox.y + 10);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + 63, targetBox.y + 47);
  await page.mouse.up();
  await expect(page.locator('#position')).toHaveText('55,35');

  await page.goto('/examples/dom/resize.html');
  const handle = page.locator('#handle');
  const handleBox = await handle.boundingBox();
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + handleBox.width / 2 + 40, handleBox.y + handleBox.height / 2 + 30);
  await page.mouse.up();
  await expect(page.locator('#size')).toHaveText('200x130');
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
