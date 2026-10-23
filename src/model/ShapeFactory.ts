import { EditorError } from "../errors/EditorError.js";
import { CircleShape } from "./shapes/CircleShape.js";
import { EllipseShape } from "./shapes/EllipseShape.js";
import { GroupShape } from "./shapes/GroupShape.js";
import { LineShape } from "./shapes/LineShape.js";
import { RectShape } from "./shapes/RectShape.js";
import type { Shape } from "./shapes/Shape.js";
import { TextShape } from "./shapes/TextShape.js";

type Creator = (id: string, parameters: string[]) => Shape;

export class ShapeFactory {
  private readonly creators = new Map<string, Creator>([
    ["rect", (id, p) => this.createRect(id, p)],
    ["circle", (id, p) => this.createCircle(id, p)],
    ["ellipse", (id, p) => this.createEllipse(id, p)],
    ["line", (id, p) => this.createLine(id, p)],
    ["text", (id, p) => this.createText(id, p)],
    ["g", (id, p) => this.createGroup(id, p)],
  ]);

  public create(type: string, id: string, parameters: string[]): Shape {
    const creator = this.creators.get(type);
    if (!creator) throw new EditorError(`unknown shape type: ${type} (is the plugin loaded?)`);
    return creator(id, parameters);
  }

  public createFromSvg(type: string, id: string, attributes: ReadonlyMap<string, string>, text: string): Shape {
    const value = (name: string): string => {
      const found = attributes.get(name);
      if (found === undefined) throw new EditorError(`missing SVG attribute ${name} on ${type}#${id}`);
      return found;
    };
    const optionalStyle = type === "line" ? attributes.get("stroke") : attributes.get("fill");
    const parameterReaders = new Map<string, () => string[]>([
      ["rect", () => [value("x"), value("y"), value("width"), value("height"), ...(optionalStyle === undefined ? [] : [optionalStyle])]],
      ["circle", () => [value("cx"), value("cy"), value("r"), ...(optionalStyle === undefined ? [] : [optionalStyle])]],
      ["ellipse", () => [value("cx"), value("cy"), value("rx"), value("ry"), ...(optionalStyle === undefined ? [] : [optionalStyle])]],
      ["line", () => [value("x1"), value("y1"), value("x2"), value("y2"), ...(optionalStyle === undefined ? [] : [optionalStyle])]],
      ["text", () => [value("x"), value("y"), text]],
      ["g", () => []],
    ]);
    const readParameters = parameterReaders.get(type);
    if (!readParameters) throw new EditorError(`unknown shape type: ${type} (is the plugin loaded?)`);
    const shape = this.create(type, id, readParameters());
    for (const styleName of ["fill", "stroke", "stroke-width"]) {
      const style = attributes.get(styleName);
      if (style !== undefined) shape.setStyle(styleName, style);
    }
    return shape;
  }

  private number(value: string | undefined, label: string): number {
    if (value === undefined || value.trim() === "") throw new EditorError(`missing parameter: ${label}`);
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new EditorError(`invalid number for ${label}: ${value}`);
    return parsed;
  }

  private requireCount(parameters: string[], minimum: number, maximum: number, usage: string): void {
    if (parameters.length < minimum || parameters.length > maximum) {
      throw new EditorError(`usage: ${usage}`);
    }
  }

  private createRect(id: string, p: string[]): Shape {
    this.requireCount(p, 4, 5, "create rect <id> <x> <y> <w> <h> [fill]");
    const shape = new RectShape(id, this.number(p[0], "x"), this.number(p[1], "y"), this.number(p[2], "w"), this.number(p[3], "h"));
    if (p[4] !== undefined) shape.setStyle("fill", p[4]);
    return shape;
  }

  private createCircle(id: string, p: string[]): Shape {
    this.requireCount(p, 3, 4, "create circle <id> <cx> <cy> <r> [fill]");
    const shape = new CircleShape(id, this.number(p[0], "cx"), this.number(p[1], "cy"), this.number(p[2], "r"));
    if (p[3] !== undefined) shape.setStyle("fill", p[3]);
    return shape;
  }

  private createEllipse(id: string, p: string[]): Shape {
    this.requireCount(p, 4, 5, "create ellipse <id> <cx> <cy> <rx> <ry> [fill]");
    const shape = new EllipseShape(id, this.number(p[0], "cx"), this.number(p[1], "cy"), this.number(p[2], "rx"), this.number(p[3], "ry"));
    if (p[4] !== undefined) shape.setStyle("fill", p[4]);
    return shape;
  }

  private createLine(id: string, p: string[]): Shape {
    this.requireCount(p, 4, 5, "create line <id> <x1> <y1> <x2> <y2> [stroke]");
    const shape = new LineShape(id, this.number(p[0], "x1"), this.number(p[1], "y1"), this.number(p[2], "x2"), this.number(p[3], "y2"));
    if (p[4] !== undefined) shape.setStyle("stroke", p[4]);
    return shape;
  }

  private createText(id: string, p: string[]): Shape {
    this.requireCount(p, 3, 3, 'create text <id> <x> <y> "content"');
    return new TextShape(id, this.number(p[0], "x"), this.number(p[1], "y"), p[2] ?? "");
  }

  private createGroup(id: string, p: string[]): Shape {
    this.requireCount(p, 0, 0, "create g <id>");
    return new GroupShape(id);
  }
}
