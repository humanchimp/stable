export function optional(value, defaultValue) {
  const [v = defaultValue] = [[].concat(value).pop()];
  return v;
}
