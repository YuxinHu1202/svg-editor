import type { SvgDocument } from "../model/SvgDocument.js";
import { EditingCommand } from "./EditingCommand.js";

export class SetCommand extends EditingCommand {
  private oldValue: string | undefined;

  public constructor(
    private readonly id: string,
    private readonly attribute: string,
    private readonly value: string,
  ) {
    super();
  }

  protected override apply(document: SvgDocument): string {
    const shape = document.requireShape(this.id);
    this.oldValue = shape.getAttribute(this.attribute);
    shape.setAttribute(this.attribute, this.value);
    return `${shape.type}#${shape.id} updated: ${this.attribute}="${this.value}"`;
  }

  public override undo(document: SvgDocument): string {
    this.ensureExecuted();
    document.requireShape(this.id).restoreAttribute(this.attribute, this.oldValue);
    return this.undoResult();
  }

  public override redo(document: SvgDocument): string {
    this.ensureExecuted();
    document.requireShape(this.id).setAttribute(this.attribute, this.value);
    return this.redoResult();
  }
}
