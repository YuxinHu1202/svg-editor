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

  public override positionSummary(): string {
    return `(${this.formatNumber(this.cx)},${this.formatNumber(this.cy)})`;
  }

  protected override getGeometryAttribute(name: string): string {
    if (name === "cx") return this.formatNumber(this.cx);
    if (name === "cy") return this.formatNumber(this.cy);
    if (name === "rx") return this.formatNumber(this.rx);
    if (name === "ry") return this.formatNumber(this.ry);
    throw new EditorError(`unknown attribute: ${name}`);
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
