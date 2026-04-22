import { ready, addEventListener as on } from '../../dom.js';
import { readFileAsText } from '../../file.js';

ready(() => {
  on('#file', 'change', async e => {
    const element = e.target;
    const [file] = element.files;
    const content = await readFileAsText(file);
    console.log(content);
  });
});
