import type { SvgDocument } from "../model/SvgDocument.js";
import type { Shape } from "../model/shapes/Shape.js";
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
    return this.resultFor(shape, false);
  }

  public override undo(document: SvgDocument): string {
    this.ensureExecuted();
    const shape = document.requireShape(this.id);
    shape.move(-this.dx, -this.dy);
    return this.resultFor(shape, true);
  }

  public override redo(document: SvgDocument): string {
    this.ensureExecuted();
    const shape = document.requireShape(this.id);
    shape.move(this.dx, this.dy);
    return this.resultFor(shape, false);
  }

  private resultFor(shape: Shape, undo: boolean): string {
    const position = shape.positionSummary();
    if (position !== null) {
      return `${shape.type}#${shape.id} moved${undo ? " back" : ""} to ${position}`;
    }
    const dx = undo ? -this.dx : this.dx;
    const dy = undo ? -this.dy : this.dy;
    return `${shape.type}#${shape.id} moved${undo ? " back" : ""} by (${dx},${dy})`;
  }
}
