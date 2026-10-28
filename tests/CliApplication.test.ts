import assert from "node:assert/strict";
import { test } from "node:test";
import { CliApplication } from "../src/cli/CliApplication.js";

test("requires a document before editing", () => {
  const cli = new CliApplication();
  assert.equal(cli.executeLine("create rect r1 0 0 10 10"), "error: no document. use 'init' or 'read' first");
  assert.match(cli.executeLine("help") ?? "", /create rect <id>/);
  assert.match(cli.executeLine("help") ?? "", /ungroup <gid>/);
});

test("creates all built-in shapes and displays their properties", () => {
  const cli = new CliApplication();
  assert.equal(cli.executeLine("init"), "canvas 800x600 created");
  assert.equal(cli.executeLine("create g scene"), "g#scene created");
  assert.equal(cli.executeLine("create rect r1 10 20 100 50 #eee in scene"), "rect#r1 created in g#scene");
  assert.equal(cli.executeLine("create circle c1 100 100 20 red in scene"), "circle#c1 created in g#scene");
  assert.equal(cli.executeLine("create ellipse e1 60 70 20 10 blue in scene"), "ellipse#e1 created in g#scene");
  assert.equal(cli.executeLine("create line l1 0 0 50 50 black in scene"), "line#l1 created in g#scene");
  assert.equal(cli.executeLine('create text t1 20 40 "My Diagram" in scene'), "text#t1 created in g#scene");

  const tree = cli.executeLine("tree") ?? "";
  assert.match(tree, /g#scene/);
  assert.match(tree, /rect#r1 x=10 y=20 w=100 h=50 fill=#eee/);
  assert.match(tree, /text#t1 \(20,40\) "My Diagram"/);
  assert.match(cli.executeLine("show c1") ?? "", /parent=g#scene/);
});

test("editing commands are atomic and support undo and redo", () => {
  const cli = new CliApplication();
  cli.executeLine("init 400 300");
  cli.executeLine("create rect r1 10 20 100 50 red");
  cli.executeLine("move r1 20 5");
  assert.match(cli.executeLine("tree") ?? "", /x=30 y=25/);

  assert.equal(cli.executeLine("undo"), "rect#r1 moved back to (10,20)");
  assert.match(cli.executeLine("tree") ?? "", /x=10 y=20/);
  cli.executeLine("redo");
  assert.match(cli.executeLine("tree") ?? "", /x=30 y=25/);

  const before = cli.executeLine("tree");
  assert.equal(cli.executeLine("scale r1 0"), "error: scale factor must be positive");
  assert.equal(cli.executeLine("tree"), before);
});

test("a new edit after undo clears redo", () => {
  const cli = new CliApplication();
  cli.executeLine("init");
  cli.executeLine("create circle c1 10 10 5");
  cli.executeLine("move c1 10 0");
  cli.executeLine("undo");
  cli.executeLine("set c1 fill blue");
  assert.equal(cli.executeLine("redo"), "error: nothing to redo");
});

test("groups behave as composite shapes and prevent cycles", () => {
  const cli = new CliApplication();
  cli.executeLine("init");
  cli.executeLine("create g scene");
  cli.executeLine("create rect r1 0 0 10 10 in scene");
  cli.executeLine("create circle c1 20 20 5 in scene");
  assert.equal(cli.executeLine("group pair r1 c1"), "g#pair created with 2 children");
  cli.executeLine("move pair 5 10");
  const tree = cli.executeLine("tree") ?? "";
  assert.match(tree, /rect#r1 x=5 y=10/);
  assert.match(tree, /circle#c1 cx=25 cy=30/);
  assert.equal(
    cli.executeLine("group bad r1 pair"),
    "error: cannot group a container into its own descendant: pair",
  );
  assert.equal(cli.executeLine("ungroup pair"), "g#pair ungrouped; 2 children promoted");
});

test("top-level groups cannot be ungrouped", () => {
  const cli = new CliApplication();
  cli.executeLine("init");
  cli.executeLine("create rect r1 0 0 10 10");
  cli.executeLine("group top r1");
  assert.equal(cli.executeLine("ungroup top"), "error: cannot ungroup top-level container: top");
});

test("front and back change sibling order", () => {
  const cli = new CliApplication();
  cli.executeLine("init");
  cli.executeLine("create rect a 0 0 1 1");
  cli.executeLine("create rect b 0 0 1 1");
  cli.executeLine("back b");
  const backTree = cli.executeLine("tree") ?? "";
  assert.ok(backTree.indexOf("rect#b") < backTree.indexOf("rect#a"));
  cli.executeLine("front b");
  const frontTree = cli.executeLine("tree") ?? "";
  assert.ok(frontTree.indexOf("rect#a") < frontTree.indexOf("rect#b"));
});

test("comments and blank lines are ignored", () => {
  const cli = new CliApplication();
  assert.equal(cli.executeLine(""), null);
  assert.equal(cli.executeLine("# create rect ignored 0 0 1 1"), null);
});

test("delete, addto, set, and their undo operations preserve the tree", () => {
  const cli = new CliApplication();
  cli.executeLine("init");
  cli.executeLine("create g scene");
  cli.executeLine("create rect r1 1 2 3 4");
  cli.executeLine("addto scene r1");
  assert.match(cli.executeLine("show r1") ?? "", /parent=g#scene/);
  cli.executeLine("set r1 width 20");
  assert.match(cli.executeLine("tree") ?? "", /w=20/);
  assert.equal(cli.executeLine("delete r1"), "rect#r1 deleted");
  assert.equal(cli.executeLine("show r1"), "error: no such shape: r1");
  assert.equal(cli.executeLine("undo"), "rect#r1 restored into g#scene");
  assert.match(cli.executeLine("show r1") ?? "", /width=20/);
});

test("invalid attributes, duplicate ids, and invalid containers do not mutate state", () => {
  const cli = new CliApplication();
  cli.executeLine("init");
  cli.executeLine("create rect r1 0 0 10 10");
  const before = cli.executeLine("tree");
  assert.equal(cli.executeLine("set r1 opacity 0.5"), "error: unknown attribute: opacity");
  assert.equal(cli.executeLine("create circle r1 0 0 1"), "error: id already exists: r1");
  assert.equal(cli.executeLine("create circle c1 0 0 1 in r1"), "error: not a container: r1");
  assert.equal(cli.executeLine("create box b1 0 0 1 1 title"), "error: unknown shape type: box (is the plugin loaded?)");
  assert.equal(cli.executeLine("tree"), before);
});

test("canvas changes create an IO history barrier until another edit", () => {
  const cli = new CliApplication();
  cli.executeLine("init");
  cli.executeLine("create rect r1 0 0 1 1");
  assert.equal(cli.executeLine("canvas 100 200"), "canvas resized to 100x200");
  assert.equal(cli.executeLine("undo"), "error: undo not allowed after io command");
  cli.executeLine("move r1 1 1");
  assert.equal(cli.executeLine("undo"), "rect#r1 moved back to (0,0)");
  assert.equal(cli.executeLine("canvas"), "canvas 100x200");
});
