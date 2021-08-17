import { updateElement } from './dom.js';
import { isFn } from './reconcile.js';

export const commit = (fiber, deletions) => {
  let current = fiber.next;
  fiber.next = null;
  do {
    op(current);
  } while ((current = current.next));
  deletions.forEach(op);
};

const op = fiber => {
  if (fiber.lane & 64) return;
  if (fiber.lane === 8) {
    remove(fiber);
    return;
  }
  if (fiber.lane & 4) {
    if (fiber.isComp) {
      fiber.child.lane = fiber.lane;
      fiber.child.after = fiber.after;
      op(fiber.child);
      fiber.child.lane |= 64;
    } else {
      fiber.parentNode.insertBefore(fiber.node, fiber.after);
    }
  }
  if (fiber.lane & 2) {
    if (fiber.isComp) {
      fiber.child.lane = fiber.lane;
      op(fiber.child);
      fiber.child.lane |= 64;
    } else {
      updateElement(fiber.node, fiber.oldProps || {}, fiber.props);
    }
  }
  refer(fiber.ref, fiber.node);
};

const refer = (ref, dom) => {
  if (ref) isFn(ref) ? ref(dom) : (ref.current = dom);
};

const kidsRefer = (kids) => {
  kids.forEach(kid => {
    kid.kids && kidsRefer(kid.kids);
    refer(kid.ref, null);
  });
};

const remove = fiber => {
  if (fiber.isComp) {
    fiber.hooks && fiber.hooks.list.forEach(e => e[2] && e[2]());
    fiber.kids.forEach(remove);
  } else {
    kidsRefer(fiber.kids);
    fiber.parentNode.removeChild(fiber.node);
    refer(fiber.ref, null);
  }
  fiber.lane = 0;
};
