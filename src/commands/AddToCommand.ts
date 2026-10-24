import type { SvgDocument } from "../model/SvgDocument.js";
import type { ShapePlacement } from "../model/ShapePlacement.js";
import { EditingCommand } from "./EditingCommand.js";

export class AddToCommand extends EditingCommand {
  private before: ShapePlacement | null = null;
  private after: ShapePlacement | null = null;

  public constructor(
    private readonly groupId: string,
    private readonly shapeId: string,
  ) {
    super();
  }

  protected override apply(document: SvgDocument): string {
    this.before = document.locationOf(this.shapeId);
    document.addTo(this.groupId, this.shapeId);
    this.after = document.locationOf(this.shapeId);
    return `${document.requireShape(this.shapeId).type}#${this.shapeId} moved into g#${this.groupId}`;
  }

  public override undo(document: SvgDocument): string {
    this.ensureExecuted();
    if (!this.before) throw new Error("addto command state is missing");
    document.relocate(this.shapeId, this.before.parentId, this.before.index);
    return this.undoResult();
  }

  public override redo(document: SvgDocument): string {
    this.ensureExecuted();
    if (!this.after) throw new Error("addto command state is missing");
    document.relocate(this.shapeId, this.after.parentId, this.after.index);
    return this.redoResult();
  }
}
