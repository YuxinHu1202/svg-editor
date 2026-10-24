import type { SvgDocument } from "../model/SvgDocument.js";
import { EditingCommand } from "./EditingCommand.js";

export class MoveCommand extends EditingCommand {
  public constructor(
    private readonly id: string,
    private readonly dx: number,
    private readonly dy: number,
  ) {
    super();
  }

  protected override apply(document: SvgDocument): string {
    const shape = document.requireShape(this.id);
    shape.move(this.dx, this.dy);
    return `${shape.type}#${shape.id} moved by (${this.dx},${this.dy})`;
  }

  public override undo(document: SvgDocument): string {
    this.ensureExecuted();
    document.requireShape(this.id).move(-this.dx, -this.dy);
    return this.undoResult();
  }

  public override redo(document: SvgDocument): string {
    this.ensureExecuted();
    document.requireShape(this.id).move(this.dx, this.dy);
    return this.redoResult();
  }
}
