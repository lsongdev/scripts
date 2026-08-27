import assert from 'node:assert/strict';
import test from 'node:test';
import { webcrypto } from 'node:crypto';
import { OAuthClient } from '../integrations/oauth.js';

function storage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
}

test('OAuthClient performs PKCE redirect, callback exchange, and session token lookup', async () => {
  const session = storage();
  const location = { href: 'https://app.example/callback', assigned: null, assign(value) { this.assigned = value; } };
  let cleaned;
  const client = new OAuthClient({
    issuer: 'https://identity.example', clientId: 'client-web', redirectUri: 'https://app.example/callback',
    resource: 'https://files.example', scopes: ['openid', 'files:read'], storage: session,
    location, history: { replaceState: (_state, _unused, value) => { cleaned = value; } },
    crypto: webcrypto, now: () => 1_000,
    fetch: async (_url, init) => {
      const body = init.body;
      assert.equal(body.get('grant_type'), 'authorization_code');
      assert.equal(body.get('resource'), 'https://files.example');
      assert.equal(body.get('code_verifier').length >= 43, true);
      return Response.json({ access_token: 'access-token', token_type: 'Bearer', expires_in: 600 });
    },
  });
  await client.authorize();
  const authorize = new URL(location.assigned);
  assert.equal(authorize.pathname, '/oauth/authorize');
  assert.equal(authorize.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(authorize.searchParams.get('resource'), 'https://files.example');
  location.href = `https://app.example/callback?code=code-1&state=${authorize.searchParams.get('state')}`;
  const token = await client.completeAuthorization();
  assert.equal(token.access_token, 'access-token');
  assert.equal(client.getAccessToken(), 'access-token');
  assert.equal(cleaned, '/callback');
  client.clear();
  assert.equal(client.getAccessToken(), null);
});

test('OAuthClient rejects callback state mismatches before token exchange', async () => {
  const session = storage();
  const location = { href: 'https://app.example/callback', assign() {} };
  let fetched = false;
  const client = new OAuthClient({
    issuer: 'https://identity.example', clientId: 'client-web', redirectUri: 'https://app.example/callback',
    storage: session, location, history: { replaceState() {} }, crypto: webcrypto,
    fetch: async () => { fetched = true; return Response.json({}); },
  });
  await client.authorize();
  location.href = 'https://app.example/callback?code=code-1&state=wrong';
  await assert.rejects(client.completeAuthorization(), error => error.code === 'invalid_state');
  assert.equal(fetched, false);
});
