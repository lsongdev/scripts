
export const today = async (options = {}) => {
  const bing = 'https://www.bing.com';
  const defaultAPI = `${bing}/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US;`;
  const { api = defaultAPI } = options;
  const response = await fetch(api);
  const { images } = await response.json();
  return images.map(img => {
    const { url, quiz } = img;
    return {
      ...img,
      quiz: bing + quiz,
      url: bing + url,
    };
  })[0];
};
