export function bundlerAliasForRunner(runner: string) {
  switch (runner) {
    case "remote":
    case "headless chrome":
      return "remote";
  }
}
