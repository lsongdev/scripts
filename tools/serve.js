import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number.parseInt(process.env.PORT || '4173', 10);
const host = process.env.HOST || '127.0.0.1';
const types = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
]);

function resolveRequestPath(requestURL) {
  const pathname = decodeURIComponent(new URL(requestURL, `http://${host}`).pathname);
  const candidate = resolve(root, `.${pathname}`);
  const outsideRoot = relative(root, candidate).split(sep).includes('..');
  if (outsideRoot) return null;
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    return resolve(candidate, 'index.html');
  }
  return candidate;
}

const server = createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }

  let path;
  try {
    path = resolveRequestPath(request.url);
  } catch {
    response.writeHead(400).end();
    return;
  }

  if (!path || !existsSync(path) || !statSync(path).isFile()) {
    response.writeHead(404).end();
    return;
  }

  response.writeHead(200, {
    'Content-Type': types.get(extname(path)) || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  if (request.method === 'HEAD') response.end();
  else createReadStream(path).pipe(response);
});

const websocketServer = new WebSocketServer({ noServer: true });
websocketServer.on('connection', socket => {
  socket.on('message', (data, isBinary) => {
    socket.send(data, { binary: isBinary });
  });
});

server.on('upgrade', (request, socket, head) => {
  let pathname;
  try {
    pathname = new URL(request.url, `http://${host}`).pathname;
  } catch {
    socket.destroy();
    return;
  }

  if (pathname !== '/__test__/websocket') {
    socket.destroy();
    return;
  }

  websocketServer.handleUpgrade(request, socket, head, client => {
    websocketServer.emit('connection', client, request);
  });
});

server.listen(port, host, () => {
  console.log(`Serving ${root} at http://${host}:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    for (const client of websocketServer.clients) client.terminate();
    websocketServer.close();
    server.close(() => process.exit(0));
  });
}
