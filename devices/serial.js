function getSerial(target) {
  const serial = target?.serial;
  if (!serial) throw new ReferenceError('Web Serial is required');
  return serial;
}

/** Request a SerialPort using the standard request options. */
export function requestPort(options, {
  navigator: target = globalThis.navigator,
} = {}) {
  return getSerial(target).requestPort(options);
}

/** Request and open a SerialPort, returning the standard SerialPort object. */
export async function openPort({
  request,
  open = { baudRate: 9600 },
  navigator: target = globalThis.navigator,
} = {}) {
  const port = await requestPort(request, { navigator: target });
  await port.open(open);
  return port;
}
