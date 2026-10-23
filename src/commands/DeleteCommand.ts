import type { SvgDocument } from "../model/SvgDocument.js";
import { EditingCommand } from "./EditingCommand.js";

export class DeleteCommand extends EditingCommand {
  public constructor(private readonly id: string) {
    super();
  }

  protected override apply(document: SvgDocument): string {
    const shape = document.delete(this.id);
    return `${shape.type}#${shape.id} deleted`;
  }
}
