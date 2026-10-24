import { EditorError } from "../../errors/EditorError.js";
import { Shape } from "./Shape.js";

export class LineShape extends Shape {
  public constructor(
    id: string,
    private x1: number,
    private y1: number,
    private x2: number,
    private y2: number,
  ) {
    super(id, "line");
  }

  public override move(dx: number, dy: number): void {
    this.x1 += dx;
    this.y1 += dy;
    this.x2 += dx;
    this.y2 += dy;
  }

  public override scale(factor: number): void {
    this.x1 *= factor;
    this.y1 *= factor;
    this.x2 *= factor;
    this.y2 *= factor;
  }

  protected override getGeometryAttribute(name: string): string {
    if (name === "x1") return this.formatNumber(this.x1);
    if (name === "y1") return this.formatNumber(this.y1);
    if (name === "x2") return this.formatNumber(this.x2);
    if (name === "y2") return this.formatNumber(this.y2);
    throw new EditorError(`unknown attribute: ${name}`);
  }

  protected override setGeometryAttribute(name: string, value: string): void {
    const number = this.parseNumber(name, value);
    if (name === "x1") this.x1 = number;
    else if (name === "y1") this.y1 = number;
    else if (name === "x2") this.x2 = number;
    else if (name === "y2") this.y2 = number;
    else throw new EditorError(`unknown attribute: ${name}`);
  }

  public override toSvg(indent: number): string {
    const pad = "  ".repeat(indent);
    return `${pad}<line ${this.commonSvgAttributes()} x1="${this.formatNumber(this.x1)}" y1="${this.formatNumber(this.y1)}" x2="${this.formatNumber(this.x2)}" y2="${this.formatNumber(this.y2)}"/>`;
  }

  public override summary(): string {
    return `line#${this.id} (${this.formatNumber(this.x1)},${this.formatNumber(this.y1)}) -> (${this.formatNumber(this.x2)},${this.formatNumber(this.y2)})${this.styleSummary() ? ` ${this.styleSummary()}` : ""}`;
  }

  public override detailLines(): string[] {
    return [
      `x1=${this.formatNumber(this.x1)} y1=${this.formatNumber(this.y1)} x2=${this.formatNumber(this.x2)} y2=${this.formatNumber(this.y2)}`,
      this.styleSummary(),
    ].filter(Boolean);
  }
}
