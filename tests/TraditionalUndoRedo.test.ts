import assert from "node:assert/strict";
import { test } from "node:test";
import { CliApplication } from "../src/cli/CliApplication.js";

test("create and delete undo/redo restore the same shape at the same position", () => {
  const cli = new CliApplication();
  cli.executeLine("init");
  cli.executeLine("create rect a 0 0 10 10");
  cli.executeLine("create rect b 20 0 10 10");

  cli.executeLine("undo");
  assert.equal(cli.executeLine("show b"), "error: no such shape: b");
  cli.executeLine("redo");
  assert.match(cli.executeLine("show b") ?? "", /rect#b/);

  cli.executeLine("delete a");
  assert.equal(cli.executeLine("show a"), "error: no such shape: a");
  cli.executeLine("undo");
  const restored = cli.executeLine("tree") ?? "";
  assert.ok(restored.indexOf("rect#a") < restored.indexOf("rect#b"));
  cli.executeLine("redo");
  assert.equal(cli.executeLine("show a"), "error: no such shape: a");
});

test("set stores the previous value including an absent style", () => {
  const cli = new CliApplication();
  cli.executeLine("init");
  cli.executeLine("create circle c1 10 10 5");
  cli.executeLine("set c1 fill red");
  assert.match(cli.executeLine("show c1") ?? "", /fill=red/);
  cli.executeLine("undo");
  assert.doesNotMatch(cli.executeLine("show c1") ?? "", /fill=/);
  cli.executeLine("redo");
  assert.match(cli.executeLine("show c1") ?? "", /fill=red/);

  cli.executeLine("set c1 r 8");
  cli.executeLine("undo");
  assert.match(cli.executeLine("show c1") ?? "", /r=5/);
  cli.executeLine("redo");
  assert.match(cli.executeLine("show c1") ?? "", /r=8/);
});

test("move and scale use inverse operations without document snapshots", () => {
  const cli = new CliApplication();
  cli.executeLine("init");
  cli.executeLine("create rect r1 10 20 30 40");
  cli.executeLine("move r1 7 -3");
  cli.executeLine("scale r1 2");
  assert.match(cli.executeLine("tree") ?? "", /x=34 y=34 w=60 h=80/);
  cli.executeLine("undo");
  assert.match(cli.executeLine("tree") ?? "", /x=17 y=17 w=30 h=40/);
  cli.executeLine("undo");
  assert.match(cli.executeLine("tree") ?? "", /x=10 y=20 w=30 h=40/);
  cli.executeLine("redo");
  cli.executeLine("redo");
  assert.match(cli.executeLine("tree") ?? "", /x=34 y=34 w=60 h=80/);
});

test("group undo restores every original parent and sibling index", () => {
  const cli = new CliApplication();
  cli.executeLine("init");
  cli.executeLine("create g left");
  cli.executeLine("create g right");
  cli.executeLine("create rect a 0 0 1 1 in left");
  cli.executeLine("create rect b 0 0 1 1 in left");
  cli.executeLine("create circle c 0 0 1 in right");
  cli.executeLine("group mixed a c");
  assert.match(cli.executeLine("tree") ?? "", /g#mixed/);

  cli.executeLine("undo");
  const restored = cli.executeLine("tree") ?? "";
  assert.match(restored, /g#left[\s\S]*rect#a[\s\S]*rect#b/);
  assert.match(restored, /g#right[\s\S]*circle#c/);
  assert.doesNotMatch(restored, /g#mixed/);

  cli.executeLine("redo");
  const regrouped = cli.executeLine("tree") ?? "";
  assert.match(regrouped, /g#mixed[\s\S]*rect#a[\s\S]*circle#c/);
});

test("ungroup undo rebuilds the original group and redo promotes its children", () => {
  const cli = new CliApplication();
  cli.executeLine("init");
  cli.executeLine("create g scene");
  cli.executeLine("create g pair in scene");
  cli.executeLine("create rect a 0 0 1 1 in pair");
  cli.executeLine("create circle b 2 2 1 in pair");
  cli.executeLine("ungroup pair");
  assert.doesNotMatch(cli.executeLine("tree") ?? "", /g#pair/);

  cli.executeLine("undo");
  assert.match(cli.executeLine("tree") ?? "", /g#pair[\s\S]*rect#a[\s\S]*circle#b/);
  cli.executeLine("redo");
  const promoted = cli.executeLine("tree") ?? "";
  assert.doesNotMatch(promoted, /g#pair/);
  assert.match(promoted, /g#scene[\s\S]*rect#a[\s\S]*circle#b/);
});

test("addto, front, and back restore exact placements", () => {
  const cli = new CliApplication();
  cli.executeLine("init");
  cli.executeLine("create g scene");
  cli.executeLine("create rect a 0 0 1 1");
  cli.executeLine("create rect b 0 0 1 1");
  cli.executeLine("addto scene a");
  cli.executeLine("undo");
  assert.match(cli.executeLine("show a") ?? "", /parent=svg/);
  cli.executeLine("redo");
  assert.match(cli.executeLine("show a") ?? "", /parent=g#scene/);

  cli.executeLine("create circle c 0 0 1");
  cli.executeLine("back c");
  cli.executeLine("undo");
  let tree = cli.executeLine("tree") ?? "";
  assert.ok(tree.indexOf("rect#b") < tree.indexOf("circle#c"));
  cli.executeLine("redo");
  tree = cli.executeLine("tree") ?? "";
  assert.ok(tree.indexOf("circle#c") < tree.indexOf("g#scene"));
});
