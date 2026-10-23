import { AddToCommand } from "../commands/AddToCommand.js";
import { BackCommand } from "../commands/BackCommand.js";
import type { Command } from "../commands/Command.js";
import { CommandHistory } from "../commands/CommandHistory.js";
import { CreateCommand } from "../commands/CreateCommand.js";
import { DeleteCommand } from "../commands/DeleteCommand.js";
import { FrontCommand } from "../commands/FrontCommand.js";
import { GroupCommand } from "../commands/GroupCommand.js";
import { MoveCommand } from "../commands/MoveCommand.js";
import { ScaleCommand } from "../commands/ScaleCommand.js";
import { SetCommand } from "../commands/SetCommand.js";
import { UngroupCommand } from "../commands/UngroupCommand.js";
import { EditorError } from "../errors/EditorError.js";
import { ShapeFactory } from "../model/ShapeFactory.js";
import { SvgDocument } from "../model/SvgDocument.js";
import { SvgReader } from "../persistence/SvgReader.js";
import { SvgWriter } from "../persistence/SvgWriter.js";
import { CommandTokenizer } from "./CommandTokenizer.js";

type Handler = (arguments_: string[]) => string;

export class CliApplication {
  private document: SvgDocument | null = null;
  private readonly history = new CommandHistory();
  private readonly factory = new ShapeFactory();
  private readonly reader = new SvgReader();
  private readonly writer = new SvgWriter();
  private readonly tokenizer = new CommandTokenizer();
  private readonly handlers = new Map<string, Handler>([
    ["init", (args) => this.init(args)],
    ["read", (args) => this.read(args)],
    ["save", (args) => this.save(args)],
    ["canvas", (args) => this.canvas(args)],
    ["create", (args) => this.create(args)],
    ["delete", (args) => this.delete(args)],
    ["move", (args) => this.move(args)],
    ["scale", (args) => this.scale(args)],
    ["set", (args) => this.set(args)],
    ["group", (args) => this.group(args)],
    ["ungroup", (args) => this.ungroup(args)],
    ["addto", (args) => this.addTo(args)],
    ["front", (args) => this.front(args)],
    ["back", (args) => this.back(args)],
    ["tree", (args) => this.tree(args)],
    ["show", (args) => this.show(args)],
    ["help", (args) => this.help(args)],
    ["undo", (args) => this.undo(args)],
    ["redo", (args) => this.redo(args)],
  ]);

  public executeLine(line: string): string | null {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return null;
    try {
      const [name, ...arguments_] = this.tokenizer.tokenize(trimmed);
      if (!name) return null;
      const handler = this.handlers.get(name.toLowerCase());
      if (!handler) throw new EditorError(`unknown command: ${name}`);
      return handler(arguments_);
    } catch (error) {
      return `error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  public currentDocument(): SvgDocument | null {
    return this.document;
  }

  private init(args: string[]): string {
    if (args.length !== 0 && args.length !== 2) throw new EditorError("usage: init [w] [h]");
    const width = args.length === 0 ? 800 : this.number(args[0], "w");
    const height = args.length === 0 ? 600 : this.number(args[1], "h");
    this.document = new SvgDocument(width, height);
    this.history.ioBarrier();
    return `canvas ${width}x${height} created`;
  }

  private read(args: string[]): string {
    this.exactArgs(args, 1, "read <file.svg>");
    const path = args[0] ?? "";
    const result = this.reader.read(path);
    this.document = result.document;
    this.history.ioBarrier();
    return [...result.warnings, `read ${path} (${result.document.countElements()} elements)`].join("\n");
  }

  private save(args: string[]): string {
    if (args.length > 1) throw new EditorError("usage: save [file.svg]");
    const document = this.requireDocument();
    const path = this.writer.write(document, args[0]);
    this.history.ioBarrier();
    return `saved to ${path} (${document.countElements()} elements)`;
  }

  private canvas(args: string[]): string {
    const document = this.requireDocument();
    if (args.length === 0) return `canvas ${document.width}x${document.height}`;
    this.exactArgs(args, 2, "canvas [w] [h]");
    const width = this.number(args[0], "w");
    const height = this.number(args[1], "h");
    document.setCanvas(width, height);
    this.history.ioBarrier();
    return `canvas resized to ${width}x${height}`;
  }

  private create(args: string[]): string {
    if (args.length < 2) throw new EditorError("usage: create <type> <id> [params…] [in <containerId>]");
    const [type = "", id = "", ...rawParameters] = args;
    let parameters = rawParameters;
    let containerId: string | undefined;
    if (rawParameters.length >= 2 && rawParameters.at(-2) === "in") {
      containerId = rawParameters.at(-1);
      parameters = rawParameters.slice(0, -2);
    }
    return this.execute(new CreateCommand(this.factory, type, id, parameters, containerId));
  }

  private delete(args: string[]): string {
    this.exactArgs(args, 1, "delete <id>");
    return this.execute(new DeleteCommand(args[0] ?? ""));
  }

  private move(args: string[]): string {
    this.exactArgs(args, 3, "move <id> <dx> <dy>");
    return this.execute(new MoveCommand(args[0] ?? "", this.number(args[1], "dx"), this.number(args[2], "dy")));
  }

  private scale(args: string[]): string {
    this.exactArgs(args, 2, "scale <id> <factor>");
    return this.execute(new ScaleCommand(args[0] ?? "", this.number(args[1], "factor")));
  }

  private set(args: string[]): string {
    this.exactArgs(args, 3, "set <id> <attr> <value>");
    return this.execute(new SetCommand(args[0] ?? "", args[1] ?? "", args[2] ?? ""));
  }

  private group(args: string[]): string {
    if (args.length < 2) throw new EditorError("usage: group <newGid> <id1> <id2>…");
    return this.execute(new GroupCommand(args[0] ?? "", args.slice(1)));
  }

  private ungroup(args: string[]): string {
    this.exactArgs(args, 1, "ungroup <gid>");
    return this.execute(new UngroupCommand(args[0] ?? ""));
  }

  private addTo(args: string[]): string {
    this.exactArgs(args, 2, "addto <gid> <id>");
    return this.execute(new AddToCommand(args[0] ?? "", args[1] ?? ""));
  }

  private front(args: string[]): string {
    this.exactArgs(args, 1, "front <id>");
    return this.execute(new FrontCommand(args[0] ?? ""));
  }

  private back(args: string[]): string {
    this.exactArgs(args, 1, "back <id>");
    return this.execute(new BackCommand(args[0] ?? ""));
  }

  private tree(args: string[]): string {
    if (args.length > 1) throw new EditorError("usage: tree [id]");
    return this.requireDocument().tree(args[0]);
  }

  private show(args: string[]): string {
    this.exactArgs(args, 1, "show <id>");
    return this.requireDocument().show(args[0] ?? "");
  }

  private undo(args: string[]): string {
    this.exactArgs(args, 0, "undo");
    return this.history.undo(this.requireDocument());
  }

  private redo(args: string[]): string {
    this.exactArgs(args, 0, "redo");
    return this.history.redo(this.requireDocument());
  }

  private help(args: string[]): string {
    this.exactArgs(args, 0, "help");
    return [
      "init [w] [h]",
      "read <file.svg>",
      "save [file.svg]",
      "canvas [w] [h]",
      "create rect <id> <x> <y> <w> <h> [fill] [in <containerId>]",
      "create circle <id> <cx> <cy> <r> [fill] [in <containerId>]",
      "create ellipse <id> <cx> <cy> <rx> <ry> [fill] [in <containerId>]",
      "create line <id> <x1> <y1> <x2> <y2> [stroke] [in <containerId>]",
      'create text <id> <x> <y> "content" [in <containerId>]',
      "create g <id> [in <containerId>]",
      "delete <id>",
      "move <id> <dx> <dy>",
      "scale <id> <factor>",
      "set <id> <attr> <value>",
      "group <newGid> <id1> <id2>…",
      "ungroup <gid>",
      "addto <gid> <id>",
      "front <id>",
      "back <id>",
      "tree [id]",
      "show <id>",
      "help",
      "undo",
      "redo",
    ].join("\n");
  }

  private execute(command: Command): string {
    return this.history.execute(command, this.requireDocument());
  }

  private requireDocument(): SvgDocument {
    if (!this.document) throw new EditorError("no document. use 'init' or 'read' first");
    return this.document;
  }

  private exactArgs(args: string[], count: number, usage: string): void {
    if (args.length !== count) throw new EditorError(`usage: ${usage}`);
  }

  private number(value: string | undefined, name: string): number {
    const parsed = Number(value);
    if (value === undefined || value.trim() === "" || !Number.isFinite(parsed)) {
      throw new EditorError(`invalid number for ${name}: ${value ?? ""}`);
    }
    return parsed;
  }
}
