import { animate } from '../animation/web.js';
import { debounce } from '../async/debounce.js';
import { delay } from '../async/delay.js';
import { sha256 } from '../crypto/digest.js';
import { generateAESKey } from '../crypto/keys.js';
import { bindDialog, createDialog, createDialogFromHTMLUnsafe, showDialog } from '../dom/dialog.js';
import { bindLinkAction, linkToRequest } from '../dom/action-link.js';
import { delegate, on } from '../dom/events.js';
import { formDataToObject, formToObject } from '../dom/form-data.js';
import { bindFormSubmission, formToRequest } from '../dom/form-request.js';
import { getSelectedItem, setSelectOptions } from '../dom/select.js';
import { adoptStyleSheets, createStyleSheet } from '../dom/stylesheets.js';
import { createElement, parseHTMLUnsafe } from '../dom/nodes.js';
import { $, $$, xpath } from '../dom/query.js';
import { defineElement } from '../elements/define.js';
import { readArrayBuffer, readText as readBlobText } from '../files/read.js';
import { clear as clearCanvas, fill as fillCanvas } from '../graphics/canvas.js';
import {
  createGain as createAudioGain,
  createNoiseBuffer,
  createOscillator as createAudioOscillator,
  noteToFrequency,
} from '../media/audio.js';
import { createRouter } from '../navigation/router.js';
import { attachMediaStream } from '../media/video.js';
import { readText as readStreamText, writeText } from '../streams/text.js';
import { initMovable } from '../elements/movable.js';
import { initResizable } from '../elements/resizable.js';

const tests = [];
const test = (name, run) => tests.push({ name, run });
const assert = (condition, message = 'Assertion failed') => {
  if (!condition) throw new Error(message);
};

test('timing helpers honor browser timers and AbortSignal', async () => {
  const reason = new DOMException('cancel timing', 'AbortError');
  const controller = new AbortController();
  const pending = delay(1_000, { signal: controller.signal });
  controller.abort(reason);
  try {
    await pending;
    assert(false, 'aborted delay must reject');
  } catch (error) {
    assert(error === reason);
  }

  const calls = [];
  const invoke = debounce(value => calls.push(value), 1_000);
  invoke('discarded');
  invoke('latest');
  assert(invoke.pending === true);
  invoke.flush();
  assert(invoke.pending === false);
  assert(calls.join(',') === 'latest');
});

test('Web Animations helper returns the native Animation and honors abort', async () => {
  const element = document.createElement('div');
  document.body.append(element);
  const completed = animate(element, [{ opacity: 0 }, { opacity: 1 }], { duration: 1 });
  assert(completed instanceof Animation);
  await completed.finished;

  const controller = new AbortController();
  const canceled = animate(element, [{ opacity: 1 }, { opacity: 0 }], {
    duration: 10_000,
  }, { signal: controller.signal });
  controller.abort();
  assert(canceled.playState === 'idle');
  element.remove();
});

test('crypto helpers preserve browser-native results', async () => {
  const bytes = new Uint8Array(await sha256('abc'));
  const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  assert(hex === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');

  const key = await generateAESKey();
  assert(key instanceof CryptoKey);
  assert(key.algorithm.name === 'AES-GCM');
  assert(key.algorithm.length === 256);
  assert(key.extractable === false);
});

test('audio helpers preserve native nodes and deterministic signal data', () => {
  assert(noteToFrequency('A4') === 440);
  assert(Math.abs(noteToFrequency('C4') - 261.625565) < 0.000001);

  const context = new OfflineAudioContext(1, 4_410, 44_100);
  const oscillator = createAudioOscillator(context, { frequency: 220, type: 'triangle' });
  const gain = createAudioGain(context, { gain: 0 });
  assert(oscillator instanceof OscillatorNode);
  assert(oscillator.frequency.value === 220);
  assert(gain instanceof GainNode);
  assert(gain.gain.value === 0);

  const noise = createNoiseBuffer(context, {
    duration: 0.01,
    random: () => 0.5,
    type: 'white',
  });
  assert(noise instanceof AudioBuffer);
  assert(noise.length === 441);
  assert(noise.getChannelData(0).every(sample => sample === 0));
});

test('video and camera helpers keep permission and stream ownership explicit', async () => {
  const video = document.createElement('video');
  const stream = new MediaStream();
  const controller = new AbortController();
  const detach = attachMediaStream(video, stream, {
    muted: true,
    signal: controller.signal,
  });
  assert(video.srcObject === stream);
  assert(video.muted === true);
  controller.abort();
  assert(video.srcObject === null);
  detach();

  const { defineCamera } = await import('../elements/camera.js');
  defineCamera();
  const camera = document.createElement('camera-view');
  document.body.append(camera);
  assert(camera.stream === undefined);
  const returned = await camera.start({
    navigator: {
      mediaDevices: {
        getUserMedia: async constraints => {
          assert(constraints.audio === false);
          assert(constraints.video === true);
          return stream;
        },
      },
    },
    play: false,
  });
  assert(returned === stream);
  assert(camera.video.srcObject === stream);
  camera.stop();
  assert(camera.stream === undefined);
  camera.remove();
});

test('canvas helpers draw pixels without leaking context state', () => {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 1;
  const context = canvas.getContext('2d');
  const originalFill = context.fillStyle;
  fillCanvas(context, { fillStyle: '#ff0000' });
  assert(context.fillStyle === originalFill);
  assert([...context.getImageData(0, 0, 1, 1).data].join(',') === '255,0,0,255');
  clearCanvas(context, { width: 1, height: 1 });
  assert([...context.getImageData(0, 0, 1, 1).data].join(',') === '0,0,0,0');
});

test('form requests preserve native successful controls and explicit submission', async () => {
  const form = document.createElement('form');
  form.action = '/save?existing=1';
  form.method = 'post';
  form.enctype = 'application/x-www-form-urlencoded';
  form.innerHTML = '<input name="name" value="Ada"><input name="tag" value="web"><input name="tag" value="standards">';
  const request = formToRequest(form);
  assert(request instanceof Request);
  assert(request.method === 'POST');
  assert(await request.text() === 'name=Ada&tag=web&tag=standards');

  let submitted;
  const dispose = bindFormSubmission(form, next => { submitted = next; });
  form.dispatchEvent(new SubmitEvent('submit', { cancelable: true }));
  assert(submitted instanceof Request);
  dispose();
});

test('link actions preserve modified navigation and build explicit Requests', () => {
  const link = document.createElement('a');
  link.href = '/resource/1';
  const request = linkToRequest(link, { method: 'DELETE', headers: { 'x-test': 'yes' } });
  assert(request instanceof Request);
  assert(request.method === 'DELETE');
  let handled = 0;
  const dispose = bindLinkAction(link, () => { handled += 1; }, { method: 'POST' });
  const normal = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
  link.dispatchEvent(normal);
  assert(normal.defaultPrevented && handled === 1);
  const modified = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ctrlKey: true });
  let modifiedWasPrevented;
  link.addEventListener('click', event => {
    modifiedWasPrevented = event.defaultPrevented;
    event.preventDefault();
  }, { once: true });
  link.dispatchEvent(modified);
  assert(modifiedWasPrevented === false && handled === 1);
  dispose();
});

test('select mapping preserves native select semantics and source items', () => {
  const select = document.createElement('select');
  const items = [{ id: 1, name: '<Admin>' }, { id: 2, name: 'User', disabled: true }];
  setSelectOptions(select, items, {
    value: item => item.id,
    label: item => item.name,
    placeholder: 'Choose',
    selectedValue: 1,
  });
  assert(select instanceof HTMLSelectElement);
  assert(select.value === '1');
  assert(select.options[1].textContent === '<Admin>');
  assert(getSelectedItem(select) === items[0]);
});

test('constructable stylesheets are explicitly adopted and selectively removed', () => {
  const root = document.createElement('div').attachShadow({ mode: 'open' });
  const existing = createStyleSheet(':host { display: block }');
  const added = createStyleSheet('span { color: red }');
  root.adoptedStyleSheets = [existing];
  const dispose = adoptStyleSheets(root, [existing, added]);
  assert(root.adoptedStyleSheets.length === 2);
  dispose();
  assert(root.adoptedStyleSheets.length === 1 && root.adoptedStyleSheets[0] === existing);
});

test('query and node helpers preserve DOM objects', () => {
  const root = createElement('section', { id: 'query-root' }, [
    createElement('span', { className: 'item' }, 'one'),
    createElement('span', { className: 'item' }, 'two'),
  ]);
  document.body.append(root);
  assert($('#query-root') === root);
  assert($$('.item', root).length === 2);
  assert(root.firstElementChild instanceof HTMLSpanElement);
  root.remove();
});

test('query helpers honor ShadowRoot and native XPath boundaries', () => {
  const host = createElement('div');
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.append(
    createElement('span', { className: 'shadow-item' }, 'inside'),
    createElement('span', { className: 'shadow-item' }, 'second'),
  );
  document.body.append(host);

  assert($('.shadow-item', shadow).textContent === 'inside');
  assert($$('.shadow-item', shadow).length === 2);
  assert(xpath('//body/div', document).includes(host));
  assert(xpath('//span', document).length === 0);
  host.remove();
});

test('File and Web Streams helpers use browser-native objects', async () => {
  const file = new File(['hello ', new Uint8Array([0xe4, 0xb8, 0x96, 0xe7, 0x95, 0x8c])], 'hello.txt', {
    type: 'text/plain',
  });
  assert(await readBlobText(file) === 'hello 世界');
  assert(new Uint8Array(await readArrayBuffer(file)).length === file.size);

  const byteStream = new Blob(['stream 世界']).stream();
  assert(await readStreamText(byteStream) === 'stream 世界');

  const chunks = [];
  const writable = new WritableStream({
    write(chunk) {
      chunks.push(chunk);
    },
  });
  await writeText(writable, ['one', 2]);
  assert(chunks.join('|') === 'one|2');
});

test('router uses real History API state and aborts prior routes', () => {
  const originalURL = location.href;
  const router = createRouter([
    ['/tests/:page', 'test-route'],
  ]);
  const seen = [];
  const dispose = router.subscribe(route => seen.push(route));
  router.start();
  const previous = router.current;
  const current = router.navigate('/tests/next', { state: { source: 'browser-test' } });

  assert(previous.params.page === 'browser.html');
  assert(previous.signal.aborted === true);
  assert(current.params.page === 'next');
  assert(current.value === 'test-route');
  assert(current.state.source === 'browser-test');
  assert(history.state.source === 'browser-test');
  assert(seen.length === 2);

  dispose();
  router.stop();
  history.replaceState(null, '', originalURL);
});

test('unsafe HTML parsing is explicit', () => {
  const fragment = parseHTMLUnsafe('<strong>trusted</strong>');
  assert(fragment.firstElementChild instanceof HTMLElement);
  assert(fragment.firstElementChild.textContent === 'trusted');
});

test('events return disposers and delegation uses the matched element as this', () => {
  const root = createElement('div', {}, createElement('button', { className: 'action' }, 'go'));
  document.body.append(root);
  let direct = 0;
  const dispose = on(root, 'custom', () => direct += 1);
  root.dispatchEvent(new Event('custom'));
  dispose();
  root.dispatchEvent(new Event('custom'));
  assert(direct === 1);

  let matched;
  const stop = delegate(root, 'click', '.action', function () {
    matched = this;
  });
  root.querySelector('.action').click();
  assert(matched === root.querySelector('.action'));
  stop();
  root.remove();
});

test('form helpers preserve repeated values from a real form', () => {
  const form = createElement('form', {}, [
    createElement('input', { name: 'tag', value: 'one' }),
    createElement('input', { name: 'tag', value: 'two' }),
    createElement('input', { name: 'single', value: 'value' }),
  ]);
  const object = formToObject(form);
  assert(object.single === 'value');
  assert(object.tag.join(',') === 'one,two');
  assert(formDataToObject(new FormData(form)).tag.length === 2);
});

test('custom element registration is explicit', async () => {
  const name = `test-element-${crypto.randomUUID()}`;
  class TestElement extends HTMLElement {}
  assert(customElements.get(name) === undefined);
  defineElement(name, TestElement);
  assert(customElements.get(name) === TestElement);

  assert(customElements.get('progress-bar') === undefined);
  const { defineProgressBar } = await import('../elements/progressbar.js');
  assert(customElements.get('progress-bar') === undefined);
  defineProgressBar();
  assert(customElements.get('progress-bar') !== undefined);
});

test('retained icon and progress elements use explicit local inputs', async () => {
  const { defineIcon } = await import('../elements/icon.js');
  defineIcon();
  const icon = document.createElement('x-icon');
  icon.setAttribute('src', '/examples/dom/home.svg');
  icon.setAttribute('alt', 'Home');
  document.body.append(icon);
  const image = icon.shadowRoot.querySelector('img');
  assert(image.getAttribute('src') === '/examples/dom/home.svg');
  assert(image.alt === 'Home');
  icon.remove();

  const progress = document.createElement('progress-bar');
  progress.value = 62.5;
  document.body.append(progress);
  assert(parseFloat(progress.shadowRoot.querySelector('.progress-bar-inner').style.width) === 62.5);
  progress.remove();
});

test('tabs preserve native roles and explicit selection', async () => {
  const { defineTabs } = await import('../elements/tabs.js');
  defineTabs();
  const tabs = createElement('tab-container', {}, [
    createElement('div', { role: 'tablist' }, [
      createElement('button', { role: 'tab' }, 'First'),
      createElement('button', { role: 'tab' }, 'Second'),
    ]),
    createElement('section', { role: 'tabpanel' }, 'One'),
    createElement('section', { role: 'tabpanel' }, 'Two'),
  ]);
  document.body.append(tabs);
  tabs.selectTab(1);
  assert(tabs.querySelectorAll('[role="tab"]')[1].getAttribute('aria-selected') === 'true');
  assert(tabs.querySelectorAll('[role="tabpanel"]')[0].hidden === true);
  assert(tabs.querySelectorAll('[role="tabpanel"]')[1].hidden === false);
  tabs.remove();
});

test('time element is autonomous, explicit, and time-zone aware', async () => {
  const { defineTime } = await import('../elements/time.js');
  assert(customElements.get('x-time') === undefined);
  defineTime();
  const element = createElement('x-time', {
    datetime: '2026-08-24T12:34:56Z',
    format: '{yyyy}-{MM}-{dd} {HH}:{mm}',
    timezone: 'Asia/Shanghai',
  });
  document.body.append(element);
  assert(element.textContent === '2026-08-24 20:34');
  element.toggleAttribute('relative', true);
  assert(element.render(new Date('2026-08-24T12:34:00Z')) === '56s');
  element.remove();
});

test('dialog text is safe by default and lifecycle is explicit', async () => {
  const safe = createDialog('<strong>text</strong>');
  assert(safe.querySelector('strong') === null);
  assert(safe.textContent === '<strong>text</strong>');

  const unsafe = createDialogFromHTMLUnsafe('<strong>trusted</strong>');
  assert(unsafe.querySelector('strong').textContent === 'trusted');

  const button = createElement('button', { value: 'done' }, 'close');
  button.dataset.dialogClose = '';
  const dialog = createDialog(button);
  const close = new Promise(resolve => dialog.addEventListener('close', resolve, { once: true }));
  const dispose = bindDialog(dialog);
  showDialog(dialog, { modal: false });
  button.click();
  await close;
  assert(dialog.returnValue === 'done');
  dispose();
  dialog.remove();
});

test('movable and resizable initialize explicitly with Pointer Events', () => {
  const movable = createElement('div');
  movable.setAttribute('movable', '');
  movable.getBoundingClientRect = () => ({
    left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10,
  });
  movable.setPointerCapture = () => {};
  movable.releasePointerCapture = () => {};
  document.body.append(movable);
  const stopMoving = initMovable();
  movable.dispatchEvent(new PointerEvent('pointerdown', {
    bubbles: true, cancelable: true, clientX: 5, clientY: 5, pointerId: 1,
  }));
  document.dispatchEvent(new PointerEvent('pointermove', {
    bubbles: true, cancelable: true, clientX: 20, clientY: 25, pointerId: 1,
  }));
  assert(movable.style.left === '15px');
  assert(movable.style.top === '20px');
  stopMoving();
  movable.remove();

  const parent = createElement('div');
  parent.getBoundingClientRect = () => ({ width: 500, height: 500 });
  const resizable = createElement('div');
  resizable.setAttribute('resizable', '');
  resizable.getBoundingClientRect = () => ({
    left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100,
  });
  Object.defineProperties(resizable, {
    offsetWidth: { value: 100 },
    offsetHeight: { value: 100 },
  });
  resizable.setPointerCapture = () => {};
  resizable.releasePointerCapture = () => {};
  parent.append(resizable);
  document.body.append(parent);
  const stopResizing = initResizable();
  resizable.dispatchEvent(new PointerEvent('pointerdown', {
    bubbles: true, cancelable: true, clientX: 100, clientY: 100, pointerId: 2,
  }));
  document.dispatchEvent(new PointerEvent('pointermove', {
    bubbles: true, cancelable: true, clientX: 150, clientY: 160, pointerId: 2,
  }));
  assert(resizable.style.width === '150px');
  assert(resizable.style.height === '160px');
  stopResizing();
  parent.remove();
});

const results = document.querySelector('#results');
let failures = 0;
for (const { name, run } of tests) {
  const item = document.createElement('li');
  try {
    await run();
    item.textContent = `PASS: ${name}`;
  } catch (error) {
    failures += 1;
    item.textContent = `FAIL: ${name} — ${error.message}`;
    console.error(name, error);
  }
  results.append(item);
}

document.documentElement.dataset.status = failures ? 'failed' : 'passed';
document.documentElement.dataset.failures = String(failures);
