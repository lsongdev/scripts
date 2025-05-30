import { stringify } from '../query.js';

export const GITHUB_API = 'https://api.github.com';

export class GitHubClient {
  constructor({ token, api = GITHUB_API } = {}) {
    this.api = api;
    this.token = token;
  }
  async request(endpoint, method, data) {
    const url = `${this.api}${endpoint}`;
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : null,
    });
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    return response.json();
  };

  async getRepos(user, options) {
    const endpoint = user ? `/users/${user}/repos` : '/user/repos';
    return this.request(endpoint + '?' + stringify(options));
  }
  async getCommits(repo) {
    const [owner, repoName] = repo.split('/');
    const endpoint = `/repos/${owner}/${repoName}/commits`;
    return this.request(endpoint);
  }
  async getIssues(repo) {
    const [owner, repoName] = repo.split('/');
    const endpoint = `/repos/${owner}/${repoName}/issues`;
    return this.request(endpoint);
  }
  async createIssue(repo, issue) {
    const [owner, repoName] = repo.split('/');
    const endpoint = `/repos/${owner}/${repoName}/issues`;
    return this.request(endpoint, 'POST', issue);
  }
}

export const gh = new GitHubClient();
export const repos = async (user) => gh.getRepos(user);
export const issues = async (repo) => gh.getIssues(repo);
export const commits = async (repo) => gh.getCommits(repo);
