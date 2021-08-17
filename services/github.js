
export const GITHUB_API = 'https://api.github.com';

export const request = (path, options) => {
  return Promise
    .resolve()
    .then(() => fetch(GITHUB_API + path, options))
    .then(async res => {
      const data = await res.json()
      if (res.status === 200) 
        return data;
      throw new Error(data.message)
    })
};

export const repos = user => {
  return request(`/users/${user}/repos`);
};

export const commits = (user, repo) => {
  return request(`/repos/${user}/${repo}/commits`);
};
