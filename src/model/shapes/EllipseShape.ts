import { EditorError } from "../../errors/EditorError.js";
import { Shape } from "./Shape.js";

export class EllipseShape extends Shape {
  public constructor(
    id: string,
    private cx: number,
    private cy: number,
    private rx: number,
    private ry: number,
  ) {
    super(id, "ellipse");
    if (rx < 0 || ry < 0) throw new EditorError("ellipse radii must be non-negative");
  }

  public override move(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }

  public override scale(factor: number): void {
    this.cx *= factor;
    this.cy *= factor;
    this.rx *= factor;
    this.ry *= factor;
  }

  protected override setGeometryAttribute(name: string, value: string): void {
    const number = this.parseNumber(name, value);
    if ((name === "rx" || name === "ry") && number < 0) {
      throw new EditorError(`${name} must be non-negative`);
    }
    if (name === "cx") this.cx = number;
    else if (name === "cy") this.cy = number;
    else if (name === "rx") this.rx = number;
    else if (name === "ry") this.ry = number;
    else throw new EditorError(`unknown attribute: ${name}`);
  }

  public override clone(): EllipseShape {
    const copy = new EllipseShape(this.id, this.cx, this.cy, this.rx, this.ry);
    this.copyStylesTo(copy);
    return copy;
  }

  public override toSvg(indent: number): string {
    const pad = "  ".repeat(indent);
    return `${pad}<ellipse ${this.commonSvgAttributes()} cx="${this.formatNumber(this.cx)}" cy="${this.formatNumber(this.cy)}" rx="${this.formatNumber(this.rx)}" ry="${this.formatNumber(this.ry)}"/>`;
  }

  public override summary(): string {
    return `ellipse#${this.id} cx=${this.formatNumber(this.cx)} cy=${this.formatNumber(this.cy)} rx=${this.formatNumber(this.rx)} ry=${this.formatNumber(this.ry)}${this.styleSummary() ? ` ${this.styleSummary()}` : ""}`;
  }

  public override detailLines(): string[] {
    return [
      `cx=${this.formatNumber(this.cx)} cy=${this.formatNumber(this.cy)} rx=${this.formatNumber(this.rx)} ry=${this.formatNumber(this.ry)}`,
      this.styleSummary(),
    ].filter(Boolean);
  }
}
