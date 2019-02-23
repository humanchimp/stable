export function serializeReason(reason) {
  const seen = new Set();
  const json = Object.create(null);

  for (const prop of ["name", "message", "stack", "code"]) {
    const candidate = reason[prop];

    if (candidate != null) {
      if (typeof candidate !== "object") {
        json[prop] = candidate;
      } else if (!seen.has(candidate)) {
        json[prop] = candidate;
        seen.add(candidate);
      } else {
        json[prop] = "[Circular]"; // Just scrub cycles for now
      }
    }
  }
  return json;
}
