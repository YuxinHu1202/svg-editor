import type { SvgDocument } from "../model/SvgDocument.js";
import { EditingCommand } from "./EditingCommand.js";

export class FrontCommand extends EditingCommand {
  public constructor(private readonly id: string) {
    super();
  }

  protected override apply(document: SvgDocument): string {
    const shape = document.requireShape(this.id);
    document.bringToFront(this.id);
    return `${shape.type}#${shape.id} brought to front`;
  }
}
