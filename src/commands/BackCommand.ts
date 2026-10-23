import type { SvgDocument } from "../model/SvgDocument.js";
import { EditingCommand } from "./EditingCommand.js";

export class BackCommand extends EditingCommand {
  public constructor(private readonly id: string) {
    super();
  }

  protected override apply(document: SvgDocument): string {
    const shape = document.requireShape(this.id);
    document.sendToBack(this.id);
    return `${shape.type}#${shape.id} sent to back`;
  }
}
