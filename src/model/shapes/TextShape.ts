import { EditorError } from "../../errors/EditorError.js";
import { Shape } from "./Shape.js";

export class TextShape extends Shape {
  public constructor(
    id: string,
    private x: number,
    private y: number,
    private text: string,
  ) {
    super(id, "text");
  }

  public override move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  public override scale(factor: number): void {
    this.x *= factor;
    this.y *= factor;
  }

  protected override setGeometryAttribute(name: string, value: string): void {
    if (name === "text") {
      this.text = value;
      return;
    }
    const number = this.parseNumber(name, value);
    if (name === "x") this.x = number;
    else if (name === "y") this.y = number;
    else throw new EditorError(`unknown attribute: ${name}`);
  }

  public override clone(): TextShape {
    const copy = new TextShape(this.id, this.x, this.y, this.text);
    this.copyStylesTo(copy);
    return copy;
  }

  public override toSvg(indent: number): string {
    const pad = "  ".repeat(indent);
    return `${pad}<text ${this.commonSvgAttributes()} x="${this.formatNumber(this.x)}" y="${this.formatNumber(this.y)}">${this.escapeXml(this.text)}</text>`;
  }

  public override summary(): string {
    return `text#${this.id} (${this.formatNumber(this.x)},${this.formatNumber(this.y)}) "${this.text}"${this.styleSummary() ? ` ${this.styleSummary()}` : ""}`;
  }

  public override detailLines(): string[] {
    return [
      `x=${this.formatNumber(this.x)} y=${this.formatNumber(this.y)}`,
      `text="${this.text}"`,
      this.styleSummary(),
    ].filter(Boolean);
  }
}
