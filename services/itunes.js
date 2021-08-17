
export const search = async (name, entity = 'podcast') => {
  const url = `https://itunes.apple.com/search?entity=${entity}&term=${name}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
};
