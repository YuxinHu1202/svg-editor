import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { CliApplication } from "../src/cli/CliApplication.js";

const temporaryDirectory = mkdtempSync(join(tmpdir(), "svg-editor-test-"));
after(() => rmSync(temporaryDirectory, { recursive: true, force: true }));

test("save produces valid SVG and blocks undo", () => {
  const outputPath = join(temporaryDirectory, "saved.svg");
  const cli = new CliApplication();
  cli.executeLine("init 400 200");
  cli.executeLine("create g flow");
  cli.executeLine("create rect start 30 70 120 60 #4a90d9 in flow");
  cli.executeLine('create text label 50 100 "A & B" in flow');
  assert.match(cli.executeLine(`save "${outputPath}"`) ?? "", /saved to/);
  const svg = readFileSync(outputPath, "utf8");
  assert.match(svg, /<svg[^>]+width="400"[^>]+height="200"/);
  assert.match(svg, /<g id="flow">/);
  assert.match(svg, />A &amp; B<\/text>/);
  assert.equal(cli.executeLine("undo"), "error: undo not allowed after io command");
});

test("read assigns missing ids, preserves nesting, and round-trips", () => {
  const inputPath = join(temporaryDirectory, "input.svg");
  const outputPath = join(temporaryDirectory, "round-trip.svg");
  writeFileSync(
    inputPath,
    `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect x="0" y="0" width="400" height="300" fill="#ffffff"/>
  <g id="g1">
    <circle id="c1" cx="50" cy="50" r="10"/>
    <text x="10" y="290">imported</text>
  </g>
</svg>`,
    "utf8",
  );

  const cli = new CliApplication();
  const result = cli.executeLine(`read "${inputPath}"`) ?? "";
  assert.match(result, /warning: assigned id rect1 to unnamed <rect>/);
  assert.match(result, /warning: assigned id text1 to unnamed <text>/);
  assert.match(cli.executeLine("tree") ?? "", /g#g1/);
  assert.match(cli.executeLine("tree") ?? "", /text#text1/);
  cli.executeLine(`save "${outputPath}"`);

  const second = new CliApplication();
  assert.match(second.executeLine(`read "${outputPath}"`) ?? "", /read .* \(4 elements\)/);
  assert.match(second.executeLine("tree") ?? "", /circle#c1/);
});

test("read rejects duplicate ids without replacing the current document", () => {
  const path = join(temporaryDirectory, "duplicate.svg");
  writeFileSync(
    path,
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect id="x" x="0" y="0" width="1" height="1"/><circle id="x" cx="1" cy="1" r="1"/></svg>',
    "utf8",
  );
  const cli = new CliApplication();
  cli.executeLine("init 20 30");
  assert.equal(cli.executeLine(`read "${path}"`), "error: id already exists: x");
  assert.equal(cli.executeLine("canvas"), "canvas 20x30");
});

test("generated ids never take an explicit id declared later in the file", () => {
  const path = join(temporaryDirectory, "reserved-id.svg");
  writeFileSync(
    path,
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect x="0" y="0" width="1" height="1"/><rect id="rect1" x="2" y="2" width="1" height="1"/></svg>',
    "utf8",
  );
  const cli = new CliApplication();
  assert.match(cli.executeLine(`read "${path}"`) ?? "", /assigned id rect2/);
  const tree = cli.executeLine("tree") ?? "";
  assert.match(tree, /rect#rect2/);
  assert.match(tree, /rect#rect1/);
});
