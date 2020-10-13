import { ready, addEventListener } from '../../dom.js';
import { connect } from '../../serialport.js';

ready(async () => {
  addEventListener('#connect', 'click', async () => {
    const port = await connect();
    console.log(port);
  });

});
