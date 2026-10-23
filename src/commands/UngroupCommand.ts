import type { SvgDocument } from "../model/SvgDocument.js";
import { EditingCommand } from "./EditingCommand.js";

export class UngroupCommand extends EditingCommand {
  public constructor(private readonly groupId: string) {
    super();
  }

  protected override apply(document: SvgDocument): string {
    const count = document.ungroup(this.groupId);
    return `g#${this.groupId} ungrouped; ${count} children promoted`;
  }
}
