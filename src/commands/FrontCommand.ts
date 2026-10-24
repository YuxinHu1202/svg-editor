import type { SvgDocument } from "../model/SvgDocument.js";
import type { ShapePlacement } from "../model/ShapePlacement.js";
import { EditingCommand } from "./EditingCommand.js";

export class FrontCommand extends EditingCommand {
  private before: ShapePlacement | null = null;
  private after: ShapePlacement | null = null;

  public constructor(private readonly id: string) {
    super();
  }

  protected override apply(document: SvgDocument): string {
    const shape = document.requireShape(this.id);
    this.before = document.locationOf(this.id);
    document.bringToFront(this.id);
    this.after = document.locationOf(this.id);
    return `${shape.type}#${shape.id} brought to front`;
  }

  public override undo(document: SvgDocument): string {
    this.ensureExecuted();
    if (!this.before) throw new Error("front command state is missing");
    document.relocate(this.id, this.before.parentId, this.before.index);
    return this.undoResult();
  }

  public override redo(document: SvgDocument): string {
    this.ensureExecuted();
    if (!this.after) throw new Error("front command state is missing");
    document.relocate(this.id, this.after.parentId, this.after.index);
    return this.redoResult();
  }
}
