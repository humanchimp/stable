export function bundlerAliasForRunner(runner: string) {
  switch (runner) {
    case "remote":
    case "chrome":
      return "remote";
  }
}
