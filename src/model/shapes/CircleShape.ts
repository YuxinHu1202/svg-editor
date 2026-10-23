import { EditorError } from "../../errors/EditorError.js";
import { Shape } from "./Shape.js";

export class CircleShape extends Shape {
  public constructor(
    id: string,
    private cx: number,
    private cy: number,
    private radius: number,
  ) {
    super(id, "circle");
    if (radius < 0) throw new EditorError("circle radius must be non-negative");
  }

  public override move(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }

  public override scale(factor: number): void {
    this.cx *= factor;
    this.cy *= factor;
    this.radius *= factor;
  }

  protected override setGeometryAttribute(name: string, value: string): void {
    const number = this.parseNumber(name, value);
    if (name === "r" && number < 0) throw new EditorError("r must be non-negative");
    if (name === "cx") this.cx = number;
    else if (name === "cy") this.cy = number;
    else if (name === "r") this.radius = number;
    else throw new EditorError(`unknown attribute: ${name}`);
  }

  public override clone(): CircleShape {
    const copy = new CircleShape(this.id, this.cx, this.cy, this.radius);
    this.copyStylesTo(copy);
    return copy;
  }

  public override toSvg(indent: number): string {
    const pad = "  ".repeat(indent);
    return `${pad}<circle ${this.commonSvgAttributes()} cx="${this.formatNumber(this.cx)}" cy="${this.formatNumber(this.cy)}" r="${this.formatNumber(this.radius)}"/>`;
  }

  public override summary(): string {
    return `circle#${this.id} cx=${this.formatNumber(this.cx)} cy=${this.formatNumber(this.cy)} r=${this.formatNumber(this.radius)}${this.styleSummary() ? ` ${this.styleSummary()}` : ""}`;
  }

  public override detailLines(): string[] {
    return [
      `cx=${this.formatNumber(this.cx)} cy=${this.formatNumber(this.cy)} r=${this.formatNumber(this.radius)}`,
      this.styleSummary(),
    ].filter(Boolean);
  }
}
