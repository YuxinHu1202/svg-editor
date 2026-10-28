import { EditorError } from "../../errors/EditorError.js";
import { Shape } from "./Shape.js";

export class RectShape extends Shape {
  public constructor(
    id: string,
    private x: number,
    private y: number,
    private width: number,
    private height: number,
  ) {
    super(id, "rect");
    if (width < 0 || height < 0) {
      throw new EditorError("rectangle width and height must be non-negative");
    }
  }

  public override move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  public override scale(factor: number): void {
    this.x *= factor;
    this.y *= factor;
    this.width *= factor;
    this.height *= factor;
  }

  public override positionSummary(): string {
    return `(${this.formatNumber(this.x)},${this.formatNumber(this.y)})`;
  }

  protected override getGeometryAttribute(name: string): string {
    if (name === "x") return this.formatNumber(this.x);
    if (name === "y") return this.formatNumber(this.y);
    if (name === "width") return this.formatNumber(this.width);
    if (name === "height") return this.formatNumber(this.height);
    throw new EditorError(`unknown attribute: ${name}`);
  }

  protected override setGeometryAttribute(name: string, value: string): void {
    const number = this.parseNumber(name, value);
    if ((name === "width" || name === "height") && number < 0) {
      throw new EditorError(`${name} must be non-negative`);
    }
    if (name === "x") this.x = number;
    else if (name === "y") this.y = number;
    else if (name === "width") this.width = number;
    else if (name === "height") this.height = number;
    else throw new EditorError(`unknown attribute: ${name}`);
  }

  public override toSvg(indent: number): string {
    const pad = "  ".repeat(indent);
    return `${pad}<rect ${this.commonSvgAttributes()} x="${this.formatNumber(this.x)}" y="${this.formatNumber(this.y)}" width="${this.formatNumber(this.width)}" height="${this.formatNumber(this.height)}"/>`;
  }

  public override summary(): string {
    return `rect#${this.id} x=${this.formatNumber(this.x)} y=${this.formatNumber(this.y)} w=${this.formatNumber(this.width)} h=${this.formatNumber(this.height)}${this.styleSummary() ? ` ${this.styleSummary()}` : ""}`;
  }

  public override detailLines(): string[] {
    return [
      `x=${this.formatNumber(this.x)} y=${this.formatNumber(this.y)} width=${this.formatNumber(this.width)} height=${this.formatNumber(this.height)}`,
      this.styleSummary(),
    ].filter(Boolean);
  }
}
