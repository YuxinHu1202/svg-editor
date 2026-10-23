import type { ShapeFactory } from "../model/ShapeFactory.js";
import type { SvgDocument } from "../model/SvgDocument.js";
import { EditingCommand } from "./EditingCommand.js";

export class CreateCommand extends EditingCommand {
  public constructor(
    private readonly factory: ShapeFactory,
    private readonly type: string,
    private readonly id: string,
    private readonly parameters: string[],
    private readonly containerId?: string,
  ) {
    super();
  }

  protected override apply(document: SvgDocument): string {
    const shape = this.factory.create(this.type, this.id, this.parameters);
    document.add(shape, this.containerId);
    return `${shape.type}#${shape.id} created${this.containerId ? ` in g#${this.containerId}` : ""}`;
  }
}
