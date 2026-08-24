import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseYAML,
  parseYAMLDocument,
  parseYAMLDocuments,
  stringifyYAML,
} from '../adapters/yaml.js';

test('YAML adapter parses mappings, sequences, and document streams', () => {
  assert.deepEqual(parseYAML('name: web\ntags: [one, two]\n'), {
    name: 'web',
    tags: ['one', 'two'],
  });
  assert.equal(parseYAMLDocument('enabled: true').get('enabled'), true);
  assert.equal(parseYAMLDocuments('---\none\n---\ntwo\n').length, 2);
});

test('YAML adapter serializes through the pinned implementation', () => {
  assert.equal(stringifyYAML({ enabled: true }), 'enabled: true\n');
});
