import type { SvgDocument } from "../model/SvgDocument.js";
import type { ShapePlacement } from "../model/ShapePlacement.js";
import type { GroupShape } from "../model/shapes/GroupShape.js";
import { EditingCommand } from "./EditingCommand.js";

export class GroupCommand extends EditingCommand {
  private originalPlacements: ShapePlacement[] = [];
  private group: GroupShape | null = null;

  public constructor(
    private readonly groupId: string,
    private readonly childIds: string[],
  ) {
    super();
  }

  protected override apply(document: SvgDocument): string {
    this.originalPlacements = this.childIds.map((id) => document.locationOf(id));
    this.group = document.group(this.groupId, this.childIds);
    return `g#${this.group.id} created with ${this.group.children.length} children`;
  }

  public override undo(document: SvgDocument): string {
    this.ensureExecuted();
    if (!this.group) throw new Error("group command state is missing");
    document.removeWithLocation(this.groupId);
    const placements = [...this.originalPlacements].sort((left, right) =>
      left.parentId === right.parentId ? left.index - right.index : 0,
    );
    for (const placement of placements) {
      this.group.removeChild(placement.shape);
      document.insertAt(placement.shape, placement.parentId, placement.index);
    }
    return this.undoResult();
  }

  public override redo(document: SvgDocument): string {
    this.ensureExecuted();
    this.group = document.group(this.groupId, this.childIds);
    return this.redoResult();
  }
}
