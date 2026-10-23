import { EditorError } from "../errors/EditorError.js";
import type { SvgDocument } from "../model/SvgDocument.js";
import type { Command } from "./Command.js";

export class CommandHistory {
  private readonly undoStack: Command[] = [];
  private readonly redoStack: Command[] = [];
  private blocked = false;

  public execute(command: Command, document: SvgDocument): string {
    const result = command.execute(document);
    this.undoStack.push(command);
    this.redoStack.length = 0;
    this.blocked = false;
    return result;
  }

  public undo(document: SvgDocument): string {
    if (this.blocked) throw new EditorError("undo not allowed after io command");
    const command = this.undoStack.pop();
    if (!command) throw new EditorError("nothing to undo");
    const result = command.undo(document);
    this.redoStack.push(command);
    return result;
  }

  public redo(document: SvgDocument): string {
    if (this.blocked) throw new EditorError("undo not allowed after io command");
    const command = this.redoStack.pop();
    if (!command) throw new EditorError("nothing to redo");
    const result = command.redo(document);
    this.undoStack.push(command);
    return result;
  }

  public ioBarrier(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.blocked = true;
  }
}
