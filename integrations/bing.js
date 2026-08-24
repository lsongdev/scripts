const BING = 'https://www.bing.com';

/** Fetch Bing's daily image metadata. */
export async function getDailyImage({
  market = 'en-US',
  index = 0,
  signal,
  fetch: request = globalThis.fetch,
} = {}) {
  const url = new URL('/HPImageArchive.aspx', BING);
  url.search = new URLSearchParams({
    format: 'js',
    idx: index,
    n: 1,
    mkt: market,
  });
  const response = await request(url, { signal });
  if (!response.ok) throw new Error(`Bing request failed: ${response.status}`);
  const { images } = await response.json();
  const image = images?.[0];
  if (!image) return null;
  return {
    ...image,
    quiz: image.quiz ? new URL(image.quiz, BING) : null,
    url: new URL(image.url, BING),
  };
}
