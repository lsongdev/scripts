import assert from 'node:assert/strict';
import test from 'node:test';

import { getDailyImage } from '../integrations/bing.js';
import { GitHubClient } from '../integrations/github.js';
import { search } from '../integrations/itunes.js';

const jsonResponse = (value, options = {}) => new Response(
  JSON.stringify(value),
  { status: 200, headers: { 'content-type': 'application/json' }, ...options },
);

test('Bing integration builds a standard URL and resolves image URLs', async () => {
  let requested;
  const image = await getDailyImage({
    market: 'zh-CN',
    fetch: async url => {
      requested = url;
      return jsonResponse({ images: [{ url: '/image.jpg', quiz: '/quiz' }] });
    },
  });
  assert.equal(requested.searchParams.get('mkt'), 'zh-CN');
  assert.equal(image.url.href, 'https://www.bing.com/image.jpg');
  assert.equal(image.quiz.href, 'https://www.bing.com/quiz');
});

test('iTunes integration encodes search parameters', async () => {
  let requested;
  await search('坏蛋 调频', {
    entity: 'podcast',
    limit: 5,
    fetch: async url => (requested = url, jsonResponse({ resultCount: 0 })),
  });
  assert.equal(requested.searchParams.get('term'), '坏蛋 调频');
  assert.equal(requested.searchParams.get('limit'), '5');
});

test('GitHub client builds authenticated requests and returns JSON', async () => {
  let request;
  const client = new GitHubClient({
    token: 'secret',
    fetch: async (url, options) => {
      request = { url, options };
      return jsonResponse([{ sha: 'abc' }]);
    },
  });
  assert.deepEqual(await client.getCommits('owner/repo'), [{ sha: 'abc' }]);
  assert.equal(request.url.pathname, '/repos/owner/repo/commits');
  assert.equal(request.options.headers.get('authorization'), 'Bearer secret');
});

test('GitHub client validates repository names and exposes failed responses', async () => {
  const client = new GitHubClient({
    fetch: async () => new Response('', { status: 404 }),
  });
  assert.throws(() => client.getIssues('invalid'), TypeError);
  await assert.rejects(client.getIssues('owner/repo'), error => {
    assert.equal(error.response.status, 404);
    return true;
  });
});
