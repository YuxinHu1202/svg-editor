import type { SvgDocument } from "../model/SvgDocument.js";
import { EditingCommand } from "./EditingCommand.js";

export class SetCommand extends EditingCommand {
  public constructor(
    private readonly id: string,
    private readonly attribute: string,
    private readonly value: string,
  ) {
    super();
  }

  protected override apply(document: SvgDocument): string {
    const shape = document.requireShape(this.id);
    shape.setAttribute(this.attribute, this.value);
    return `${shape.type}#${shape.id} updated: ${this.attribute}="${this.value}"`;
  }
}
