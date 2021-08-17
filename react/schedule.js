const queue = [];
const threshold = 5;
const transitions = [];

let deadline = 0;

export const startTransition = cb =>
  transitions.push(cb) && translate();

export const schedule = callback => {
  queue.push({ callback });
  startTransition(flush);
};

const task = pending => {
  const cb = () => transitions.splice(0, 1).forEach(c => c());
  if (!pending && typeof queueMicrotask !== 'undefined') {
    return () => queueMicrotask(cb);
  }
  if (typeof MessageChannel !== 'undefined') {
    const { port1, port2 } = new MessageChannel();
    port1.onmessage = cb;
    return () => port2.postMessage(null);
  }
  return () => setTimeout(cb);
};

let translate = task(false);
const peek = queue => queue[0];

const flush = () => {
  deadline = getTime() + threshold;
  let job = peek(queue);
  while (job && !shouldYield()) {
    const { callback } = job;
    job.callback = null;
    const next = callback();
    if (next) {
      job.callback = next;
    } else {
      queue.shift();
    }
    job = peek(queue);
  }
  job && (translate = task(shouldYield())) && startTransition(flush);
};

export const getTime = () => performance.now();
export const shouldYield = () => getTime() >= deadline;
