export const Locale: {
  [key: string]: string;
} = {};

export const t = (key: string, ...args: (string | number)[]) => {
  let str = Locale[key] ?? key;
  for (const arg of args) str = str.replace('%s', String(arg));
  return str;
};
