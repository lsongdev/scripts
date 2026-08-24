/** Search the iTunes Search API. */
export async function search(term, {
  entity = 'podcast',
  limit,
  signal,
  fetch: request = globalThis.fetch,
} = {}) {
  const url = new URL('https://itunes.apple.com/search');
  url.search = new URLSearchParams({
    term,
    entity,
    ...(limit === undefined ? {} : { limit }),
  });
  const response = await request(url, { signal });
  if (!response.ok) throw new Error(`iTunes request failed: ${response.status}`);
  return response.json();
}
