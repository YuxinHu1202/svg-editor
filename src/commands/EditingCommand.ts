import type { SvgDocument } from "../model/SvgDocument.js";
import type { Command } from "./Command.js";

export abstract class EditingCommand implements Command {
  private result = "";
  private executed = false;

  public execute(document: SvgDocument): string {
    if (this.executed) throw new Error("command has already been executed");
    this.result = this.apply(document);
    this.executed = true;
    return this.result;
  }

  public abstract undo(document: SvgDocument): string;
  public abstract redo(document: SvgDocument): string;

  protected ensureExecuted(): void {
    if (!this.executed) throw new Error("command has not been executed");
  }

  protected undoResult(): string {
    this.ensureExecuted();
    return `undid: ${this.result}`;
  }

  protected redoResult(): string {
    this.ensureExecuted();
    return this.result;
  }

  protected abstract apply(document: SvgDocument): string;
}
