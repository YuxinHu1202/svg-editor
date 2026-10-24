import type { SvgDocument } from "../model/SvgDocument.js";
import type { ShapePlacement } from "../model/ShapePlacement.js";
import { EditingCommand } from "./EditingCommand.js";

export class DeleteCommand extends EditingCommand {
  private placement: ShapePlacement | null = null;

  public constructor(private readonly id: string) {
    super();
  }

  protected override apply(document: SvgDocument): string {
    this.placement = document.removeWithLocation(this.id);
    return `${this.placement.shape.type}#${this.placement.shape.id} deleted`;
  }

  public override undo(document: SvgDocument): string {
    this.ensureExecuted();
    if (!this.placement) throw new Error("delete command state is missing");
    document.insertAt(this.placement.shape, this.placement.parentId, this.placement.index);
    return this.undoResult();
  }

  public override redo(document: SvgDocument): string {
    this.ensureExecuted();
    document.removeWithLocation(this.id);
    return this.redoResult();
  }
}
