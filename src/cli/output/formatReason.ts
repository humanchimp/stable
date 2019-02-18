export function formatReason(reason) {
  return reason && reason.stack
    ? `

${reason.stack
  .split("\n")
  .map(line => `    ${line}`)
  .join("\n")}
`
    : "";
}
