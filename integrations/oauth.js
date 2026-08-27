const DEFAULT_TRANSACTION_TTL_MS = 10 * 60 * 1000;

export class OAuthError extends Error {
  constructor(message, { code = 'oauth_error', cause } = {}) {
    super(message, { cause });
    this.name = 'OAuthError';
    this.code = code;
  }
}

/** Browser Authorization Code + PKCE client with session-scoped token storage. */
export class OAuthClient {
  #fetch;
  #history;
  #location;
  #storage;
  #crypto;
  #now;

  constructor({
    issuer,
    clientId,
    redirectUri,
    scopes = ['openid'],
    resource,
    authorizationEndpoint,
    tokenEndpoint,
    storage = globalThis.sessionStorage,
    storageKey,
    fetch: fetchImplementation = defaultFetch,
    location = globalThis.location,
    history = globalThis.history,
    crypto: cryptoImplementation = globalThis.crypto,
    now = Date.now,
    transactionTtlMs = DEFAULT_TRANSACTION_TTL_MS,
  }) {
    this.issuer = normalizedIssuer(issuer);
    this.clientId = requiredString(clientId, 'clientId');
    this.redirectUri = validatedUrlString(redirectUri, 'redirectUri');
    this.scopes = normalizeScopes(scopes);
    this.resource = resource ? validatedUrlString(resource, 'resource') : null;
    this.authorizationEndpoint = authorizationEndpoint
      ? validatedUrlString(authorizationEndpoint, 'authorizationEndpoint')
      : new URL('oauth/authorize', this.issuer).toString();
    this.tokenEndpoint = tokenEndpoint
      ? validatedUrlString(tokenEndpoint, 'tokenEndpoint')
      : new URL('oauth/token', this.issuer).toString();
    this.storageKey = storageKey || `oauth:${this.issuer}:${this.clientId}:${this.resource || ''}`;
    this.transactionKey = `${this.storageKey}:transaction`;
    this.transactionTtlMs = positiveNumber(transactionTtlMs, 'transactionTtlMs');
    this.#storage = storage;
    this.#fetch = fetchImplementation;
    this.#location = location;
    this.#history = history;
    this.#crypto = cryptoImplementation;
    this.#now = now;
  }

  async authorize({ prompt, extra = {} } = {}) {
    const verifier = randomBase64Url(this.#crypto, 64);
    const challenge = base64Url(new Uint8Array(await this.#crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(verifier),
    )));
    const state = randomBase64Url(this.#crypto, 32);
    this.#storage.setItem(this.transactionKey, JSON.stringify({ verifier, state, createdAt: this.#now() }));
    const target = new URL(this.authorizationEndpoint);
    target.search = new URLSearchParams({
      ...stringRecord(extra),
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });
    if (this.resource) target.searchParams.set('resource', this.resource);
    if (prompt) target.searchParams.set('prompt', prompt);
    this.#location.assign(target.toString());
    return target.toString();
  }

  async completeAuthorization() {
    const callback = new URL(this.#location.href);
    const code = callback.searchParams.get('code');
    const oauthError = callback.searchParams.get('error');
    const errorDescription = callback.searchParams.get('error_description');
    const returnedState = callback.searchParams.get('state');
    if (!code && !oauthError) return null;
    const transaction = readJson(this.#storage.getItem(this.transactionKey));
    this.#storage.removeItem(this.transactionKey);
    this.#cleanCallbackUrl(callback);
    if (oauthError) {
      throw new OAuthError(errorDescription || oauthError, { code: oauthError });
    }
    if (
      !transaction ||
      typeof transaction.verifier !== 'string' ||
      transaction.state !== returnedState ||
      !Number.isFinite(transaction.createdAt) ||
      this.#now() - transaction.createdAt > this.transactionTtlMs
    ) {
      throw new OAuthError('The authorization response could not be verified.', { code: 'invalid_state' });
    }
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      code,
      code_verifier: transaction.verifier,
    });
    if (this.resource) body.set('resource', this.resource);
    const response = await this.#fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body,
    });
    const payload = await response.json().catch(error => {
      throw new OAuthError('The token endpoint returned invalid JSON.', { code: 'invalid_response', cause: error });
    });
    if (!response.ok) {
      throw new OAuthError(payload.error_description || payload.error || 'Token exchange failed.', {
        code: payload.error || 'token_exchange_failed',
      });
    }
    if (typeof payload.access_token !== 'string' || !payload.access_token || !Number.isFinite(payload.expires_in)) {
      throw new OAuthError('The token endpoint returned an invalid token response.', { code: 'invalid_response' });
    }
    const token = { ...payload, expires_at: this.#now() + payload.expires_in * 1000 };
    this.#storage.setItem(this.storageKey, JSON.stringify(token));
    return token;
  }

  getToken() {
    const token = readJson(this.#storage.getItem(this.storageKey));
    return token && typeof token.access_token === 'string' && Number.isFinite(token.expires_at) ? token : null;
  }

  getAccessToken({ minValiditySeconds = 15 } = {}) {
    const token = this.getToken();
    return token && token.expires_at > this.#now() + Math.max(0, minValiditySeconds) * 1000
      ? token.access_token
      : null;
  }

  clear() {
    this.#storage.removeItem(this.storageKey);
    this.#storage.removeItem(this.transactionKey);
  }

  #cleanCallbackUrl(callback) {
    for (const name of ['code', 'state', 'error', 'error_description', 'error_uri']) {
      callback.searchParams.delete(name);
    }
    this.#history?.replaceState?.(null, '', `${callback.pathname}${callback.search}${callback.hash}`);
  }
}

function defaultFetch(...args) {
  return globalThis.fetch(...args);
}

function normalizedIssuer(value) {
  const url = new URL(validatedUrlString(value, 'issuer'));
  url.pathname = `${url.pathname.replace(/\/+$/u, '')}/`;
  url.search = '';
  url.hash = '';
  return url.toString();
}

function validatedUrlString(value, name) {
  try {
    const input = requiredString(value, name).trim();
    const url = new URL(input);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Unsupported protocol');
    return input;
  } catch (error) {
    throw new TypeError(`${name} must be an absolute HTTP(S) URL.`, { cause: error });
  }
}

function requiredString(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} is required.`);
  return value;
}

function normalizeScopes(value) {
  const scopes = Array.isArray(value) ? value : String(value).split(/\s+/u);
  const normalized = [...new Set(scopes.map(scope => String(scope).trim()).filter(Boolean))];
  if (!normalized.length || normalized.some(scope => /\s/u.test(scope))) throw new TypeError('scopes must contain valid scope tokens.');
  return normalized;
}

function positiveNumber(value, name) {
  if (!Number.isFinite(value) || value <= 0) throw new TypeError(`${name} must be positive.`);
  return value;
}

function randomBase64Url(cryptoImplementation, size) {
  return base64Url(cryptoImplementation.getRandomValues(new Uint8Array(size)));
}

function base64Url(bytes) {
  let value = '';
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function readJson(value) {
  try { return value ? JSON.parse(value) : null; } catch { return null; }
}

function stringRecord(value) {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, String(item)]));
}
