import { EditorError } from "../../errors/EditorError.js";
import type { GroupShape } from "./GroupShape.js";

export type ShapeAttribute = string | number;

export abstract class Shape {
  private parentValue: GroupShape | null = null;
  private readonly styles = new Map<string, string>();

  protected constructor(
    public readonly id: string,
    public readonly type: string,
  ) {}

  public get parent(): GroupShape | null {
    return this.parentValue;
  }

  public setParent(parent: GroupShape | null): void {
    this.parentValue = parent;
  }

  public getStyle(name: string): string | undefined {
    return this.styles.get(name);
  }

  public setStyle(name: string, value: string): void {
    this.styles.set(name, value);
  }

  public getAttribute(name: string): string | undefined {
    if (name === "fill" || name === "stroke" || name === "stroke-width") {
      return this.styles.get(name);
    }
    return this.getGeometryAttribute(name);
  }

  protected styleEntries(): Array<[string, string]> {
    return [...this.styles.entries()];
  }

  public setAttribute(name: string, value: string): void {
    if (name === "fill" || name === "stroke" || name === "stroke-width") {
      if (name === "stroke-width") {
        const width = Number(value);
        if (!Number.isFinite(width) || width < 0) {
          throw new EditorError(`invalid value for ${name}: ${value}`);
        }
      }
      this.setStyle(name, value);
      return;
    }
    this.setGeometryAttribute(name, value);
  }

  public restoreAttribute(name: string, value: string | undefined): void {
    if (name === "fill" || name === "stroke" || name === "stroke-width") {
      if (value === undefined) this.styles.delete(name);
      else this.setStyle(name, value);
      return;
    }
    if (value === undefined) throw new EditorError(`cannot restore attribute without a value: ${name}`);
    this.setGeometryAttribute(name, value);
  }

  protected parseNumber(name: string, value: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new EditorError(`invalid number for ${name}: ${value}`);
    }
    return parsed;
  }

  protected formatNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
  }

  protected escapeXml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  protected commonSvgAttributes(): string {
    const attributes = [`id="${this.escapeXml(this.id)}"`];
    for (const [name, value] of this.styleEntries()) {
      attributes.push(`${name}="${this.escapeXml(value)}"`);
    }
    return attributes.join(" ");
  }

  protected styleSummary(): string {
    return this.styleEntries()
      .map(([name, value]) => `${name}=${value}`)
      .join(" ");
  }

  public positionSummary(): string | null {
    return null;
  }

  protected abstract getGeometryAttribute(name: string): string;
  protected abstract setGeometryAttribute(name: string, value: string): void;
  public abstract move(dx: number, dy: number): void;
  public abstract scale(factor: number): void;
  public abstract toSvg(indent: number): string;
  public abstract summary(): string;
  public abstract detailLines(): string[];
}
