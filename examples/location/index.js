import { delegate, ready } from '../../dom/events.js';
import { $ } from '../../dom/query.js';
import { getCurrentPosition } from '../../devices/geolocation.js';

// https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API

ready(() => {

  const mapLink = $('#map-link');

  delegate(document, 'click', '#find-me', async () => {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    mapLink.textContent = `Latitude: ${latitude} °, Longitude: ${longitude} °`;
    mapLink.href = `https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`;
  });

});
