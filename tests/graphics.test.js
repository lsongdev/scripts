import assert from 'node:assert/strict';
import test from 'node:test';
import { Color, color, parseHex, toHex, toHSL, toRGB } from '../graphics/color.js';

test('Color validates channels and round-trips hexadecimal forms', () => {
  assert.equal(toHex(new Color(255, 128, 0)), '#ff8000');
  assert.equal(toHex(parseHex('#0f08')), '#00ff0088');
  assert.deepEqual(color({ r: 1, g: 2, b: 3 }), new Color(1, 2, 3));
  assert.throws(() => new Color(256, 0, 0), RangeError);
  assert.throws(() => parseHex('red'), SyntaxError);
});

test('Color conversions use CSS sRGB/HSL semantics', () => {
  assert.equal(toRGB(new Color(255, 0, 0)), 'rgb(255 0 0)');
  assert.deepEqual(toHSL(new Color(255, 0, 0)), {
    alpha: 1,
    hue: 0,
    lightness: 0.5,
    saturation: 1,
  });
});
