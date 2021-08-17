
export const isChinese = content =>
  /^[\u4e00-\u9fa5]+$/.test(content);

export const isEmail = content =>
  /^[\w-_]+@[\w-_]+(?:\.\w+)+$/.test(content);