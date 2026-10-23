import { EditorError } from "../errors/EditorError.js";
import type { SvgDocument } from "../model/SvgDocument.js";
import { EditingCommand } from "./EditingCommand.js";

export class ScaleCommand extends EditingCommand {
  public constructor(
    private readonly id: string,
    private readonly factor: number,
  ) {
    super();
  }

  protected override apply(document: SvgDocument): string {
    if (this.factor <= 0) throw new EditorError("scale factor must be positive");
    const shape = document.requireShape(this.id);
    shape.scale(this.factor);
    return `${shape.type}#${shape.id} scaled by ${this.factor}`;
  }
}
