export const KEBAB_REGEX = /[A-Z\u00C0-\u00D6\u00D8-\u00DE]/;

export const kebab = (str: string): string =>
  [...str].reduce((memo, c: string, i) => {
    const low = c.toLowerCase();

    return `${memo}${KEBAB_REGEX.test(c) ? (i > 0 ? `-${low}` : low) : c}`;
  }, "");
