import { ready, addEventListener } from '../../dom.js';
import { } from '../../bluetooth.js';

let device = null;
let myCharacteristic;

ready(() => {
  const btnRead = document.getElementById('read');
  const btnSend = document.getElementById('send');
  const btnConnect = document.getElementById('connect');
  const btnDisconnect = document.getElementById('disconnect');
  const txtMessage = document.getElementById('message');
  const btnStartNotifications = document.getElementById('startNotifications');
  const btnStopNotifications = document.getElementById('stopNotifications');
  const txtServiceUuid = document.getElementById('service');
  const txtCharacteristicUuid = document.getElementById('characteristic');

  btnConnect.addEventListener('click', async () => {
    const serviceUuid = txtServiceUuid.value;
    const characteristicUuid = txtCharacteristicUuid.value;

    console.log('Requesting Bluetooth Device...');
    device = await navigator.bluetooth.requestDevice({
      filters: [
        { services: [serviceUuid] },
        { name: ["m5-stack"] },
      ],
    });

    console.log('Connecting to GATT Server...');
    const server = await device.gatt.connect();

    btnSend.disabled = false;
    btnRead.disabled = false;
    btnConnect.disabled = true;
    btnDisconnect.disabled = false;
    btnStartNotifications.disabled = false;
    btnStopNotifications.disabled = false;

    console.log('Getting Service...');
    const service = await server.getPrimaryService(serviceUuid);

    console.log('Getting Characteristics...');
    const characteristics = await service.getCharacteristics(characteristicUuid);
    console.log('characteristics', characteristics);
    if (characteristics.length > 0) {
      [myCharacteristic] = characteristics;
      myCharacteristic.addEventListener('characteristicvaluechanged', event => {
        const value = event.target.value;
        const decoder = new TextDecoder('utf-8');
        console.log(decoder.decode(value));
      });
    }
  });

  btnDisconnect.addEventListener('click', () => {
    if (device.gatt.connected) {
      device.gatt.disconnect();
      console.log('disconnect');
      btnRead.disabled = true;
      btnSend.disabled = true;
      btnConnect.disabled = false;
      btnDisconnect.disabled = true;
      btnStartNotifications.disabled = true;
      btnStopNotifications.disabled = true;
    }
  });

  btnRead.addEventListener('click', async () => {
    console.log('Reading Characteristics...');
    const value = await myCharacteristic.readValue();
    const decoder = new TextDecoder('utf-8');
    console.log(decoder.decode(value));
  });

  btnSend.addEventListener('click', async () => {
    const encoder = new TextEncoder('utf-8');
    const text = txtMessage.value;
    await myCharacteristic.writeValue(encoder.encode(text));
  });

  btnStartNotifications.addEventListener('click', async () => {
    await myCharacteristic.startNotifications();
  });

  btnStopNotifications.addEventListener('click', async () => {
    await myCharacteristic.stopNotifications();
  });


});
