import { createInterface } from "node:readline";
import { CliApplication } from "./cli/CliApplication.js";

const application = new CliApplication();
const terminal = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "svg> ",
});

console.log("svg-editor 0.1 — type 'help' for commands");
terminal.prompt();

terminal.on("line", (line) => {
  const output = application.executeLine(line);
  if (output) console.log(output);
  terminal.prompt();
});

terminal.on("close", () => {
  console.log();
});
