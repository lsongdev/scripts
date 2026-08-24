import { search } from '../../integrations/itunes.js';
import { getDailyImage } from '../../integrations/bing.js';
import { GitHubClient } from '../../integrations/github.js';

const github = new GitHubClient();
const output = document.querySelector('#output');
const show = value => {
  output.textContent = JSON.stringify(value, null, 2);
};

document.querySelector('#daily').addEventListener('click', async () => {
  show(await getDailyImage());
});
document.querySelector('#itunes').addEventListener('click', async () => {
  show(await search(document.querySelector('#term').value));
});
document.querySelector('#commits').addEventListener('click', async () => {
  show(await github.getCommits(document.querySelector('#repository').value));
});
