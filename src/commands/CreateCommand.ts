import type { ShapeFactory } from "../model/ShapeFactory.js";
import type { ShapePlacement } from "../model/ShapePlacement.js";
import type { SvgDocument } from "../model/SvgDocument.js";
import type { Shape } from "../model/shapes/Shape.js";
import { EditingCommand } from "./EditingCommand.js";

export class CreateCommand extends EditingCommand {
  private shape: Shape | null = null;
  private placement: ShapePlacement | null = null;

  public constructor(
    private readonly factory: ShapeFactory,
    private readonly type: string,
    private readonly id: string,
    private readonly parameters: string[],
    private readonly containerId?: string,
  ) {
    super();
  }

  protected override apply(document: SvgDocument): string {
    const shape = this.factory.create(this.type, this.id, this.parameters);
    document.add(shape, this.containerId);
    this.shape = shape;
    this.placement = document.locationOf(shape.id);
    return `${shape.type}#${shape.id} created${this.containerId ? ` in g#${this.containerId}` : ""}`;
  }

  public override undo(document: SvgDocument): string {
    this.ensureExecuted();
    document.removeWithLocation(this.id);
    return this.undoResult();
  }

  public override redo(document: SvgDocument): string {
    this.ensureExecuted();
    if (!this.shape || !this.placement) throw new Error("create command state is missing");
    document.insertAt(this.shape, this.placement.parentId, this.placement.index);
    return this.redoResult();
  }
}
