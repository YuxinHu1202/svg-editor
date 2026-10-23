import type { SvgDocument } from "../model/SvgDocument.js";
import { EditingCommand } from "./EditingCommand.js";

export class GroupCommand extends EditingCommand {
  public constructor(
    private readonly groupId: string,
    private readonly childIds: string[],
  ) {
    super();
  }

  protected override apply(document: SvgDocument): string {
    const group = document.group(this.groupId, this.childIds);
    return `g#${group.id} created with ${group.children.length} children`;
  }
}
