import { cli } from "./cli";

main().catch(console.error);

async function main() {
  try {
    await cli.selectFromArgv(process.argv);
  } catch (e) {
    console.error(e);
    process.exit(e.code || 1); // 👋
  }
}
