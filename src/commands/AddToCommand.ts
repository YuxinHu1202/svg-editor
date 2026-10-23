import type { SvgDocument } from "../model/SvgDocument.js";
import { EditingCommand } from "./EditingCommand.js";

export class AddToCommand extends EditingCommand {
  public constructor(
    private readonly groupId: string,
    private readonly shapeId: string,
  ) {
    super();
  }

  protected override apply(document: SvgDocument): string {
    document.addTo(this.groupId, this.shapeId);
    return `${document.requireShape(this.shapeId).type}#${this.shapeId} moved into g#${this.groupId}`;
  }
}
