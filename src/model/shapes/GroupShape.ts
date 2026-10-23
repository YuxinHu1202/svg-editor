import { EditorError } from "../../errors/EditorError.js";
import { Shape } from "./Shape.js";

export class GroupShape extends Shape {
  private readonly childList: Shape[] = [];

  public constructor(id: string) {
    super(id, "g");
  }

  public get children(): readonly Shape[] {
    return this.childList;
  }

  public addChild(shape: Shape, index = this.childList.length): void {
    const boundedIndex = Math.max(0, Math.min(index, this.childList.length));
    this.childList.splice(boundedIndex, 0, shape);
    shape.setParent(this);
  }

  public removeChild(shape: Shape): number {
    const index = this.childList.indexOf(shape);
    if (index < 0) throw new EditorError(`no such child in g#${this.id}: ${shape.id}`);
    this.childList.splice(index, 1);
    shape.setParent(null);
    return index;
  }

  public indexOf(shape: Shape): number {
    return this.childList.indexOf(shape);
  }

  public containsDescendant(candidate: Shape): boolean {
    for (const child of this.childList) {
      if (child === candidate) return true;
      if (child instanceof GroupShape && child.containsDescendant(candidate)) return true;
    }
    return false;
  }

  public override move(dx: number, dy: number): void {
    for (const child of this.childList) child.move(dx, dy);
  }

  public override scale(factor: number): void {
    for (const child of this.childList) child.scale(factor);
  }

  protected override setGeometryAttribute(name: string, _value: string): void {
    throw new EditorError(`unknown attribute: ${name}`);
  }

  public override clone(): GroupShape {
    const copy = new GroupShape(this.id);
    this.copyStylesTo(copy);
    for (const child of this.childList) copy.addChild(child.clone());
    return copy;
  }

  public override toSvg(indent: number): string {
    const pad = "  ".repeat(indent);
    if (this.childList.length === 0) return `${pad}<g ${this.commonSvgAttributes()}/>`;
    const children = this.childList.map((child) => child.toSvg(indent + 1)).join("\n");
    return `${pad}<g ${this.commonSvgAttributes()}>\n${children}\n${pad}</g>`;
  }

  public override summary(): string {
    return `g#${this.id}${this.styleSummary() ? ` ${this.styleSummary()}` : ""}`;
  }

  public override detailLines(): string[] {
    return [`children=${this.childList.length}`, this.styleSummary()].filter(Boolean);
  }
}
