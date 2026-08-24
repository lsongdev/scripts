import { on, ready } from '../../dom/events.js';
import { $ } from '../../dom/query.js';
import { readText } from '../../files/read.js';

ready(() => {
  on($('#file'), 'change', async e => {
    const element = e.target;
    const [file] = element.files;
    const content = await readText(file);
    console.log(content);
  });
});
