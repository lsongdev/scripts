import { createElement } from './dom.js';
import { resetCursor } from './hook.js';
import { schedule, shouldYield } from './schedule.js';
import { isArr, createText } from './h.js';
import { commit } from './commit.js';

let currentFiber = null;
let effectList = null;
let deletions = [];

export const render = (vnode, node) => {
  const rootFiber = {
    node,
    props: { children: vnode },
  };
  update(rootFiber);
};

export const update = fiber => {
  if (fiber && !(fiber.lane & 32)) {
    fiber.lane = 2 | 32;
    schedule(() => {
      effectList = fiber;
      return reconcile(fiber);
    });
  }
};

const reconcile = fiber => {
  while (fiber && !shouldYield())
    fiber = capture(fiber);
  if (fiber)
    return reconcile.bind(null, fiber);
  return null;
};

const memo = fiber => {
  if (fiber.type.memo && fiber.oldProps) {
    let scu = fiber.type.shouldUpdate || shouldUpdate;
    if (!scu(fiber.props, fiber.oldProps)) {
      return getSibling(fiber);
    }
  }
  return null;
};

const capture = fiber => {
  fiber.isComp = isFn(fiber.type);
  if (fiber.isComp) {
    const memoFiber = memo(fiber);
    if (memoFiber) {
      return memoFiber;
    }
    updateHook(fiber);
  } else {
    updateHost(fiber);
  }
  if (fiber.child)
    return fiber.child;
  const sibling = getSibling(fiber);
  return sibling;
};

const getSibling = fiber => {
  while (fiber) {
    bubble(fiber);
    if (fiber.lane & 32) {
      fiber.lane &= ~32;
      commit(fiber, deletions);
      return null;
    }
    if (fiber.sibling)
      return fiber.sibling;
    fiber = fiber.parent;
  }
  return null;
};

const bubble = fiber => {
  if (fiber.isComp) {
    if (fiber.hooks) {
      side(fiber.hooks.layout);
      schedule(() => side(fiber.hooks.effect));
    }
  }
};

const append = function (fiber) {
  effectList.next = fiber;
  effectList = fiber;
};

const shouldUpdate = (a, b) => {
  for (let i in a)
    if (!(i in b))
      return true;
  for (let i in b)
    if (a[i] !== b[i])
      return true;
};

const updateHook = (fiber) => {
  resetCursor();
  currentFiber = fiber;
  let children = fiber.type(fiber.props);
  diffKids(fiber, simpleVnode(children));
};

const updateHost = (fiber) => {
  fiber.parentNode = getParentNode(fiber) || {};
  if (!fiber.node) {
    if (fiber.type === 'svg')
      fiber.lane |= 16;
    fiber.node = createElement(fiber);
  }
  fiber.childNodes = Array.from(fiber.node.childNodes || []);
  diffKids(fiber, fiber.props.children);
};


const getParentNode = (fiber) => {
  while ((fiber = fiber.parent)) {
    if (!fiber.isComp)
      return fiber.node;
  }
};

const diffKids = (fiber, children) => {
  var _a;
  let isMount = !fiber.kids, aCh = fiber.kids || [], bCh = (fiber.kids = arrayfy(children)), aHead = 0, bHead = 0, aTail = aCh.length - 1, bTail = bCh.length - 1;
  while (aHead <= aTail && bHead <= bTail) {
    if (!same(aCh[aHead], bCh[bHead]))
      break;
    clone(aCh[aHead++], bCh[bHead++], 2);
  }
  while (aHead <= aTail && bHead <= bTail) {
    if (!same(aCh[aTail], bCh[bTail]))
      break;
    clone(aCh[aTail--], bCh[bTail--], 2);
  }
  const { diff, keymap } = LCSdiff(bCh, aCh, bHead, bTail, aHead, aTail);
  for (let i = 0, aIndex = aHead, bIndex = bHead, mIndex; i < diff.length; i++) {
    const op = diff[i];
    const after = (_a = fiber.node) === null || _a === void 0 ? void 0 : _a.childNodes[aIndex];
    if (op === 2) {
      if (!same(aCh[aIndex], bCh[bIndex])) {
        bCh[bIndex].lane = 4;
        bCh[bIndex].after = after;
        aCh[aIndex].lane = 8;
        deletions.push(aCh[aIndex]);
        append(bCh[bIndex]);
      } else {
        clone(aCh[aIndex], bCh[bIndex], 2);
      }
      aIndex++;
      bIndex++;
    } else if (op === 4) {
      let c = bCh[bIndex];
      mIndex = c.key != null ? keymap[c.key] : null;
      if (mIndex != null) {
        c.after = after;
        clone(aCh[mIndex], c, 4);
        aCh[mIndex] = undefined;
      } else {
        c.after = isMount ? null : after;
        c.lane = 4;
        append(c);
      }
      bIndex++;
    } else if (op === 8) {
      aIndex++;
    }
  }
  for (let i = 0, aIndex = aHead; i < diff.length; i++) {
    let op = diff[i];
    if (op === 2) {
      aIndex++;
    } else if (op === 8) {
      let c = aCh[aIndex];
      if (c !== undefined) {
        c.lane = 8;
        deletions.push(c);
      }
      aIndex++;
    }
  }
  for (let i = 0, prev = null, len = bCh.length; i < len; i++) {
    const child = bCh[i];
    if (fiber.lane & 16) {
      child.lane |= 16;
    }
    child.parent = fiber;
    if (i > 0) {
      prev.sibling = child;
    } else {
      fiber.child = child;
    }
    prev = child;
  }
};

function clone(a, b, lane) {
  b.hooks = a.hooks;
  b.ref = a.ref;
  b.node = a.node;
  b.oldProps = a.props;
  b.lane = lane;
  b.kids = a.kids;
  append(b);
}


const side = (effects) => {
  effects.forEach(e => e[2] && e[2]());
  effects.forEach(e => (e[2] = e[0]()));
  effects.length = 0;
};

function LCSdiff(bArr, aArr, bHead = 0, bTail = bArr.length - 1, aHead = 0, aTail = aArr.length - 1) {
  let keymap = {}, unkeyed = [], idxUnkeyed = 0, ch, item, k, idxInOld, key;
  let newLen = bArr.length;
  let oldLen = aArr.length;
  let minLen = Math.min(newLen, oldLen);
  let tresh = Array(minLen + 1);
  tresh[0] = -1;
  for (var i = 1; i < tresh.length; i++) {
    tresh[i] = aTail + 1;
  }
  let link = Array(minLen);
  for (i = aHead; i <= aTail; i++) {
    item = aArr[i];
    key = item.key;
    if (key != null) {
      keymap[key] = i;
    } else {
      unkeyed.push(i);
    }
  }
  for (i = bHead; i <= bTail; i++) {
    ch = bArr[i];
    idxInOld = ch.key == null ? unkeyed[idxUnkeyed++] : keymap[ch.key];
    if (idxInOld != null) {
      k = bs(tresh, idxInOld);
      if (k >= 0) {
        tresh[k] = idxInOld;
        link[k] = { newi: i, oldi: idxInOld, prev: link[k - 1] };
      }
    }
  }
  k = tresh.length - 1;
  while (tresh[k] > aTail)
    k--;
  let ptr = link[k];
  let diff = Array(oldLen + newLen - k);
  let curNewi = bTail, curOldi = aTail;
  let d = diff.length - 1;
  while (ptr) {
    const { newi, oldi } = ptr;
    while (curNewi > newi) {
      diff[d--] = 4;
      curNewi--;
    }
    while (curOldi > oldi) {
      diff[d--] = 8;
      curOldi--;
    }
    diff[d--] = 2;
    curNewi--;
    curOldi--;
    ptr = ptr.prev;
  }
  while (curNewi >= bHead) {
    diff[d--] = 4;
    curNewi--;
  }
  while (curOldi >= aHead) {
    diff[d--] = 8;
    curOldi--;
  }
  return {
    diff,
    keymap,
  };
}

function bs(ktr, j) {
  let lo = 1;
  let hi = ktr.length - 1;
  while (lo <= hi) {
    let mid = (lo + hi) >>> 1;
    if (j < ktr[mid])
      hi = mid - 1;
    else
      lo = mid + 1;
  }
  return lo;
}

export const isFn = x => typeof x === 'function';
export const isStr = s => typeof s === 'number' || typeof s === 'string';
export const getCurrentFiber = () => currentFiber || null;
export const simpleVnode = (type) => isStr(type) ? createText(type) : type;
export const same = (a, b) => a && b && a.key === b.key && a.type === b.type;
export const arrayfy = arr => (!arr ? [] : isArr(arr) ? arr : [arr]);
