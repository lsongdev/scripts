
export const any = () => { };
export const some = () => { };
export const race = () => { };

export const allSettled = promises =>
  Promise.all(promises.map(p => p
    .then(value => ({ state: 'fulfilled', value }))
    .catch(reason => ({ state: 'rejected', reason }))
  ));

export const call = p =>
  p.then(r => [null, r], e => [e]);

export const sleep = ms =>
  new Promise(done => setTimeout(done, ms));

export const timeout = (p, t, errorMessage) =>
  Promise.race([
    p,
    sleep(t).then(() => {
      throw new Error(errorMessage)
    })
  ]);

export const serialize = arr =>
  arr.reduce((m, p) =>
    m.then(v => Promise.all([...v, p()]))
    , Promise.resolve([]));
