import { search } from '../../services/itunes.js';
import { today } from '../../services/bing.js';
import { commits } from '../../services/github.js';

// const results = await search("坏蛋调频");
// console.log(results);

const img = await today({ api: 'https://api.lsong.one:8443/bing' });
console.log(img);

const a = await commits("song940", "home");
console.log(a);
