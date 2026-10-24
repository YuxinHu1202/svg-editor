import type { SvgDocument } from "../model/SvgDocument.js";
import type { ShapePlacement } from "../model/ShapePlacement.js";
import type { GroupShape } from "../model/shapes/GroupShape.js";
import type { Shape } from "../model/shapes/Shape.js";
import { EditingCommand } from "./EditingCommand.js";

export class UngroupCommand extends EditingCommand {
  private group: GroupShape | null = null;
  private placement: ShapePlacement | null = null;
  private children: Shape[] = [];

  public constructor(private readonly groupId: string) {
    super();
  }

  protected override apply(document: SvgDocument): string {
    this.group = document.requireContainer(this.groupId);
    this.placement = document.locationOf(this.groupId);
    this.children = [...this.group.children];
    const count = document.ungroup(this.groupId);
    return `g#${this.groupId} ungrouped; ${count} children promoted`;
  }

  public override undo(document: SvgDocument): string {
    this.ensureExecuted();
    if (!this.group || !this.placement) throw new Error("ungroup command state is missing");
    for (const child of this.children) document.removeWithLocation(child.id);
    for (const child of this.children) this.group.addChild(child);
    document.insertAt(this.group, this.placement.parentId, this.placement.index);
    return this.undoResult();
  }

  public override redo(document: SvgDocument): string {
    this.ensureExecuted();
    document.ungroup(this.groupId);
    return this.redoResult();
  }
}
