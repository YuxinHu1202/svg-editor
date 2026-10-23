import type { DocumentSnapshot } from "../model/DocumentSnapshot.js";
import type { SvgDocument } from "../model/SvgDocument.js";
import type { Command } from "./Command.js";

export abstract class EditingCommand implements Command {
  private before: DocumentSnapshot | null = null;
  private after: DocumentSnapshot | null = null;
  private result = "";

  public execute(document: SvgDocument): string {
    this.before = document.snapshot();
    try {
      this.result = this.apply(document);
      this.after = document.snapshot();
      return this.result;
    } catch (error) {
      document.restore(this.before);
      throw error;
    }
  }

  public undo(document: SvgDocument): string {
    if (!this.before) throw new Error("command has not been executed");
    document.restore(this.before);
    return `undid: ${this.result}`;
  }

  public redo(document: SvgDocument): string {
    if (!this.after) throw new Error("command has not been executed");
    document.restore(this.after);
    return this.result;
  }

  protected abstract apply(document: SvgDocument): string;
}
