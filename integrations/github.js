export const GITHUB_API = 'https://api.github.com';

function repositoryPath(repository) {
  const [owner, name, ...rest] = repository.split('/');
  if (!owner || !name || rest.length) {
    throw new TypeError('repository must use the owner/name form');
  }
  return `${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

export class GitHubClient {
  constructor({ token, api = GITHUB_API, fetch: request = globalThis.fetch } = {}) {
    this.api = new URL(api);
    this.fetch = request;
    this.token = token;
  }

  async request(path, { method = 'GET', body, headers, signal } = {}) {
    const url = new URL(path, this.api);
    const requestHeaders = new Headers(headers);
    requestHeaders.set('Accept', 'application/vnd.github+json');
    requestHeaders.set('X-GitHub-Api-Version', '2022-11-28');
    if (this.token) requestHeaders.set('Authorization', `Bearer ${this.token}`);
    if (body !== undefined) requestHeaders.set('Content-Type', 'application/json');

    const response = await this.fetch(url, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
    if (!response.ok) {
      const error = new Error(`GitHub request failed: ${response.status}`);
      error.response = response;
      throw error;
    }
    return response.status === 204 ? null : response.json();
  }

  getRepositories(user, { signal, ...query } = {}) {
    const path = user ? `/users/${encodeURIComponent(user)}/repos` : '/user/repos';
    const url = new URL(path, this.api);
    url.search = new URLSearchParams(query);
    return this.request(url, { signal });
  }

  getCommits(repository, { signal } = {}) {
    return this.request(`/repos/${repositoryPath(repository)}/commits`, { signal });
  }

  getIssues(repository, { signal } = {}) {
    return this.request(`/repos/${repositoryPath(repository)}/issues`, { signal });
  }

  createIssue(repository, issue, { signal } = {}) {
    return this.request(`/repos/${repositoryPath(repository)}/issues`, {
      method: 'POST',
      body: issue,
      signal,
    });
  }

  async *repositories(user, { perPage = 100, signal } = {}) {
    for (let page = 1; ; page += 1) {
      const repositories = await this.getRepositories(user, {
        page,
        per_page: perPage,
        signal,
      });
      yield* repositories;
      if (repositories.length < perPage) return;
    }
  }
}
